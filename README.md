# AI-Pothole-Detection-using-YOLOv8
🚧 Pothole Detection & Severity Analysis (YOLOv8 + Django)
📌 Overview

This project is a production-style pothole detection system built using YOLOv8, OpenCV, and Django, designed to work with real-world inputs including mobile browser camera streams, images, and videos.

Unlike typical object detection demos, this system focuses on:

🌍 Real-world usability (mobile camera support)
⚙️ End-to-end deployment (UI + backend in one service)
📊 Actionable insights (severity, depth, distance estimation)
🎯 Key Features
🚀 Real-time pothole detection using YOLOv8
📱 Phone camera integration via browser (no app required)
🎥 Supports image, video, and live camera input
📊 Severity classification: Low / Medium / High
📏 Estimated pothole distance (m) and depth (cm)
🌐 Fully integrated Django backend + UI deployment
☁️ Ready for deployment on platforms like Render
🧠 System Architecture
🔹 Frontend (Browser)
Uses navigator.mediaDevices.getUserMedia()
Captures frames directly from the phone camera
Sends frames to backend over HTTPS
🔹 Backend (Django)
Handles:
Image/video uploads
Live camera frame processing
Runs YOLOv8 inference
Returns:
Bounding boxes
Severity labels
Distance & depth estimates
🔹 Model
Custom-trained YOLOv8 model on pothole dataset
Filters detections using:
YOLO_TARGET_LABELS = pothole, potholes
⚙️ What Makes This Different

Most YOLO projects:

Run locally on static images

This system:

✅ Works on live phone camera
✅ Handles real-time uploads + inference
✅ Combines frontend + backend + ML in one pipeline
✅ Simulates real deployment constraints
🚧 Challenges & What Broke
❌ 1. “Works locally, fails in real-world”
Model accuracy dropped with:
Lighting changes
Camera angles
Road textures

✅ Fix:

Improved dataset quality
Better annotations
Iterative retraining
❌ 2. False Positives (patches, shadows)
Non-pothole regions detected incorrectly

✅ Fix:

Tuned confidence thresholds
Added label filtering (YOLO_TARGET_LABELS)
Refined training data
❌ 3. Live Camera Integration
Backend cannot directly access phone camera

✅ Fix:

Used browser camera (getUserMedia)
Streamed frames via HTTPS to Django backend
❌ 4. Model Not Loaded / Deployment Issues
Default YOLO model didn’t detect potholes

✅ Fix:

Enforced custom weights (best.pt)
Added UI-based model upload system
📊 Estimated Pothole Metrics

The system provides approximate:

📏 Distance from camera (meters)
🕳️ Depth (centimeters)
⚠️ Severity classification

⚠️ Note:
These are heuristic estimates based on:

Bounding box size
Frame position
Local contrast sampling

They are useful for:

Prioritization
Monitoring
But not a replacement for calibrated sensors.
🛠️ Tech Stack
Python
YOLOv8 (Ultralytics)
Django (Backend + UI)
OpenCV
JavaScript (Browser Camera API)
NumPy / Pandas
