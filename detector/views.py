from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from .services import analyze_uploaded_video, get_model_status, infer_uploaded_image


def _parse_confidence(request: HttpRequest) -> float:
    raw_value = request.POST.get("confidence", "0.4")
    try:
        confidence = float(raw_value)
    except (TypeError, ValueError):
        confidence = 0.4
    return max(0.0, min(1.0, confidence))


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
