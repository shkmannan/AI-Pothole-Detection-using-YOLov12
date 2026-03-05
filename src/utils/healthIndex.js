// Infrastructure Health Index (IHI) calculator
// Composite metric from 0-100 measuring overall road infrastructure health

/**
 * Calculate Infrastructure Health Index for a district or city
 * @param {object} metrics - Input metrics for calculation
 * @returns {object} Health index with score and status
 */
export const calculateHealthIndex = (metrics) => {
  const {
    detectionDensity = 0,     // detections per km²
    avgSeverity = 0,          // 0-1 scale
    resolutionRate = 0,       // 0-1 scale (% resolved)
    growthRate = 0,           // % change in detections
    avgResponseTime = 0       // days to resolve
  } = metrics;

  // Weights for each component
  const weights = {
    density: 0.25,
    severity: 0.25,
    resolution: 0.25,
    growth: 0.15,
    response: 0.10
  };

  // Component scores (0-100)
  const densityScore = Math.max(0, 100 - (detectionDensity * 10)); // Lower density = better
  const severityScore = Math.max(0, 100 - (avgSeverity * 100));    // Lower severity = better
  const resolutionScore = resolutionRate * 100;                     // Higher resolution = better
  const growthScore = Math.max(0, 100 - Math.abs(growthRate));    // Lower growth = better
  const responseScore = Math.max(0, 100 - (avgResponseTime * 2)); // Faster response = better

  // Calculate weighted IHI
  const ihi = Math.round(
    (densityScore * weights.density) +
    (severityScore * weights.severity) +
    (resolutionScore * weights.resolution) +
    (growthScore * weights.growth) +
    (responseScore * weights.response)
  );

  // Determine status
  let status, color, message;
  if (ihi >= 80) {
    status = 'Excellent';
    color = 'green';
    message = 'Infrastructure is in stable condition';
  } else if (ihi >= 60) {
    status = 'Good';
    color = 'blue';
    message = 'Monitor for emerging issues';
  } else if (ihi >= 40) {
    status = 'Warning';
    color = 'orange';
    message = 'Attention required - preventive action recommended';
  } else {
    status = 'Critical';
    color = 'red';
    message = 'Urgent intervention needed';
  }

  return {
    score: Math.min(100, Math.max(0, ihi)),
    status,
    color,
    message,
    components: {
      density: Math.round(densityScore),
      severity: Math.round(severityScore),
      resolution: Math.round(resolutionScore),
      growth: Math.round(growthScore),
      response: Math.round(responseScore)
    }
  };
};

/**
 * Calculate IHI for multiple districts
 * @param {array} districtMetrics - Array of district data
 * @returns {object} Overall and per-district IHI
 */
export const calculateDistrictHealthIndexes = (districtMetrics) => {
  const districtScores = districtMetrics.map(district => ({
    district: district.name,
    ihi: calculateHealthIndex(district.metrics),
    metrics: district.metrics
  }));

  // Calculate overall city score (weighted average)
  const totalDetections = districtMetrics.reduce((sum, d) => 
    sum + (d.metrics.totalDetections || 0), 0
  );

  const weightedSum = districtScores.reduce((sum, d) => {
    const weight = (d.metrics.totalDetections || 0) / totalDetections || 0;
    return sum + (d.ihi.score * weight);
  }, 0);

  const overallScore = Math.round(weightedSum);
  const overallIHI = calculateHealthIndex({
    detectionDensity: districtMetrics.reduce((sum, d) => sum + (d.metrics.detectionDensity || 0), 0) / districtMetrics.length,
    avgSeverity: districtMetrics.reduce((sum, d) => sum + (d.metrics.avgSeverity || 0), 0) / districtMetrics.length,
    resolutionRate: districtMetrics.reduce((sum, d) => sum + (d.metrics.resolutionRate || 0), 0) / districtMetrics.length,
    growthRate: districtMetrics.reduce((sum, d) => sum + (d.metrics.growthRate || 0), 0) / districtMetrics.length,
    avgResponseTime: districtMetrics.reduce((sum, d) => sum + (d.metrics.avgResponseTime || 0), 0) / districtMetrics.length
  });

  return {
    overall: { ...overallIHI, score: overallScore },
    districts: districtScores.sort((a, b) => b.ihi.score - a.ihi.score)
  };
};

/**
 * Get recommended actions based on IHI score
 * @param {number} score - IHI score
 * @returns {array} Recommended actions
 */
export const getRecommendations = (score) => {
  if (score >= 80) {
    return [
      'Continue routine maintenance schedule',
      'Monitor seasonal weather impact',
      'Maintain current resource allocation'
    ];
  } else if (score >= 60) {
    return [
      'Increase inspection frequency',
      'Prepare preventive maintenance plan',
      'Monitor high-traffic zones closely',
      'Review budget for potential scaling'
    ];
  } else if (score >= 40) {
    return [
      'Implement accelerated repair program',
      'Allocate additional resources',
      'Prioritize high-severity zones',
      'Engage emergency contractors if needed',
      'Increase public communication'
    ];
  } else {
    return [
      'Declare infrastructure emergency',
      'Deploy all available resources immediately',
      'Implement traffic restrictions in critical areas',
      'Request emergency budget allocation',
      'Establish rapid response teams',
      'Daily progress monitoring required'
    ];
  }
};
