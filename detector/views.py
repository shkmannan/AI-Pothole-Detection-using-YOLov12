import json

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from .models import PotholeReport
from .services import (
    analyze_uploaded_video,
    get_model_status,
    infer_uploaded_image,
    install_uploaded_model,
)


def _parse_confidence(request: HttpRequest) -> float:
    raw_value = request.POST.get("confidence", "0.4")
    try:
        confidence = float(raw_value)
    except (TypeError, ValueError):
        confidence = 0.4
    return max(0.0, min(1.0, confidence))


def _parse_optional_float(value):
    if value in (None, ""):
        return None
    return float(value)


@require_GET
def index(request: HttpRequest):
    return render(
        request,
        "detector/index.html",
        {
            "model_path": settings.YOLO_MODEL_PATH,
            "video_stride": settings.VIDEO_FRAME_STRIDE,
        },
    )


@require_GET
def health(request: HttpRequest):
    model_status = get_model_status()
    return JsonResponse(
        {
            "status": "ok" if model_status["ready"] else "degraded",
            "app": "django",
            "model_path": settings.YOLO_MODEL_PATH,
            "resolved_model_path": model_status["resolved_path"],
            "model_ready": model_status["ready"],
            "model_labels": model_status["labels"],
            "target_labels": model_status["target_labels"],
            "detail": model_status["detail"],
        },
        status=200 if model_status["ready"] else 503,
    )


@require_POST
def upload_model(request: HttpRequest):
    uploaded_model = request.FILES.get("model")
    if uploaded_model is None:
        return JsonResponse({"detail": "Upload a YOLO .pt weights file."}, status=400)

    try:
        result = install_uploaded_model(uploaded_model)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    except RuntimeError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    except Exception as error:
        return JsonResponse({"detail": f"Model install failed: {error}"}, status=500)

    return JsonResponse(result, status=201)


@require_POST
def detect_image(request: HttpRequest):
    uploaded_image = request.FILES.get("image")
    if uploaded_image is None:
        return JsonResponse({"detail": "Upload an image file."}, status=400)

    try:
        result = infer_uploaded_image(uploaded_image, _parse_confidence(request))
    except FileNotFoundError as error:
        return JsonResponse({"detail": str(error)}, status=500)
    except RuntimeError as error:
        return JsonResponse({"detail": str(error)}, status=500)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    except Exception as error:
        return JsonResponse({"detail": f"Image detection failed: {error}"}, status=500)

    return JsonResponse(result)


@require_POST
def detect_video(request: HttpRequest):
    uploaded_video = request.FILES.get("video")
    if uploaded_video is None:
        return JsonResponse({"detail": "Upload a video file."}, status=400)

    try:
        result = analyze_uploaded_video(uploaded_video, _parse_confidence(request))
    except FileNotFoundError as error:
        return JsonResponse({"detail": str(error)}, status=500)
    except RuntimeError as error:
        return JsonResponse({"detail": str(error)}, status=500)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    except Exception as error:
        return JsonResponse({"detail": f"Video detection failed: {error}"}, status=500)

    return JsonResponse(result)


@require_POST
def detect_frame(request: HttpRequest):
    uploaded_frame = request.FILES.get("frame")
    if uploaded_frame is None:
        return JsonResponse({"detail": "Upload a frame image."}, status=400)

    try:
        result = infer_uploaded_image(uploaded_frame, _parse_confidence(request))
    except FileNotFoundError as error:
        return JsonResponse({"detail": str(error)}, status=500)
    except RuntimeError as error:
        return JsonResponse({"detail": str(error)}, status=500)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    except Exception as error:
        return JsonResponse({"detail": f"Frame detection failed: {error}"}, status=500)

    return JsonResponse(result)


@require_GET
def list_reports(request: HttpRequest):
    reports = list(
        PotholeReport.objects.values(
            "id",
            "source",
            "latitude",
            "longitude",
            "detections_count",
            "avg_confidence",
            "accuracy_m",
            "distance_m",
            "depth_cm",
            "severity",
            "created_at",
        )[:200]
    )
    return JsonResponse({"reports": reports})


@require_POST
def create_report(request: HttpRequest):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    try:
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
        detections_count = int(payload.get("detections_count", 0))
        avg_confidence = float(payload.get("avg_confidence", 0.0))
        accuracy_m = _parse_optional_float(payload.get("accuracy_m"))
        distance_m = _parse_optional_float(payload.get("distance_m"))
        depth_cm = _parse_optional_float(payload.get("depth_cm"))
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Latitude, longitude, and detection values are invalid."}, status=400)

    source = str(payload.get("source", "unknown")).strip() or "unknown"
    valid_severities = {choice for choice, _label in PotholeReport.SEVERITY_CHOICES}
    severity = str(payload.get("severity", "unknown")).strip().lower() or "unknown"
    if severity not in valid_severities:
        severity = "unknown"

    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return JsonResponse({"detail": "Latitude or longitude is out of range."}, status=400)
    if detections_count <= 0:
        return JsonResponse({"detail": "Only positive pothole detections can be reported."}, status=400)

    report = PotholeReport.objects.create(
        source=source[:32],
        latitude=latitude,
        longitude=longitude,
        detections_count=detections_count,
        avg_confidence=max(0.0, min(1.0, avg_confidence)),
        accuracy_m=accuracy_m,
        distance_m=distance_m,
        depth_cm=depth_cm,
        severity=severity,
    )
    return JsonResponse(
        {
            "id": report.id,
            "source": report.source,
            "latitude": float(report.latitude),
            "longitude": float(report.longitude),
            "detections_count": report.detections_count,
            "avg_confidence": report.avg_confidence,
            "accuracy_m": report.accuracy_m,
            "distance_m": report.distance_m,
            "depth_cm": report.depth_cm,
            "severity": report.severity,
            "created_at": report.created_at.isoformat(),
        },
        status=201,
    )
