from ultralytics import YOLO
import os

print("Starting YOLOv8 Pothole Detection Training...")

# Load pretrained YOLOv8 model
# yolov8n.pt = nano (fastest, for testing)
# yolov8s.pt = small
# yolov8m.pt = medium (better accuracy)
model = YOLO('yolov8n.pt')

# Your dataset path from Roboflow
data_path = 'pothole-detection-1/data.yaml'

# Check if dataset exists
if not os.path.exists(data_path):
    print("Dataset not found!")
    print(f"Looking for: {data_path}")
    print("Make sure you've downloaded the dataset from Roboflow first.")
    exit()

print(f"Dataset found: {data_path}")
print("Starting training...")

# Train the model
results = model.train(
    data=data_path,
    epochs=100,              # Training cycles (more = better, but slower)
    imgsz=640,               # Image size
    batch=16,                # Reduce to 8 if you get memory errors
    device='cpu',            # Change to 0 if you have NVIDIA GPU
    project='runs/detect',
    name='pothole_model',
    patience=20,             # Early stopping if no improvement
    save=True,
    plots=True,
)

print("\nTraining Complete!")
print("Best model saved to: runs/detect/pothole_model/weights/best.pt")
print(f"Training results: {results.save_dir}")
print("\nNext step: Run 'python detect.py' to test your model!")
