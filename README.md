# Pothole Detection Frontend

A modern React-based web application for pothole detection using AI-powered image analysis. This frontend integrates with the YOLOv12 backend to detect and analyze road surface defects, providing cost estimation and prioritization for municipal maintenance.

## Features

- **Image Upload & Detection** - Upload road images for real-time pothole detection
- **Dark Mode Support** - Toggle between light and dark themes for comfortable viewing
- **Detection Visualization** - Interactive canvas displaying detected potholes with bounding boxes
- **Cost Estimation** - Automatic calculation of repair costs based on detected pothole characteristics
- **Health Index** - Road condition assessment and health score calculation
- **Municipality Dashboard** - Manage and prioritize pothole repairs across regions
- **Predictive Analytics** - ML-based predictions for future road deterioration
- **Prioritization System** - Smart ranking of repair locations based on severity and risk factors

## Project Structure

```
src/
├── components/
│   ├── DarkModeToggle.js       # Theme switching component
│   ├── DetectionCanvas.js       # Visualization of detected potholes
│   ├── DetectionResults.js      # Results display component
│   ├── Header.js                # Application header
│   ├── ImageUpload.js           # Image upload interface
│   ├── ProcessingLoader.js      # Loading indicator
│   └── ViewModeToggle.js        # View mode switcher
├── context/
│   └── AppContext.js            # Global application state
├── pages/
│   ├── Home.js                  # Landing page
│   ├── Detection.js             # Detection interface
│   └── MunicipalityDashboard.js # Admin dashboard
├── services/
│   └── detectionService.js      # Backend API integration
├── utils/
│   ├── costEstimator.js         # Cost calculation logic
│   ├── healthIndex.js           # Health score calculation
│   ├── helpers.js               # Utility functions
│   ├── predictiveModel.js       # Predictive analytics
│   └── prioritization.js        # Repair prioritization logic
├── App.js                       # App root component
├── index.js                     # React entry point
└── index.css                    # Global styles
```

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser with JavaScript enabled

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pothole-detection-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

## Usage

### Development Server

Start the development server with hot reload:

```bash
npm start
```

The application will open at `http://localhost:3000`

### Building for Production

Create an optimized production build:

```bash
npm run build
```

Output files will be in the `build/` directory.

### Running Tests

```bash
npm test
```

## Getting Started

1. **Home Page** - Start at the home page to understand the application
2. **Detection** - Navigate to the detection page and upload a pothole image
3. **View Results** - Analyze detected potholes with cost and severity information
4. **Dashboard** - Access the municipality dashboard for regional management

## Key Components

### Detection Service

Handles communication with the YOLOv12 backend for image processing and pothole detection.

### Health Index Calculator

Evaluates overall road condition based on detected issues and provides a health score (0-100).

### Cost Estimator

Calculates repair costs based on pothole size, depth, and location factors.

### Prioritization Engine

Ranks detected potholes by severity, urgency, and maintenance cost-effectiveness.

## Documentation

For more detailed information, refer to:

- [Quick Start Guide](QUICK_START.md) - Get up and running quickly
- [Integration Guide](INTEGRATION_GUIDE.md) - Backend integration details
- [Upgrade Guide](UPGRADE_GUIDE.md) - Version upgrade instructions
- [Project Summary](PROJECT_SUMMARY.md) - Complete project overview

## Technology Stack

- **Frontend Framework** - React
- **Styling** - Tailwind CSS
- **CSS Processing** - PostCSS
- **State Management** - React Context API
- **Build Tool** - Create React App

## Backend

This frontend requires the AI-Pothole-Detection-using-YOLOv12 backend service. Refer to the backend documentation for setup instructions.

## Development

### Available Scripts

- `npm start` - Run development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Expose webpack configuration (irreversible)

### Code Style

The project follows React best practices and uses functional components with hooks.

## Troubleshooting

- **Port 3000 already in use** - Change the PORT environment variable or stop the conflicting process
- **API Connection Issues** - Verify the backend service is running and `REACT_APP_API_URL` is correctly configured
- **Dependencies Installation Fails** - Try clearing npm cache: `npm cache clean --force`

## License

This project is part of the AI-Pothole-Detection system. See LICENSE file for details.

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

---

**Last Updated:** March 2026
