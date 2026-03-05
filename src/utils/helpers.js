// Utility functions for the application

// Format confidence as percentage
export const formatConfidence = (confidence) => {
  return `${(confidence * 100).toFixed(1)}%`;
};

// Validate image file
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  return { valid: true };
};

// Convert file to data URL for preview
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Calculate detection statistics
export const calculateStats = (detections) => {
  if (!detections || detections.length === 0) {
    return {
      total: 0,
      avgConfidence: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0
    };
  }

  const total = detections.length;
  const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / total;
  
  const highConfidence = detections.filter(d => d.confidence >= 0.85).length;
  const mediumConfidence = detections.filter(d => d.confidence >= 0.70 && d.confidence < 0.85).length;
  const lowConfidence = detections.filter(d => d.confidence < 0.70).length;

  return {
    total,
    avgConfidence,
    highConfidence,
    mediumConfidence,
    lowConfidence
  };
};

// Format processing time
export const formatProcessingTime = (seconds) => {
  return `${seconds.toFixed(2)}s`;
};

// Get severity color
export const getSeverityColor = (severity) => {
  const colors = {
    High: 'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-orange-600 bg-orange-50 border-orange-200',
    Low: 'text-green-600 bg-green-50 border-green-200'
  };
  return colors[severity] || colors.Low;
};
