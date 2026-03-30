import base64
import shutil
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
_BOX_COLOR = (0, 140, 255)
_TEXT_COLOR = (255, 255, 255)
_TEXT_BG_COLOR = (18, 18, 18)
_SUMMARY_TEXT_COLOR = (255, 245, 160)
_SEVERITY_RANK = {
    "unknown": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
}


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
                class_ids = _resolve_target_class_ids(model)
                _model = model
                _model_path = model_path
                _target_class_ids = class_ids
    return _model


def reset_model_cache() -> None:
    global _model, _model_path, _target_class_ids
    with _model_lock:
        _model = None
        _model_path = None
        _target_class_ids = ()


def _default_uploaded_model_path() -> Path:
    return Path(settings.YOLO_FALLBACK_MODEL_PATHS[0])


def install_uploaded_model(file_obj: Any) -> dict[str, Any]:
    filename = getattr(file_obj, "name", "model.pt")
    if Path(filename).suffix.lower() != ".pt":
        raise ValueError("Upload a YOLO weights file with a .pt extension.")

    target_path = _default_uploaded_model_path()
    target_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pt", dir=target_path.parent) as temp_file:
        for chunk in file_obj.chunks():
            temp_file.write(chunk)
        temp_path = Path(temp_file.name)

    try:
        model = YOLO(str(temp_path))
        class_ids = _resolve_target_class_ids(model)

        backup_path = target_path.with_suffix(".pt.bak")
        if backup_path.exists():
            backup_path.unlink()
        if target_path.exists():
            shutil.move(str(target_path), str(backup_path))

        try:
            temp_path.replace(target_path)
        except Exception:
            if backup_path.exists():
                backup_path.replace(target_path)
            raise

        if backup_path.exists():
            backup_path.unlink()

        with _model_lock:
            global _model, _model_path, _target_class_ids
            _model = model
            _model_path = target_path
            _target_class_ids = class_ids

        return {
            "ready": True,
            "resolved_path": str(target_path),
            "labels": list(_model_names(model).values()),
            "target_labels": list(settings.YOLO_TARGET_LABELS),
            "detail": "",
        }
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _clip_box(
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    frame_width: int,
    frame_height: int,
) -> tuple[int, int, int, int]:
    x1 = max(0, min(x1, frame_width - 1))
    x2 = max(1, min(x2, frame_width))
    y1 = max(0, min(y1, frame_height - 1))
    y2 = max(1, min(y2, frame_height))
    if x2 <= x1:
        x2 = min(frame_width, x1 + 1)
    if y2 <= y1:
        y2 = min(frame_height, y1 + 1)
    return x1, y1, x2, y2


def _expanded_box(
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    frame_width: int,
    frame_height: int,
    padding_ratio: float = 0.3,
) -> tuple[int, int, int, int]:
    box_width = x2 - x1
    box_height = y2 - y1
    pad_x = max(6, int(box_width * padding_ratio))
    pad_y = max(6, int(box_height * padding_ratio))
    return _clip_box(
        x1 - pad_x,
        y1 - pad_y,
        x2 + pad_x,
        y2 + pad_y,
        frame_width,
        frame_height,
    )


def _road_reference_patch(
    frame_gray: np.ndarray,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
) -> np.ndarray:
    frame_height, frame_width = frame_gray.shape
    ex1, ey1, ex2, ey2 = _expanded_box(x1, y1, x2, y2, frame_width, frame_height, padding_ratio=0.36)
    expanded = frame_gray[ey1:ey2, ex1:ex2]
    if expanded.size == 0:
        return frame_gray

    mask = np.ones(expanded.shape, dtype=bool)
    inner_x1 = max(0, x1 - ex1)
    inner_y1 = max(0, y1 - ey1)
    inner_x2 = min(ex2 - ex1, x2 - ex1)
    inner_y2 = min(ey2 - ey1, y2 - ey1)
    mask[inner_y1:inner_y2, inner_x1:inner_x2] = False

    ring = expanded[mask]
    if ring.size >= 100:
        return ring

    road_band_top = min(frame_height - 1, y2)
    road_band_bottom = min(frame_height, y2 + max(16, (y2 - y1)))
    road_band = frame_gray[road_band_top:road_band_bottom, x1:x2]
    if road_band.size >= 50:
        return road_band

    fallback_top = max(0, frame_height - max(40, frame_height // 4))
    fallback = frame_gray[fallback_top:, :]
    return fallback if fallback.size else frame_gray


def _severity_from_metrics(depth_cm: float, width_m: float, distance_m: float, confidence: float) -> tuple[str, float]:
    depth_score = _clamp(depth_cm / 10.0, 0.0, 1.4)
    width_score = _clamp(width_m / 0.8, 0.0, 1.3)
    distance_score = _clamp((10.0 - distance_m) / 10.0, 0.0, 1.0)
    score = (
        depth_score * 0.48
        + width_score * 0.24
        + distance_score * 0.12
        + _clamp(confidence, 0.0, 1.0) * 0.16
    )
    if depth_cm >= 8.0 or width_m >= 0.85 or score >= 0.9:
        return "high", round(score, 3)
    if depth_cm >= 4.0 or width_m >= 0.4 or score >= 0.48:
        return "medium", round(score, 3)
    return "low", round(score, 3)


def _estimate_pothole_metrics(
    frame: np.ndarray,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    confidence: float,
) -> dict[str, Any]:
    frame_height, frame_width = frame.shape[:2]
    box_width = max(1, x2 - x1)
    box_height = max(1, y2 - y1)
    area_ratio = (box_width * box_height) / max(1, frame_width * frame_height)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    roi = gray[y1:y2, x1:x2]
    road_reference = _road_reference_patch(gray, x1, y1, x2, y2)

    pothole_brightness = float(np.median(roi)) if roi.size else 0.0
    road_brightness = float(np.median(road_reference)) if road_reference.size else pothole_brightness
    darkness_gap = _clamp((road_brightness - pothole_brightness) / 90.0, 0.0, 1.0)

    laplacian_std = float(cv2.Laplacian(roi, cv2.CV_64F).std()) if roi.size else 0.0
    roughness_score = _clamp(laplacian_std / 42.0, 0.0, 1.0)

    bottom_bias = _clamp(y2 / max(1, frame_height), 0.0, 1.0)
    normalized_width = box_width / max(1, frame_width)

    focal_length_px = max(1.0, float(settings.POTHOLE_CAMERA_FOCAL_LENGTH_PX))
    reference_width_m = max(0.1, float(settings.POTHOLE_REFERENCE_WIDTH_M))
    min_distance_m = max(0.5, float(settings.POTHOLE_DISTANCE_MIN_M))
    max_distance_m = max(min_distance_m + 1.0, float(settings.POTHOLE_DISTANCE_MAX_M))

    size_distance = (reference_width_m * focal_length_px) / box_width
    perspective_distance = min_distance_m + (1.0 - bottom_bias) * (max_distance_m - min_distance_m)
    size_weight = _clamp(normalized_width * 4.0, 0.25, 0.78)
    distance_m = _clamp(
        size_weight * size_distance + (1.0 - size_weight) * perspective_distance,
        min_distance_m,
        max_distance_m,
    )

    width_m = _clamp((box_width * distance_m) / focal_length_px, 0.08, 3.5)
    area_score = _clamp(area_ratio / 0.08, 0.0, 1.0)
    confidence_score = _clamp(confidence, 0.0, 1.0)

    depth_cm = 1.2 + (darkness_gap * 8.8) + (roughness_score * 5.2) + (area_score * 4.5)
    depth_cm += _clamp(width_m / 1.6, 0.0, 1.8)
    depth_cm = round(_clamp(depth_cm, 1.0, 25.0), 1)

    severity, severity_score = _severity_from_metrics(depth_cm, width_m, distance_m, confidence_score)
    return {
        "distance_m": round(distance_m, 2),
        "depth_cm": depth_cm,
        "width_m": round(width_m, 2),
        "severity": severity,
        "severity_score": severity_score,
        "road_brightness": round(road_brightness, 1),
        "pothole_brightness": round(pothole_brightness, 1),
        "estimation_method": "heuristic_bbox_road_contrast",
    }


def _summarize_detections(detections: list[dict[str, Any]]) -> dict[str, Any]:
    if not detections:
        return {
            "nearest_distance_m": None,
            "max_depth_cm": None,
            "max_width_m": None,
            "highest_severity": "unknown",
            "highest_severity_score": 0.0,
        }

    highest = max(
        detections,
        key=lambda item: (
            _SEVERITY_RANK.get(str(item.get("severity", "unknown")), 0),
            float(item.get("severity_score", 0.0)),
            float(item.get("depth_cm", 0.0)),
        ),
    )
    return {
        "nearest_distance_m": round(min(float(item["distance_m"]) for item in detections), 2),
        "max_depth_cm": round(max(float(item["depth_cm"]) for item in detections), 1),
        "max_width_m": round(max(float(item["width_m"]) for item in detections), 2),
        "highest_severity": str(highest.get("severity", "unknown")),
        "highest_severity_score": round(float(highest.get("severity_score", 0.0)), 3),
    }


def _draw_detections(
    frame: np.ndarray,
    result: Any,
) -> tuple[np.ndarray, int, float, list[dict[str, Any]], dict[str, Any]]:
    annotated = frame.copy()
    count = 0
    total_confidence = 0.0
    detections: list[dict[str, Any]] = []
    label_map = result.names if isinstance(result.names, dict) else _model_names(_get_model())

    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(box.cls.item())
            if class_id not in _target_class_ids:
                continue

            confidence = float(box.conf.item())
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            label = str(label_map.get(class_id, "pothole"))
            metrics = _estimate_pothole_metrics(frame, x1, y1, x2, y2, confidence)

            detection = {
                "label": label,
                "confidence": round(confidence, 4),
                "bbox": [x1, y1, x2, y2],
                "box": {
                    "x1": max(0, min(frame.shape[1], x1)),
                    "y1": max(0, min(frame.shape[0], y1)),
                    "x2": max(0, min(frame.shape[1], x2)),
                    "y2": max(0, min(frame.shape[0], y2)),
                },
                **metrics,
            }
            detections.append(detection)

            cv2.rectangle(annotated, (x1, y1), (x2, y2), _BOX_COLOR, 2)

            top_label = f"{label} {confidence:.2f} | {metrics['severity']}"
            bottom_label = f"~{metrics['distance_m']:.1f}m | ~{metrics['depth_cm']:.1f}cm"

            top_origin_y = max(28, y1 - 10)
            bottom_origin_y = min(annotated.shape[0] - 10, y2 + 24)

            for text, origin in (
                (top_label, (x1, top_origin_y)),
                (bottom_label, (x1, bottom_origin_y)),
            ):
                (text_width, text_height), baseline = cv2.getTextSize(
                    text,
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.54 if text == top_label else 0.46,
                    2,
                )
                bg_x1 = max(0, origin[0] - 4)
                bg_y1 = max(0, origin[1] - text_height - 6)
                bg_x2 = min(annotated.shape[1], origin[0] + text_width + 6)
                bg_y2 = min(annotated.shape[0], origin[1] + baseline + 4)
                cv2.rectangle(annotated, (bg_x1, bg_y1), (bg_x2, bg_y2), _TEXT_BG_COLOR, -1)
                cv2.putText(
                    annotated,
                    text,
                    origin,
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.54 if text == top_label else 0.46,
                    _TEXT_COLOR,
                    2,
                )

            count += 1
            total_confidence += confidence

    avg_confidence = round(total_confidence / count, 4) if count else 0.0
    return annotated, count, avg_confidence, detections, _summarize_detections(detections)


def _encode_image(frame: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".jpg", frame)
    if not ok:
        raise ValueError("Could not encode annotated frame.")
    payload = base64.b64encode(encoded.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{payload}"


def _run_inference(frame: np.ndarray, confidence: float) -> dict[str, Any]:
    with _inference_lock:
        result = _get_model()(frame, conf=confidence, verbose=False)[0]

    annotated, count, avg_confidence, detections, detection_summary = _draw_detections(frame, result)
    cv2.putText(
        annotated,
        f"Potholes: {count}",
        (12, 34),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        _SUMMARY_TEXT_COLOR,
        2,
    )
    return {
        "count": count,
        "avg_confidence": avg_confidence,
        "detections": detections,
        **detection_summary,
        "annotated_image": _encode_image(annotated),
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
    best_preview_score = -1.0
    stride = max(1, settings.VIDEO_FRAME_STRIDE)
    nearest_distance_m = None
    max_depth_cm = None
    max_width_m = None
    highest_severity = "unknown"
    highest_severity_score = 0.0

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
            if result["nearest_distance_m"] is not None:
                nearest_distance_m = (
                    result["nearest_distance_m"]
                    if nearest_distance_m is None
                    else min(nearest_distance_m, result["nearest_distance_m"])
                )
            if result["max_depth_cm"] is not None:
                max_depth_cm = (
                    result["max_depth_cm"]
                    if max_depth_cm is None
                    else max(max_depth_cm, result["max_depth_cm"])
                )
            if result["max_width_m"] is not None:
                max_width_m = (
                    result["max_width_m"]
                    if max_width_m is None
                    else max(max_width_m, result["max_width_m"])
                )
            if result["highest_severity_score"] >= highest_severity_score:
                highest_severity_score = result["highest_severity_score"]
                highest_severity = result["highest_severity"]

            frame_preview_score = (
                result["highest_severity_score"] * 100.0
                + float(result["count"])
                + float(result["avg_confidence"])
            )
            if preview_image is None or frame_preview_score > best_preview_score:
                preview_image = result["annotated_image"]
                preview_base_image = _encode_image(frame)
                preview_detections = result["detections"]
                preview_width = result["image_width"]
                preview_height = result["image_height"]
                best_preview_score = frame_preview_score
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
        "detections": preview_detections,
        "nearest_distance_m": nearest_distance_m,
        "max_depth_cm": max_depth_cm,
        "max_width_m": max_width_m,
        "highest_severity": highest_severity,
        "highest_severity_score": round(highest_severity_score, 3),
        "stride": stride,
    }
