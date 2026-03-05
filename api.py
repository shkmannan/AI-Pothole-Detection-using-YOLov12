import os
import threading
from typing import Generator

import cv2
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from ultralytics import YOLO

MODEL_PATH = os.getenv(
    "YOLO_MODEL_PATH",
    r"C:\Users\sidharth sumeshdas\runs\detect\runs\detect\pothole_model2\weights\best.pt",
)
DEFAULT_CAMERA_URL = os.getenv("CAMERA_URL", "http://192.0.0.8:8080/video")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CameraStartRequest(BaseModel):
    camera_url: str = Field(default=DEFAULT_CAMERA_URL)
    confidence: float = Field(default=0.4, ge=0.0, le=1.0)


class CameraRuntimeState:
    def __init__(self) -> None:
        self.active = False
        self.camera_url = DEFAULT_CAMERA_URL
        self.confidence = 0.4
        self.lock = threading.Lock()


camera_state = CameraRuntimeState()
_model = None
_model_lock = threading.Lock()


def get_model() -> YOLO:
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = YOLO(MODEL_PATH)
    return _model


def annotate_frame(frame, confidence: float):
    results = get_model()(frame, conf=confidence, verbose=False)
    annotated = results[0].plot()
    detections = len(results[0].boxes)
    cv2.putText(
        annotated,
        f"Potholes: {detections}",
        (12, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        2,
    )
    return annotated


def camera_stream_generator(capture: cv2.VideoCapture) -> Generator[bytes, None, None]:
    try:
        while True:
            with camera_state.lock:
                if not camera_state.active:
                    break
                confidence = camera_state.confidence

            ok, frame = capture.read()
            if not ok:
                break

            try:
                output_frame = annotate_frame(frame, confidence)
            except Exception:
                output_frame = frame

            encoded, jpg = cv2.imencode(".jpg", output_frame)
            if not encoded:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + jpg.tobytes() + b"\r\n"
            )
    finally:
        capture.release()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect/image")
async def detect_image(image: UploadFile = File(...), confidence: float = Form(0.4)):
    # TODO: wire full YOLO image inference and save output.
    return {"count": 3, "avg_confidence": 0.61, "output": "output.jpg", "confidence": confidence}


@app.post("/detect/video")
async def detect_video(video: UploadFile = File(...), confidence: float = Form(0.4)):
    # TODO: wire full YOLO video inference and save highlights.
    return {"frames": 420, "count": 21, "highlights": "clip_01.mp4", "confidence": confidence}


@app.post("/detect/camera/start")
def camera_start(payload: CameraStartRequest):
    camera_url = payload.camera_url.strip() or DEFAULT_CAMERA_URL
    with camera_state.lock:
        camera_state.active = True
        camera_state.camera_url = camera_url
        camera_state.confidence = payload.confidence

    return {
        "status": "started",
        "camera_url": camera_state.camera_url,
        "confidence": camera_state.confidence,
    }


@app.post("/detect/camera/stop")
def camera_stop():
    with camera_state.lock:
        camera_state.active = False
    return {"status": "stopped"}


@app.get("/detect/camera/status")
def camera_status():
    with camera_state.lock:
        return {
            "active": camera_state.active,
            "camera_url": camera_state.camera_url,
            "confidence": camera_state.confidence,
        }


@app.get("/detect/camera/stream")
def camera_stream():
    with camera_state.lock:
        if not camera_state.active:
            raise HTTPException(status_code=409, detail="Camera is not active. Start stream first.")
        camera_url = camera_state.camera_url

    capture = cv2.VideoCapture(camera_url)
    if not capture.isOpened():
        capture.release()
        raise HTTPException(status_code=503, detail=f"Could not connect to camera: {camera_url}")

    return StreamingResponse(
        camera_stream_generator(capture),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
