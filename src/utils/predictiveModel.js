// Predictive analytics for pothole growth forecasting
// Uses simple extrapolation (no real ML)

/**
 * Generate mock historical data for training
 * @param {number} weeks - Number of weeks of historical data
 * @returns {array} Historical detection data
 */
export const generateHistoricalData = (weeks = 12) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - (weeks * 7));

  const districts = ['North', 'South', 'East', 'West', 'Central'];
  
  for (let week = 0; week < weeks; week++) {
    const weekDate = new Date(baseDate);
    weekDate.setDate(baseDate.getDate() + (week * 7));

    districts.forEach(district => {
      // Simulate seasonal variation and random growth
      const baseLine = 15 + Math.sin(week / 2) * 5;
      const trend = week * 0.8; // Growing trend
      const noise = Math.random() * 8 - 4;
      const detections = Math.max(0, Math.round(baseLine + trend + noise));
      const resolved = Math.round(detections * (0.6 + Math.random() * 0.3));

      data.push({
        date: weekDate.toISOString().split('T')[0],
        week: week + 1,
        district,
        detections,
        resolved,
        pending: detections - resolved
      });
    });
  }

  return data;
};

/**
 * Forecast future pothole detections using linear extrapolation
 * @param {array} historicalData - Past detection data
 * @param {number} forecastWeeks - Number of weeks to forecast
 * @returns {array} Predicted data
 */
export const forecastPotholes = (historicalData, forecastWeeks = 4) => {
  const districts = [...new Set(historicalData.map(d => d.district))];
  const predictions = [];

  districts.forEach(district => {
    const districtData = historicalData
      .filter(d => d.district === district)
      .sort((a, b) => a.week - b.week);

    if (districtData.length < 2) return;

    // Simple linear regression
    const n = districtData.length;
    const sumX = districtData.reduce((sum, d) => sum + d.week, 0);
    const sumY = districtData.reduce((sum, d) => sum + d.detections, 0);
    const sumXY = districtData.reduce((sum, d) => sum + (d.week * d.detections), 0);
    const sumX2 = districtData.reduce((sum, d) => sum + (d.week * d.week), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const lastWeek = districtData[districtData.length - 1].week;
    const lastDate = new Date(districtData[districtData.length - 1].date);

    for (let i = 1; i <= forecastWeeks; i++) {
      const weekNumber = lastWeek + i;
      const predictedDetections = Math.max(0, Math.round(slope * weekNumber + intercept));
      
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + (i * 7));

      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        week: weekNumber,
        district,
        predicted: predictedDetections,
        confidence: Math.max(0.6, 1 - (i * 0.08)) // Confidence decreases with distance
      });
    }
  });

  return predictions;
};

/**
 * Calculate growth rate for each district
 * @param {array} historicalData - Historical detection data
 * @returns {object} Growth metrics by district
 */
export const calculateGrowthRates = (historicalData) => {
  const districts = [...new Set(historicalData.map(d => d.district))];
  const growthRates = {};

  districts.forEach(district => {
    const districtData = historicalData
      .filter(d => d.district === district)
      .sort((a, b) => a.week - b.week);

    if (districtData.length < 2) {
      growthRates[district] = { rate: 0, trend: 'stable' };
      return;
    }

    const firstHalf = districtData.slice(0, Math.floor(districtData.length / 2));
    const secondHalf = districtData.slice(Math.floor(districtData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.detections, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.detections, 0) / secondHalf.length;

    const growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    growthRates[district] = {
      rate: Math.round(growthRate * 10) / 10,
      trend: growthRate > 10 ? 'increasing' : growthRate < -10 ? 'decreasing' : 'stable',
      firstAvg: Math.round(firstAvg),
      secondAvg: Math.round(secondAvg)
    };
  });

  return growthRates;
};

/**
 * Identify high-risk zones based on predictions
 * @param {array} predictions - Forecast data
 * @returns {array} High-risk districts sorted by risk
 */
export const identifyHighRiskZones = (predictions) => {
  const districtRisks = predictions.reduce((acc, pred) => {
    if (!acc[pred.district]) {
      acc[pred.district] = {
        district: pred.district,
        totalPredicted: 0,
        avgConfidence: 0,
        count: 0
      };
    }
    acc[pred.district].totalPredicted += pred.predicted;
    acc[pred.district].avgConfidence += pred.confidence;
    acc[pred.district].count += 1;
    return acc;
  }, {});

  return Object.values(districtRisks)
    .map(d => ({
      district: d.district,
      totalPredicted: d.totalPredicted,
      avgConfidence: Math.round((d.avgConfidence / d.count) * 100) / 100,
      riskScore: Math.round((d.totalPredicted / d.count) * (d.avgConfidence / d.count) * 100)
    }))
    .sort((a, b) => b.riskScore - a.riskScore);
};

/**
 * Calculate backlog growth curve
 * @param {array} historicalData - Past data with resolved counts
 * @param {array} predictions - Future predictions
 * @returns {array} Backlog projection
 */
export const calculateBacklogGrowth = (historicalData, predictions) => {
  const allData = [...historicalData];
  
  // Calculate current backlog
  let currentBacklog = historicalData.reduce((sum, d) => sum + (d.detections - d.resolved), 0);

  // Assume resolution rate stays constant
  const avgResolutionRate = historicalData.reduce((sum, d) => sum + d.resolved, 0) / historicalData.length;

  predictions.forEach(pred => {
    const newDetections = pred.predicted;
    const expectedResolved = Math.round(avgResolutionRate);
    const netChange = newDetections - expectedResolved;
    currentBacklog = Math.max(0, currentBacklog + netChange);

    allData.push({
      date: pred.date,
      week: pred.week,
      district: pred.district,
      backlog: Math.round(currentBacklog),
      predicted: true
    });
  });

  return allData;
};
