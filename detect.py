import cv2
from ultralytics import YOLO

# -------- MODEL --------
model_path = r"C:\Users\sidharth sumeshdas\runs\detect\runs\detect\pothole_model2\weights\best.pt"
model = YOLO(model_path)

# -------- PHONE IP CAMERA --------
url = "http://192.168.167.186:8080/video"

print("Connecting to phone IP camera...")

cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("ERROR: Could not connect to IP camera")
    exit()

print("Connected! Starting pothole detection...")
print("Press 'q' to quit\n")

# -------- DETECTION LOOP --------
while True:

    ret, frame = cap.read()

    if not ret:
        print("Failed to grab frame")
        break

    # Run YOLO detection
    results = model(frame, conf=0.5, verbose=False)

    annotated_frame = results[0].plot()

    # Count potholes
    detections = len(results[0].boxes)

    cv2.putText(
        annotated_frame,
        f"Potholes Detected: {detections}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.imshow("IP Camera - Pothole Detection (Press Q to quit)", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap.release()
cv2.destroyAllWindows()

print("Detection stopped")