from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect/image")
async def detect_image(image: UploadFile = File(...), confidence: float = Form(0.4)):
    # TODO: wire your YOLO image inference here
    return {"count": 3, "avg_confidence": 0.61, "output": "output.jpg"}


@app.post("/detect/video")
async def detect_video(video: UploadFile = File(...), confidence: float = Form(0.4)):
    # TODO: wire your YOLO video inference here
    return {"frames": 420, "count": 21, "highlights": "clip_01.mp4"}


@app.post("/detect/camera/start")
def camera_start():
    # TODO: start camera stream
    return {"status": "started"}


@app.post("/detect/camera/stop")
def camera_stop():
    # TODO: stop camera stream
    return {"status": "stopped"}


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
