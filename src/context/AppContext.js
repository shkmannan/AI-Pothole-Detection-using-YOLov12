import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { mockDetections } from '../services/detectionService';
import { calculateTotalCosts } from '../utils/costEstimator';
import { generateHistoricalData, forecastPotholes } from '../utils/predictiveModel';
import { calculateDistrictHealthIndexes } from '../utils/healthIndex';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // View mode: 'citizen' or 'municipality'
  const [viewMode, setViewMode] = useState('citizen');
  
  // Cost factor for budget simulation
  const [costFactor, setCostFactor] = useState(1.0);
  
  // Map display mode: 'markers', 'clusters', 'heatmap'
  const [mapMode, setMapMode] = useState('markers');
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  
  // All detections data
  const [detections, setDetections] = useState(mockDetections);
  
  // Filters
  const [filters, setFilters] = useState({
    district: 'all',
    severity: 'all',
    status: 'all',
    roadType: 'all'
  });
  
  // Generate analytics data once
  const [historicalData] = useState(() => generateHistoricalData(12));
  const [predictions] = useState(() => forecastPotholes(generateHistoricalData(12), 4));
  
  // Filtered detections based on current filters
  const filteredDetections = useMemo(() => {
    return detections.filter(d => {
      if (filters.district !== 'all' && d.district !== filters.district) return false;
      if (filters.severity !== 'all' && d.severity !== filters.severity) return false;
      if (filters.status !== 'all' && d.status !== filters.status) return false;
      if (filters.roadType !== 'all' && d.roadType !== filters.roadType) return false;
      return true;
    });
  }, [detections, filters]);
  
  // Calculate costs
  const costs = useMemo(() => {
    return calculateTotalCosts(filteredDetections, costFactor);
  }, [filteredDetections, costFactor]);
  
  // Calculate district metrics for health index
  const districtMetrics = useMemo(() => {
    const districts = ['North', 'South', 'East', 'West', 'Central'];
    return districts.map(district => {
      const districtDetections = filteredDetections.filter(d => d.district === district);
      const resolved = districtDetections.filter(d => d.status === 'resolved').length;
      const totalDetections = districtDetections.length;
      
      const avgSeverityMap = { low: 0.3, medium: 0.6, high: 0.9 };
      const avgSeverity = districtDetections.reduce((sum, d) => 
        sum + (avgSeverityMap[d.severity] || 0.5), 0
      ) / (totalDetections || 1);
      
      const historicalGrowth = historicalData.filter(h => h.district === district);
      const recentWeeks = historicalGrowth.slice(-4);
      const earlierWeeks = historicalGrowth.slice(0, 4);
      const recentAvg = recentWeeks.reduce((sum, w) => sum + w.detections, 0) / recentWeeks.length;
      const earlierAvg = earlierWeeks.reduce((sum, w) => sum + w.detections, 0) / earlierWeeks.length;
      const growthRate = ((recentAvg - earlierAvg) / earlierAvg) * 100;
      
      return {
        name: district,
        metrics: {
          totalDetections,
          detectionDensity: totalDetections / 25, // Assume 25 km² per district
          avgSeverity,
          resolutionRate: totalDetections > 0 ? resolved / totalDetections : 0,
          growthRate,
          avgResponseTime: Math.random() * 14 + 3 // 3-17 days
        }
      };
    });
  }, [filteredDetections, historicalData]);
  
  // Calculate health indexes
  const healthIndexes = useMemo(() => {
    return calculateDistrictHealthIndexes(districtMetrics);
  }, [districtMetrics]);
  
  // Stats summary
  const stats = useMemo(() => {
    const total = filteredDetections.length;
    const pending = filteredDetections.filter(d => d.status === 'pending').length;
    const inProgress = filteredDetections.filter(d => d.status === 'in-progress').length;
    const resolved = filteredDetections.filter(d => d.status === 'resolved').length;
    
    return {
      total,
      pending,
      inProgress,
      resolved,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
    };
  }, [filteredDetections]);
  
  const value = {
    viewMode,
    setViewMode,
    costFactor,
    setCostFactor,
    mapMode,
    setMapMode,
    darkMode,
    setDarkMode,
    detections,
    setDetections,
    filters,
    setFilters,
    filteredDetections,
    costs,
    healthIndexes,
    stats,
    historicalData,
    predictions,
    districtMetrics
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
