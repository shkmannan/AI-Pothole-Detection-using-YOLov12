import cv2
from ultralytics import YOLO
import os

model_path = r'C:\Users\sidharth sumeshdas\runs\detect\runs\detect\pothole_model2\weights\best.pt'
model = YOLO(model_path)

print("Connecting to DroidCam (USB)...")
print("Make sure DroidCam is running on both phone and PC\n")

# DroidCam usually creates a virtual webcam at index 1 or 2
# Try different indices if one doesn't work
cap = cv2.VideoCapture(1)  # Try 1, 2, or 3

if not cap.isOpened():
    print("Trying camera index 2...")
    cap = cv2.VideoCapture(2)
    
if not cap.isOpened():
    print("Trying camera index 3...")
    cap = cv2.VideoCapture(3)

if not cap.isOpened():
    print("ERROR: Cannot connect to DroidCam")
    print("Make sure DroidCam is running and connected via USB")
    exit()

print("Connected! Starting detection...")
print("Press 'q' to quit\n")

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("Failed to grab frame")
        break
    
    results = model(frame, conf=0.5, verbose=False)
    annotated_frame = results[0].plot()
    
    detections = len(results[0].boxes)
    cv2.putText(annotated_frame, f'Potholes: {detections}', 
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
    cv2.imshow('DroidCam - Pothole Detection (Press Q to quit)', annotated_frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("\nDetection stopped")