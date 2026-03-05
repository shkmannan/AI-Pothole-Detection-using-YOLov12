import cv2

print("Checking all cameras...\n")

# Test camera 0
print("Camera 0:")
cap = cv2.VideoCapture(0)
if cap.isOpened():
    ret, frame = cap.read()
    if ret:
        cv2.imshow('Camera 0 - Is this your PHONE? (wait 3 sec)', frame)
        cv2.waitKey(3000)
cap.release()
cv2.destroyAllWindows()

# Test camera 1
print("Camera 1:")
cap = cv2.VideoCapture(1)
if cap.isOpened():
    ret, frame = cap.read()
    if ret:
        cv2.imshow('Camera 1 - Is this your PHONE? (wait 3 sec)', frame)
        cv2.waitKey(3000)
    else:
        print("Camera 1: Cannot read frames")
else:
    print("Camera 1: Not available")
cap.release()
cv2.destroyAllWindows()

# Test camera 2
print("Camera 2:")
cap = cv2.VideoCapture(2)
if cap.isOpened():
    ret, frame = cap.read()
    if ret:
        cv2.imshow('Camera 2 - Is this your PHONE? (wait 3 sec)', frame)
        cv2.waitKey(3000)
    else:
        print("Camera 2: Cannot read frames")
else:
    print("Camera 2: Not available")
cap.release()
cv2.destroyAllWindows()

print("\nDone! Which camera showed your phone?")