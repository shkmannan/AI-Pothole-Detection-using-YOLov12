# Backend Integration Guide

This guide will help you connect your React frontend to your team's Python backend API.

## Current State

Right now, the frontend uses **mock data** defined in `src/services/detectionService.js`. When you upload an image and click "Run Detection", it:

1. Simulates a 2.5 second processing delay
2. Returns hardcoded detection boxes
3. Displays mock results

## Integration Steps

### Step 1: Understand Your Backend API

First, coordinate with your backend team to get:

1. **API Endpoint URL**: Example: `http://localhost:5000/detect` or `https://api.yourproject.com/detect`
2. **Request Format**: How to send the image (FormData, base64, etc.)
3. **Response Format**: What JSON structure they return
4. **Authentication**: If needed (API keys, tokens, etc.)

### Step 2: Update the Detection Service

Open `src/services/detectionService.js` and locate this function:

```javascript
export const detectPotholes = async (imageFile) => {
  // Simulate processing time
  await delay(2500);
  
  // Return mock data
  return {
    success: true,
    detections: mockDetections,
    metadata: {
      imageWidth: 1200,
      imageHeight: 800,
      processingTime: 2.3,
      modelVersion: 'YOLOv12'
    }
  };
};
```

Replace it with:

```javascript
export const detectPotholes = async (imageFile) => {
  // Create FormData to send image
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch('YOUR_BACKEND_URL/detect', {
      method: 'POST',
      body: formData,
      // Add headers if your backend requires them
      // headers: {
      //   'Authorization': 'Bearer YOUR_TOKEN'
      // }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Detection API error:', error);
    throw error;
  }
};
```

### Step 3: Match Response Format

Your backend needs to return JSON in this format:

```json
{
  "success": true,
  "detections": [
    {
      "id": 1,
      "x": 120,
      "y": 180,
      "width": 150,
      "height": 100,
      "confidence": 0.94,
      "class": "pothole"
    },
    {
      "id": 2,
      "x": 420,
      "y": 280,
      "width": 180,
      "height": 120,
      "confidence": 0.87,
      "class": "pothole"
    }
  ],
  "metadata": {
    "imageWidth": 1200,
    "imageHeight": 800,
    "processingTime": 2.3,
    "modelVersion": "YOLOv12"
  }
}
```

**Important**: The `x`, `y`, `width`, and `height` values should be in pixels, matching the uploaded image's coordinate system.

### Step 4: Handle Different Response Formats

If your backend returns data in a different format, you can transform it:

```javascript
export const detectPotholes = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('YOUR_BACKEND_URL/detect', {
    method: 'POST',
    body: formData,
  });

  const backendData = await response.json();

  // Transform backend format to frontend format
  return {
    success: true,
    detections: backendData.results.map((item, index) => ({
      id: index + 1,
      x: item.bbox[0],          // Adjust based on backend format
      y: item.bbox[1],
      width: item.bbox[2],
      height: item.bbox[3],
      confidence: item.score,
      class: item.label
    })),
    metadata: {
      imageWidth: backendData.image_width,
      imageHeight: backendData.image_height,
      processingTime: backendData.processing_time,
      modelVersion: backendData.model || 'YOLOv12'
    }
  };
};
```

## Common Integration Scenarios

### Scenario 1: Local Development (Backend on localhost)

```javascript
const API_URL = 'http://localhost:5000'; // Your backend port

export const detectPotholes = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_URL}/detect`, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};
```

### Scenario 2: CORS Issues

If you get CORS errors, your backend team needs to add CORS headers. Or use a proxy:

1. Add to `package.json`:
```json
{
  "proxy": "http://localhost:5000"
}
```

2. Update API calls to use relative paths:
```javascript
const response = await fetch('/detect', { // No full URL needed
  method: 'POST',
  body: formData,
});
```

### Scenario 3: Authentication Required

```javascript
export const detectPotholes = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('YOUR_BACKEND_URL/detect', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY_HERE'
    }
  });

  return await response.json();
};
```

### Scenario 4: Base64 Image (instead of FormData)

Some backends prefer base64 encoded images:

```javascript
export const detectPotholes = async (imageFile) => {
  // Convert image to base64
  const base64 = await fileToBase64(imageFile);

  const response = await fetch('YOUR_BACKEND_URL/detect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image: base64,
      format: imageFile.type
    })
  });

  return await response.json();
};

// Helper function
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};
```

## Testing the Integration

### 1. Start Your Backend
```bash
# In your backend directory
python app.py  # or whatever starts your Flask/FastAPI server
```

### 2. Start Your Frontend
```bash
# In your frontend directory
npm start
```

### 3. Test Detection
1. Go to `http://localhost:3000/detect`
2. Upload a road image
3. Click "Run Detection"
4. Check browser console (F12) for any errors
5. Verify results display correctly

### 4. Debug Common Issues

**Issue**: "Failed to fetch" error
- **Solution**: Check if backend is running, verify URL is correct

**Issue**: CORS error
- **Solution**: Backend needs to add CORS headers or use proxy

**Issue**: Results don't display
- **Solution**: Check console for errors, verify response format matches expected structure

**Issue**: Bounding boxes in wrong location
- **Solution**: Ensure x, y, width, height are in pixels and match image dimensions

## Environment Variables (Recommended)

Instead of hardcoding the API URL, use environment variables:

1. Create `.env` in project root:
```env
REACT_APP_API_URL=http://localhost:5000
```

2. Update `detectionService.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const detectPotholes = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_URL}/detect`, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};
```

3. For production, set environment variable on your hosting platform

## Example Backend Code (Python/FastAPI)

If your backend team needs reference, here's a simple example:

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect")
async def detect_potholes(image: UploadFile = File(...)):
    start_time = time.time()
    
    # Your YOLOv12 detection logic here
    # image_data = await image.read()
    # detections = model.predict(image_data)
    
    # Mock response for testing
    detections = [
        {
            "id": 1,
            "x": 120,
            "y": 180,
            "width": 150,
            "height": 100,
            "confidence": 0.94,
            "class": "pothole"
        }
    ]
    
    processing_time = time.time() - start_time
    
    return {
        "success": True,
        "detections": detections,
        "metadata": {
            "imageWidth": 1200,
            "imageHeight": 800,
            "processingTime": processing_time,
            "modelVersion": "YOLOv12"
        }
    }
```

## Checklist Before Integration

- [ ] Backend API is running and accessible
- [ ] Frontend can ping the backend URL
- [ ] CORS is configured on backend
- [ ] Response format matches expected structure
- [ ] Image upload works end-to-end
- [ ] Detection results display correctly
- [ ] Bounding boxes align with image
- [ ] Error handling works properly

## Need Help?

1. Check browser console (F12) for error messages
2. Check backend logs for errors
3. Use Postman/Insomnia to test backend API directly
4. Verify request/response formats match
5. Share error messages with your team

---

**Remember**: The mock data is just a placeholder. Once you connect to your real backend, you'll see actual pothole detections from your YOLOv12 model!
