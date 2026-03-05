// Smart prioritization engine for pothole repairs

const SEVERITY_SCORES = {
  high: 100,
  medium: 60,
  low: 30
};

const TRAFFIC_SCORES = {
  high: 80,
  medium: 50,
  low: 20
};

const ROAD_TYPE_SCORES = {
  highway: 90,
  mainRoad: 70,
  residential: 40,
  rural: 20
};

/**
 * Calculate priority score for a pothole
 * @param {object} pothole - Pothole data
 * @returns {number} Priority score 0-100
 */
const calculatePriorityScore = (pothole) => {
  const severityScore = SEVERITY_SCORES[pothole.severity] || 50;
  const trafficScore = TRAFFIC_SCORES[pothole.trafficDensity] || 40;
  const roadTypeScore = ROAD_TYPE_SCORES[pothole.roadType] || 40;
  
  // Age factor: older potholes get higher priority
  const daysOld = Math.floor((new Date() - new Date(pothole.reportedDate)) / (1000 * 60 * 60 * 24));
  const ageScore = Math.min(30, daysOld * 2);
  
  // Weighted calculation
  const weights = {
    severity: 0.35,
    traffic: 0.30,
    roadType: 0.20,
    age: 0.15
  };
  
  const totalScore = (
    severityScore * weights.severity +
    trafficScore * weights.traffic +
    roadTypeScore * weights.roadType +
    ageScore * weights.age
  );
  
  return Math.min(100, Math.round(totalScore));
};

/**
 * Get recommended action timeline based on priority
 * @param {number} priorityScore - Priority score
 * @returns {string} Timeline recommendation
 */
const getActionTimeline = (priorityScore) => {
  if (priorityScore >= 80) return 'Immediate (0-3 days)';
  if (priorityScore >= 60) return 'Urgent (3-7 days)';
  if (priorityScore >= 40) return 'Medium (1-2 weeks)';
  return 'Standard (2-4 weeks)';
};

/**
 * Estimate repair window duration
 * @param {object} pothole - Pothole data
 * @returns {string} Estimated repair duration
 */
const getRepairWindow = (pothole) => {
  const baseHours = pothole.severity === 'high' ? 6 : pothole.severity === 'medium' ? 4 : 2;
  const trafficMultiplier = pothole.trafficDensity === 'high' ? 1.5 : 1.0;
  const totalHours = Math.ceil(baseHours * trafficMultiplier);
  
  if (totalHours <= 4) return `${totalHours} hours`;
  return `${Math.ceil(totalHours / 8)} day${totalHours > 8 ? 's' : ''}`;
};

/**
 * Generate prioritized pothole list with all metrics
 * @param {array} potholes - Array of pothole objects
 * @param {object} costs - Cost calculation results
 * @returns {array} Sorted prioritized list
 */
export const generatePriorityList = (potholes, costs = {}) => {
  return potholes.map(pothole => {
    const priorityScore = calculatePriorityScore(pothole);
    const costBreakdown = costs.breakdown?.find(c => c.id === pothole.id);
    
    return {
      ...pothole,
      priorityScore,
      actionTimeline: getActionTimeline(priorityScore),
      repairWindow: getRepairWindow(pothole),
      estimatedCost: costBreakdown?.cost || 0,
      riskLevel: priorityScore >= 70 ? 'high' : priorityScore >= 40 ? 'medium' : 'low'
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
};

/**
 * Group priorities by urgency level
 * @param {array} prioritizedList - Prioritized pothole list
 * @returns {object} Grouped by urgency
 */
export const groupByUrgency = (prioritizedList) => {
  return {
    immediate: prioritizedList.filter(p => p.priorityScore >= 80),
    urgent: prioritizedList.filter(p => p.priorityScore >= 60 && p.priorityScore < 80),
    medium: prioritizedList.filter(p => p.priorityScore >= 40 && p.priorityScore < 60),
    standard: prioritizedList.filter(p => p.priorityScore < 40)
  };
};

/**
 * Calculate cost efficiency score
 * Cost efficiency = Impact prevented / Cost
 * @param {object} pothole - Prioritized pothole data
 * @returns {number} Efficiency score
 */
export const calculateCostEfficiency = (pothole) => {
  const impactScore = pothole.priorityScore;
  const cost = pothole.estimatedCost || 1;
  return Math.round((impactScore / cost) * 1000) / 10;
};
