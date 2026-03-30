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
_model_path = None
_target_class_ids: tuple[int, ...] = ()
_model_lock = threading.Lock()
_inference_lock = threading.Lock()


def _normalize_label(label: Any) -> str:
    return str(label).strip().lower().replace("-", " ").replace("_", " ")


def _candidate_model_paths() -> list[Path]:
    explicit_path = Path(settings.YOLO_MODEL_PATH)
    fallback_paths = [Path(path) for path in settings.YOLO_FALLBACK_MODEL_PATHS]
    candidates = [explicit_path, *fallback_paths]
    if not settings.YOLO_MODEL_PATH_EXPLICIT:
        candidates = [*fallback_paths, explicit_path]

    unique_candidates = []
    seen = set()
    for candidate in candidates:
        resolved = str(candidate)
        if resolved in seen:
            continue
        seen.add(resolved)
        unique_candidates.append(candidate)
    return unique_candidates


def _resolve_model_path() -> Path:
    candidates = _candidate_model_paths()
    for candidate in candidates:
        if candidate.exists():
            return candidate

    searched_paths = ", ".join(str(path) for path in candidates)
    raise FileNotFoundError(
        "YOLO model file not found. "
        f"Searched: {searched_paths}. "
        "Train the pothole model first or set YOLO_MODEL_PATH to your trained weights."
    )


def _model_names(model: YOLO) -> dict[int, str]:
    names = model.names
    if isinstance(names, dict):
        return {int(index): str(label) for index, label in names.items()}
    return {index: str(label) for index, label in enumerate(names)}


def _resolve_target_class_ids(model: YOLO) -> tuple[int, ...]:
    label_map = _model_names(model)
    if len(label_map) == 1:
        return tuple(label_map.keys())

    target_labels = {_normalize_label(label) for label in settings.YOLO_TARGET_LABELS}
    class_ids = tuple(
        index for index, label in label_map.items() if _normalize_label(label) in target_labels
    )
    if class_ids:
        return class_ids

    available_labels = ", ".join(label_map.values())
    expected_labels = ", ".join(settings.YOLO_TARGET_LABELS)
    raise RuntimeError(
        "Configured YOLO model does not expose a pothole class. "
        f"Expected one of: {expected_labels}. "
        f"Model classes: {available_labels}. "
        "Point YOLO_MODEL_PATH to the trained pothole weights."
    )


def _get_model() -> YOLO:
    global _model, _model_path, _target_class_ids
    if _model is None:
        with _model_lock:
            if _model is None:
                model_path = _resolve_model_path()
                model = YOLO(str(model_path))
                _target_class_ids = _resolve_target_class_ids(model)
                _model = model
                _model_path = model_path
    return _model


def _serialize_detections(frame: np.ndarray, result: Any) -> tuple[list[dict[str, Any]], int, float]:
    detections: list[dict[str, Any]] = []
    label_map = result.names if isinstance(result.names, dict) else _model_names(_get_model())
    frame_height, frame_width = frame.shape[:2]

    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(box.cls.item())
            if class_id not in _target_class_ids:
                continue

            confidence = float(box.conf.item())
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            label = str(label_map.get(class_id, "pothole"))
            detections.append(
                {
                    "label": label,
                    "confidence": round(confidence, 4),
                    "box": {
                        "x1": max(0, min(frame_width, x1)),
                        "y1": max(0, min(frame_height, y1)),
                        "x2": max(0, min(frame_width, x2)),
                        "y2": max(0, min(frame_height, y2)),
                    },
                }
            )

    count = len(detections)
    total_confidence = sum(float(detection["confidence"]) for detection in detections)
    avg_confidence = round(total_confidence / count, 4) if count else 0.0
    return detections, count, avg_confidence


def _draw_detections(frame: np.ndarray, detections: list[dict[str, Any]]) -> np.ndarray:
    annotated = frame.copy()
    for detection in detections:
        box = detection["box"]
        x1 = int(box["x1"])
        y1 = int(box["y1"])
        x2 = int(box["x2"])
        y2 = int(box["y2"])
        label = str(detection["label"])
        confidence = float(detection["confidence"])

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (14, 184, 122), 2)
        cv2.putText(
            annotated,
            f"{label} {confidence:.2f}",
            (x1, max(24, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (14, 184, 122),
            2,
        )
    return annotated


def _encode_image(frame: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".jpg", frame)
    if not ok:
        raise ValueError("Could not encode annotated frame.")
    payload = base64.b64encode(encoded.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{payload}"


def _run_inference(frame: np.ndarray, confidence: float) -> dict[str, Any]:
    with _inference_lock:
        result = _get_model()(frame, conf=confidence, verbose=False)[0]

    detections, count, avg_confidence = _serialize_detections(frame, result)
    annotated = _draw_detections(frame, detections)
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
        "detections": detections,
        "image_width": int(frame.shape[1]),
        "image_height": int(frame.shape[0]),
    }


def get_model_status() -> dict[str, Any]:
    try:
        model = _get_model()
        return {
            "ready": True,
            "resolved_path": str(_model_path),
            "labels": list(_model_names(model).values()),
            "target_labels": list(settings.YOLO_TARGET_LABELS),
            "detail": "",
        }
    except Exception as error:
        return {
            "ready": False,
            "resolved_path": None,
            "labels": [],
            "target_labels": list(settings.YOLO_TARGET_LABELS),
            "detail": str(error),
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
    preview_base_image = None
    preview_detections: list[dict[str, Any]] = []
    preview_width = 0
    preview_height = 0
    preview_count = -1
    preview_avg_confidence = -1.0
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
            if (
                preview_image is None
                or result["count"] > preview_count
                or (
                    result["count"] == preview_count
                    and result["avg_confidence"] > preview_avg_confidence
                )
            ):
                preview_image = result["annotated_image"]
                preview_base_image = _encode_image(frame)
                preview_detections = result["detections"]
                preview_width = result["image_width"]
                preview_height = result["image_height"]
                preview_count = result["count"]
                preview_avg_confidence = result["avg_confidence"]
    finally:
        capture.release()
        temp_path.unlink(missing_ok=True)

    return {
        "frames_processed": frames_processed,
        "frames_seen": frames_seen,
        "count": total_detections,
        "peak_detections": peak_detections,
        "preview_image": preview_image,
        "preview_base_image": preview_base_image,
        "preview_detections": preview_detections,
        "preview_width": preview_width,
        "preview_height": preview_height,
        "stride": stride,
    }
