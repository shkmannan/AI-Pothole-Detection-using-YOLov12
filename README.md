# PotholeAI - YOLOv12 Detection Frontend

A professional, production-ready React frontend for AI-powered pothole detection using YOLOv12. This application provides an intuitive interface for uploading road images, running detection analysis, and visualizing results with detailed statistics.

## Features

- 🎯 **Real-time Detection**: Upload images and get instant pothole detection results
- 📊 **Detailed Analytics**: View confidence scores, severity levels, and detection statistics
- 🎨 **Professional UI**: Clean, responsive design built with Tailwind CSS
- 🚀 **Performance Optimized**: Fast loading with smooth animations using Framer Motion
- 📱 **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 🔌 **API Ready**: Designed for easy integration with backend detection service

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Canvas API** - Bounding box rendering

## Project Structure

```
pothole-detection-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js              # Navigation header
│   │   ├── ImageUpload.js         # Drag-and-drop upload
│   │   ├── DetectionCanvas.js     # Canvas with bounding boxes
│   │   ├── DetectionResults.js    # Statistics and analysis
│   │   └── ProcessingLoader.js    # Loading indicator
│   ├── pages/
│   │   ├── Home.js                # Landing page
│   │   └── Detection.js           # Main detection interface
│   ├── services/
│   │   └── detectionService.js    # API service (mock data)
│   ├── utils/
│   │   └── helpers.js             # Utility functions
│   ├── App.js                     # Main app component
│   ├── index.js                   # Entry point
│   └── index.css                  # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   cd pothole-detection-frontend
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The app will automatically reload on code changes

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Backend Integration

Currently, the app uses mock data for demonstrations. To connect to your actual YOLOv12 backend:

### Step 1: Update the Detection Service

Open `src/services/detectionService.js` and replace the mock function with your API endpoint:

```javascript
export const detectPotholes = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('YOUR_BACKEND_URL/detect', {
    method: 'POST',
    body: formData,
    // Add headers if needed (e.g., authentication)
    headers: {
      // 'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  if (!response.ok) {
    throw new Error('Detection failed');
  }
  
  return await response.json();
};
```

### Expected API Response Format

Your backend should return JSON in this format:

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

### Step 2: Handle CORS (if needed)

If your backend is on a different domain, you may need to:

1. Configure CORS headers on your backend
2. Or use a proxy in `package.json`:

```json
{
  "proxy": "http://your-backend-url:port"
}
```

### Step 3: Add Environment Variables (optional)

Create a `.env` file in the root:

```env
REACT_APP_API_URL=http://your-backend-url:port
```

Then use it in the code:

```javascript
const API_URL = process.env.REACT_APP_API_URL;
```

## Customization

### Colors and Branding

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### Mock Data

To test with different detection scenarios, edit `src/services/detectionService.js`:

```javascript
export const mockDetections = [
  {
    id: 1,
    x: 120,      // X position
    y: 180,      // Y position
    width: 150,  // Box width
    height: 100, // Box height
    confidence: 0.94,
    class: 'pothole'
  },
  // Add more mock detections...
];
```

## Features Breakdown

### Image Upload
- Drag-and-drop interface
- File type validation (JPEG, PNG, WebP)
- File size limit (10MB)
- Preview before detection

### Detection Display
- Canvas-based bounding box rendering
- Color-coded confidence levels:
  - Green: ≥85% (High confidence)
  - Orange: 70-85% (Medium confidence)
  - Red: <70% (Low confidence)

### Results Analysis
- Total detections count
- Average confidence score
- Processing time
- Severity classification (Low/Medium/High)
- Individual detection breakdown

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Tips

1. **Image Optimization**: Compress large images before upload for faster processing
2. **Production Build**: Always use `npm run build` for deployment
3. **Caching**: Implement browser caching for static assets

## Deployment

### Deploy to Netlify

1. Build the app: `npm run build`
2. Drag the `build` folder to Netlify
3. Or connect your GitHub repo for auto-deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to GitHub Pages

1. Install: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/repo-name",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Deploy: `npm run deploy`

## Contributing

This is an academic/research project. Feel free to fork and modify for your needs.

## License

MIT License - feel free to use this project for academic or commercial purposes.

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/shkmannan/AI-Pothole-Detection-using-YOLOv2)
- Review the code comments in `src/services/detectionService.js` for API integration help

## Future Enhancements

Potential improvements:
- Batch image processing
- Export detection results as PDF/CSV
- Historical detection tracking
- Map integration for location-based analysis
- Real-time video detection
- User authentication and saved results

---

**Built with ❤️ for smart city infrastructure analysis**
