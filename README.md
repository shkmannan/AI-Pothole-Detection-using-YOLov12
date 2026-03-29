# AI-Pothole-Detection-using-YOLOv12

This project is now a Django app that serves the UI and the detection API from one deployment.
Instead of a hardcoded IP webcam URL, the live camera flow uses the browser camera on the phone
that opens the site.

## What changed

- Django replaces the previous FastAPI plus static frontend split.
- Live detection uses `navigator.mediaDevices.getUserMedia()` in the browser.
- The backend receives uploaded images, videos, and phone-camera frames for YOLO inference.
- Render deployment files are included in the repo.

## Local run

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set environment variables from `.env.example`.
4. Train or provide pothole-specific weights.

If you train with `train.py`, the expected output is `runs/detect/pothole_model/weights/best.pt`.
The default `yolov8n.pt` file is a generic COCO model and will not detect potholes correctly.

5. Start Django:

```bash
python manage.py runserver
```

6. Open `http://127.0.0.1:8000/`.

To use the phone camera locally, either open the app directly on the phone through a reachable local
development URL or deploy to Render so the app is served over HTTPS.

## Render deployment

- `render.yaml` defines the web service.
- `Procfile` starts Gunicorn.
- Set `YOLO_MODEL_PATH` to your trained model weights if you are not using the default file.
- `YOLO_TARGET_LABELS` defaults to `pothole,potholes` and is used to filter detections to the pothole class only.

Important: Render cannot access a physical phone camera from the server. The phone camera works
because the browser on the phone captures frames and uploads them to Django over HTTPS.
