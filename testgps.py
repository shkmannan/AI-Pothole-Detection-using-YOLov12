import requests
import time

gps_url = "http://10.79.163.16:8080/gps.json"

def get_gps():
    try:
        response = requests.get(gps_url, timeout=0.5)
        data = response.json()

        print("RAW GPS:", data)

        lat = data["gps"]["latitude"]
        lon = data["gps"]["longitude"]

        return lat, lon

    except Exception as e:
        print("GPS ERROR:", e)
        return None, None


print("Starting GPS test...\n")

while True:
    lat, lon = get_gps()

    print("Latitude:", lat)
    print("Longitude:", lon)
    print("--------------------------")

    time.sleep(2)