// Cost estimation engine for pothole repairs

const BASE_COSTS = {
  material: 45, // per square meter
  labor: 30, // per square meter
  equipment: 20 // per square meter
};

const ROAD_TYPE_MULTIPLIERS = {
  highway: 1.8,
  mainRoad: 1.4,
  residential: 1.0,
  rural: 0.8
};

const SEVERITY_MULTIPLIERS = {
  low: 0.7,
  medium: 1.0,
  high: 1.5
};

const TRAFFIC_MULTIPLIERS = {
  low: 1.0,
  medium: 1.2,
  high: 1.4
};

/**
 * Calculate repair cost for a single pothole
 * @param {object} pothole - Pothole data with dimensions and metadata
 * @param {number} costFactor - Global cost adjustment factor (default 1.0)
 * @returns {number} Estimated repair cost in USD
 */
export const calculatePotholeCost = (pothole, costFactor = 1.0) => {
  // Calculate surface area from bounding box (convert to square meters)
  const widthMeters = (pothole.width || 150) * 0.01; // pixels to rough meters
  const heightMeters = (pothole.height || 100) * 0.01;
  const area = widthMeters * heightMeters;

  // Base cost calculation
  const materialCost = area * BASE_COSTS.material;
  const laborCost = area * BASE_COSTS.labor;
  const equipmentCost = area * BASE_COSTS.equipment;
  const baseCost = materialCost + laborCost + equipmentCost;

  // Apply multipliers
  const roadMultiplier = ROAD_TYPE_MULTIPLIERS[pothole.roadType] || 1.0;
  const severityMultiplier = SEVERITY_MULTIPLIERS[pothole.severity] || 1.0;
  const trafficMultiplier = TRAFFIC_MULTIPLIERS[pothole.trafficDensity] || 1.0;

  // Final cost
  const estimatedCost = baseCost * roadMultiplier * severityMultiplier * trafficMultiplier * costFactor;

  return Math.round(estimatedCost * 100) / 100;
};

/**
 * Calculate total costs for multiple potholes
 * @param {array} potholes - Array of pothole objects
 * @param {number} costFactor - Global cost adjustment factor
 * @returns {object} Cost summary with breakdown
 */
export const calculateTotalCosts = (potholes, costFactor = 1.0) => {
  const costs = potholes.map(p => calculatePotholeCost(p, costFactor));
  const total = costs.reduce((sum, cost) => sum + cost, 0);

  // Group by district
  const byDistrict = potholes.reduce((acc, pothole, index) => {
    const district = pothole.district || 'Unknown';
    if (!acc[district]) {
      acc[district] = { total: 0, count: 0 };
    }
    acc[district].total += costs[index];
    acc[district].count += 1;
    return acc;
  }, {});

  // Group by severity
  const bySeverity = potholes.reduce((acc, pothole, index) => {
    const severity = pothole.severity || 'medium';
    if (!acc[severity]) {
      acc[severity] = { total: 0, count: 0 };
    }
    acc[severity].total += costs[index];
    acc[severity].count += 1;
    return acc;
  }, {});

  return {
    total: Math.round(total * 100) / 100,
    average: Math.round((total / potholes.length) * 100) / 100,
    byDistrict,
    bySeverity,
    breakdown: potholes.map((p, i) => ({
      id: p.id,
      cost: costs[i],
      district: p.district,
      severity: p.severity
    }))
  };
};

/**
 * Calculate budget impact metrics
 * @param {number} totalCost - Total repair cost
 * @param {number} budget - Available budget
 * @returns {object} Budget metrics
 */
export const calculateBudgetImpact = (totalCost, budget = 500000) => {
  const percentUsed = (totalCost / budget) * 100;
  const remaining = budget - totalCost;
  const deficit = totalCost > budget ? totalCost - budget : 0;

  return {
    budget,
    totalCost,
    percentUsed: Math.round(percentUsed * 10) / 10,
    remaining: Math.max(0, remaining),
    deficit,
    status: percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'healthy'
  };
};
