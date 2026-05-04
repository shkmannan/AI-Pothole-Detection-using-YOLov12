import os
from pathlib import Path

import torch
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent


def _get_int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        print(f"Invalid {name}={value!r}; using default {default}.")
        return default

print("Starting YOLOv8 Pothole Detection Training...")

# Load pretrained YOLOv8 model
# yolov8n.pt = nano (fastest, for testing)
# yolov8s.pt = small
# yolov8m.pt = medium (better accuracy)
model_name = os.getenv("TRAIN_MODEL", "yolov8n.pt")
model = YOLO(model_name)

# Your dataset path from Roboflow
data_path = BASE_DIR / "pothole-detection-1" / "data.yaml"
project_dir = BASE_DIR / os.getenv("TRAIN_PROJECT", "training_runs/detect")

# Check if dataset exists
if not data_path.exists():
    print("Dataset not found!")
    print(f"Looking for: {data_path}")
    print("Make sure you've downloaded the dataset from Roboflow first.")
    exit()

print(f"Dataset found: {data_path}")
has_cuda = torch.cuda.is_available()
default_device = "0" if has_cuda else "cpu"
device = os.getenv("TRAIN_DEVICE", default_device)
is_cpu_run = device == "cpu"
epochs = _get_int_env("TRAIN_EPOCHS", 30 if is_cpu_run else 100)
imgsz = _get_int_env("TRAIN_IMGSZ", 512 if is_cpu_run else 640)
batch = _get_int_env("TRAIN_BATCH", 8 if is_cpu_run else 16)
patience = _get_int_env("TRAIN_PATIENCE", 10 if is_cpu_run else 20)

print("Training configuration:")
print(f"- model: {model_name}")
print(f"- device: {device}")
print(f"- epochs: {epochs}")
print(f"- image size: {imgsz}")
print(f"- batch size: {batch}")
print(f"- patience: {patience}")
print("Starting training...")

# Train the model
results = model.train(
    data=str(data_path),
    epochs=epochs,           # Lower CPU defaults to speed up local training.
    imgsz=imgsz,
    batch=batch,
    device=device,
    project=str(project_dir),
    name="pothole_model",
    exist_ok=True,
    patience=patience,
    save=True,
    plots=True,
)

print("\nTraining Complete!")
print("Best model saved to: runs/detect/pothole_model/weights/best.pt")
print(f"Training results: {results.save_dir}")
print("\nNext step: Run 'python detect.py' to test your model!")
