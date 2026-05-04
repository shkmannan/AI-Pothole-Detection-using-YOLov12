# AI-Pothole-Detection-using-YOLOv8

This project is a Django-based pothole detection app that runs YOLO inference on uploaded images,
videos, and phone-camera frames from the browser.

## Features

- Django UI and API in one deployment
- Image, video, and live phone-camera detection
- Estimated pothole distance, depth, and severity
- Shared map/report workflow for confirmed detections
- Render deployment support

## Local run

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set environment variables from `.env.example`.
4. Make sure a trained model exists at `training_runs/detect/pothole_model/weights/best.pt`,
   or set `YOLO_MODEL_PATH` to another trained checkpoint.
5. Start Django:

```bash
python manage.py migrate
python manage.py runserver
```

6. Open `http://127.0.0.1:8000/`.

The default `yolov8n.pt` file is a generic COCO model and will not detect potholes correctly.

## Model behavior

- The app defaults to `training_runs/detect/pothole_model/weights/best.pt`.
- `YOLO_TARGET_LABELS` defaults to `pothole,potholes,object,objects` so the bundled model's class
  names are interpreted correctly.
- The UI no longer uses runtime `.pt` upload. Model status is shown as read-only in the dashboard.

## Render deployment

- `render.yaml` defines the web service.
- `Procfile` starts Gunicorn.
- The default deployed model path is
  `/opt/render/project/src/training_runs/detect/pothole_model/weights/best.pt`.
- The build runs `python scripts/verify_model.py` so deployment fails early if the model is missing
  or invalid.

Important: Render cannot access a physical phone camera from the server. The phone camera works
because the browser on the phone captures frames and uploads them to Django over HTTPS.

### Using the deployed app

1. Open your Render app URL in a browser.
2. Wait for the dashboard health check to finish.
3. Confirm the model status card says the pothole model is ready.
4. For still images, upload a file in the Image detection card and click `Detect potholes`.
5. For road clips, upload a file in the Video detection card and click `Analyze video`.
6. For live detection, open the same Render URL on your phone, allow camera permission, tap
   `Start camera`, then tap `Start live detection`.

### Deploying the trained model to Render

Because Render deploys from your repository, the trained checkpoint must also be in the repo.

Track this file:

- `training_runs/detect/pothole_model/weights/best.pt`

After training or replacing the checkpoint locally:

```bash
git add training_runs/detect/pothole_model/weights/best.pt
git commit -m "Update bundled pothole model"
git push
```

## Estimated pothole metrics

The app returns approximate:

- camera-to-pothole distance in meters
- pothole depth in centimeters
- severity labels: low, medium, high

These values are heuristic estimates based on bounding-box size, image position, and road-contrast
sampling around each detected pothole. They are useful for prioritization, but they are not a
replacement for calibrated depth sensors or manual field measurement.
