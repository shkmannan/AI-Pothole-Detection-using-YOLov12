// Mock detection data - replace this with real API calls when backend is ready

// City center coordinates (example: San Francisco-like)
const CITY_CENTER = { lat: 37.7749, lng: -122.4194 };

// Generate realistic GPS coordinates spread across city
const generateGPSCoordinate = (district) => {
  const offsets = {
    North: { lat: 0.03, lng: 0.01 },
    South: { lat: -0.03, lng: 0.01 },
    East: { lat: 0.01, lng: 0.03 },
    West: { lat: 0.01, lng: -0.03 },
    Central: { lat: 0, lng: 0 }
  };
  
  const offset = offsets[district] || offsets.Central;
  const randomLat = (Math.random() - 0.5) * 0.02;
  const randomLng = (Math.random() - 0.5) * 0.02;
  
  return {
    lat: CITY_CENTER.lat + offset.lat + randomLat,
    lng: CITY_CENTER.lng + offset.lng + randomLng
  };
};

// Generate comprehensive mock detections
const generateMockDetections = () => {
  const districts = ['North', 'South', 'East', 'West', 'Central'];
  const roadTypes = ['highway', 'mainRoad', 'residential', 'rural'];
  const severities = ['low', 'medium', 'high'];
  const trafficDensities = ['low', 'medium', 'high'];
  const statuses = ['pending', 'in-progress', 'resolved'];
  
  const detections = [];
  let id = 1;
  
  districts.forEach(district => {
    // Generate 6-12 potholes per district
    const count = Math.floor(Math.random() * 7) + 6;
    
    for (let i = 0; i < count; i++) {
      const gps = generateGPSCoordinate(district);
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const roadType = roadTypes[Math.floor(Math.random() * roadTypes.length)];
      const trafficDensity = trafficDensities[Math.floor(Math.random() * trafficDensities.length)];
      const status = statuses[Math.floor(Math.random() * 10) < 6 ? 0 : Math.floor(Math.random() * 3)];
      
      const daysAgo = Math.floor(Math.random() * 30);
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - daysAgo);
      
      detections.push({
        id: id++,
        // Original detection fields
        x: Math.floor(Math.random() * 800) + 100,
        y: Math.floor(Math.random() * 600) + 100,
        width: Math.floor(Math.random() * 100) + 80,
        height: Math.floor(Math.random() * 80) + 60,
        confidence: 0.65 + Math.random() * 0.32,
        class: 'pothole',
        
        // Enhanced fields
        gps: gps,
        district: district,
        severity: severity,
        roadType: roadType,
        trafficDensity: trafficDensity,
        status: status,
        reportedDate: reportDate.toISOString().split('T')[0],
        resolvedDate: status === 'resolved' ? new Date(reportDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        roadName: `${district} ${roadType === 'highway' ? 'Highway' : roadType === 'mainRoad' ? 'Avenue' : 'Street'} ${Math.floor(Math.random() * 100) + 1}`,
        reportSource: Math.random() > 0.3 ? 'AI Detection' : 'Citizen Report'
      });
    }
  });
  
  return detections;
};

export const mockDetections = generateMockDetections();

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock detection API - replace with real endpoint when ready
 * 
 * Real API integration example:
 * 
 * export const detectPotholes = async (imageFile) => {
 *   const formData = new FormData();
 *   formData.append('image', imageFile);
 *   
 *   const response = await fetch('YOUR_API_ENDPOINT/detect', {
 *     method: 'POST',
 *     body: formData
 *   });
 *   
 *   return await response.json();
 * };
 */
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

// Calculate severity based on detections
export const calculateSeverity = (detections) => {
  const count = detections.length;
  const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / count;
  
  if (count >= 5 || avgConfidence > 0.9) return 'High';
  if (count >= 3 || avgConfidence > 0.8) return 'Medium';
  return 'Low';
};

// Get color for confidence level
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.85) return '#10b981'; // green
  if (confidence >= 0.70) return '#f59e0b'; // orange
  return '#ef4444'; // red
};
