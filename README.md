# AI-Pothole-Detection-using-YOLOv12

Real-time pothole detection using YOLOv8 and IP Webcam with GPS logging.

## Features
- Real-time pothole detection from phone camera
- GPS tagging of detected potholes
- CSV export with timestamps and coordinates
- Resizable detection window
- Optimized for CPU usage

## Setup

1. **Install dependencies:**
   ```bash
   pip install ultralytics opencv-python requests
   ```

2. **Enable GPS in IP Webcam:**
   - Open IP Webcam app on phone
   - Settings > GPS > Turn ON
   - Keep phone outdoors for GPS lock (30-60 seconds)

3. **Train model (optional):**
   ```bash
   python train.py
   ```

## Usage

```bash
python detect.py
```

## Notes

- **FlashAttention Warning**: This is normal on CPU systems. The model automatically falls back to standard attention and works fine.
- **GPS**: Takes 30-60 seconds to acquire first GPS lock outdoors
- **Camera**: Uses IP Webcam app as video source
- **Output**: Detections saved to `pothole_detections.csv`

## Files
- `detect.py` - Main detection script
- `train.py` - Model training
- `gps_module.py` - GPS logging system
- `pothole_detections.csv` - Detection results
