import cv2
from ultralytics import YOLO
import requests
import time
import csv
import os
import math

# -------- MODEL --------
model_path = r"runs/detect/pothole_model3/weights/best.pt"
model = YOLO(model_path)

# -------- PHONE IP CAMERA --------
url = "http://10.79.163.16:8080/video"
gps_url = "http://10.79.163.16:8080/gps.json"

print("Connecting to phone IP camera...")

cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("ERROR: Could not connect to IP camera")
    exit()

cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

print("Connected! Starting pothole detection...")
print("Press 'q' to quit\n")

# -------- WINDOW SETUP --------
try:
    import ctypes
    user32 = ctypes.windll.user32
    screen_width = user32.GetSystemMetrics(0)
    screen_height = user32.GetSystemMetrics(1)
except:
    screen_width, screen_height = 1920, 1080

window_width = int(screen_width * 0.7)
window_height = int(screen_height * 0.7)

cv2.namedWindow("IP Camera - Pothole Detection (Press Q to quit)", cv2.WINDOW_NORMAL)
cv2.resizeWindow(
    "IP Camera - Pothole Detection (Press Q to quit)",
    window_width,
    window_height
)

# -------- GPS FUNCTION --------
def get_gps():
    try:
        response = requests.get(gps_url, timeout=0.5)
        data = response.json()

        if "gps" in data:
            lat = data["gps"]["latitude"]
            lon = data["gps"]["longitude"]
            return lat, lon

        return None, None

    except Exception as e:
        print("GPS ERROR:", e)
        return None, None


# -------- DISTANCE FUNCTION --------
def gps_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))


# -------- LOG FILE --------
file_exists = os.path.isfile("pothole_log.csv")

log_file = open("pothole_log.csv", "a", newline="")
writer = csv.writer(log_file)

if not file_exists:
    writer.writerow(["timestamp", "latitude", "longitude", "potholes"])


# -------- STATE VARIABLES --------
lat, lon = None, None
frame_count = 0
skip_frames = 1

stable_frames = 0
min_frames_detected = 3

last_logged_lat = None
last_logged_lon = None
last_log_time = 0

min_distance = 3
min_time_gap = 2


# -------- DETECTION LOOP --------
while True:

    ret, frame = cap.read()

    if not ret:
        print("Failed to grab frame")
        break

    frame_count += 1

    # Update GPS 
    if frame_count %14 == 0:
        lat, lon = get_gps()

    # Skip frames
    if frame_count % (skip_frames + 1) != 0:
        continue

    inference_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)

    results = model(inference_frame, conf=0.4, verbose=False)

    annotated_frame = results[0].plot()

    detections = len(results[0].boxes)

    # Display count
    cv2.putText(
        annotated_frame,
        f"Potholes Detected: {detections}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    # Display GPS
    if lat and lon:
        cv2.putText(
            annotated_frame,
            f"GPS: {lat:.5f}, {lon:.5f}",
            (10, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

    # -------- SMART LOGGING --------
    if detections > 0:

        stable_frames += 1

        if stable_frames >= min_frames_detected:

            current_time = time.time()
            readable_time = time.strftime("%Y-%m-%d %H:%M:%S")
            
            should_log = False

            if last_logged_lat is None:
                should_log = True

            elif lat and lon:

                dist = gps_distance(lat, lon, last_logged_lat, last_logged_lon)

                if dist > min_distance and (current_time - last_log_time) > min_time_gap:
                    should_log = True

            if should_log:

                writer.writerow([
                    readable_time,
                    lat if lat else "no_gps",
                    lon if lon else "no_gps",
                    detections
                ])

                log_file.flush()

                print(f"[LOGGED] pothole @ ({lat:.6f}, {lon:.6f})")

                last_logged_lat = lat
                last_logged_lon = lon
                last_log_time = current_time

    else:
        stable_frames = 0


    cv2.imshow(
        "IP Camera - Pothole Detection (Press Q to quit)",
        annotated_frame
    )

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap.release()
cv2.destroyAllWindows()
log_file.close()

print("Detection stopped")