import base64
import tempfile
import threading
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from django.conf import settings
from ultralytics import YOLO


_model = None
_model_lock = threading.Lock()
_inference_lock = threading.Lock()


def _get_model() -> YOLO:
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                model_path = Path(settings.YOLO_MODEL_PATH)
                if not model_path.exists():
                    raise FileNotFoundError(
                        f"YOLO model file not found at {model_path}. "
                        "Set YOLO_MODEL_PATH to your trained weights."
                    )
                _model = YOLO(str(model_path))
    return _model


def _encode_image(frame: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".jpg", frame)
    if not ok:
        raise ValueError("Could not encode annotated frame.")
    payload = base64.b64encode(encoded.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{payload}"


def _summarize_result(result: Any) -> tuple[int, float]:
    boxes = result.boxes
    count = len(boxes)
    if count == 0:
        return 0, 0.0
    confidences = boxes.conf.tolist()
    avg_confidence = float(sum(confidences) / len(confidences))
    return count, round(avg_confidence, 4)


def _run_inference(frame: np.ndarray, confidence: float) -> dict[str, Any]:
    with _inference_lock:
        result = _get_model()(frame, conf=confidence, verbose=False)[0]

    annotated = result.plot()
    count, avg_confidence = _summarize_result(result)
    cv2.putText(
        annotated,
        f"Potholes: {count}",
        (12, 34),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        2,
    )
    return {
        "count": count,
        "avg_confidence": avg_confidence,
        "annotated_image": _encode_image(annotated),
    }


def infer_uploaded_image(file_obj: Any, confidence: float) -> dict[str, Any]:
    file_bytes = file_obj.read()
    frame = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Unsupported image file.")

    result = _run_inference(frame, confidence)
    result["filename"] = getattr(file_obj, "name", "image")
    return result


def analyze_uploaded_video(file_obj: Any, confidence: float) -> dict[str, Any]:
    suffix = Path(getattr(file_obj, "name", "video.mp4")).suffix or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        for chunk in file_obj.chunks():
            temp_file.write(chunk)
        temp_path = Path(temp_file.name)

    capture = cv2.VideoCapture(str(temp_path))
    if not capture.isOpened():
        temp_path.unlink(missing_ok=True)
        raise ValueError("Unsupported video file.")

    frames_seen = 0
    frames_processed = 0
    total_detections = 0
    peak_detections = 0
    preview_image = None
    stride = max(1, settings.VIDEO_FRAME_STRIDE)

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break

            frames_seen += 1
            if frames_seen % stride != 0:
                continue

            frames_processed += 1
            result = _run_inference(frame, confidence)
            total_detections += result["count"]
            peak_detections = max(peak_detections, result["count"])
            if preview_image is None:
                preview_image = result["annotated_image"]
    finally:
        capture.release()
        temp_path.unlink(missing_ok=True)

    return {
        "frames_processed": frames_processed,
        "frames_seen": frames_seen,
        "count": total_detections,
        "peak_detections": peak_detections,
        "preview_image": preview_image,
        "stride": stride,
    }
