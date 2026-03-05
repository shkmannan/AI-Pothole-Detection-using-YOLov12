import cv2

url = "http://10.79.163.16:8080/video"  #can use https and change ip accordingly

cap = cv2.VideoCapture(url)

while True:
    ret, frame = cap.read()

    if not ret:
        break

    cv2.imshow("Phone Camera", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
