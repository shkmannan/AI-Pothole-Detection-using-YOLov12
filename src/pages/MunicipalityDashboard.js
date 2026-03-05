import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generatePriorityList, groupByUrgency } from '../utils/prioritization';
import { getRecommendations } from '../utils/healthIndex';

const MunicipalityDashboard = () => {
  const {
    filteredDetections,
    costs,
    healthIndexes,
    stats,
    historicalData,
    predictions,
    filters,
    setFilters,
    costFactor,
    setCostFactor
  } = useApp();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [showPredicted, setShowPredicted] = useState(true);

  // Priority list
  const priorityList = useMemo(() => {
    return generatePriorityList(filteredDetections, costs);
  }, [filteredDetections, costs]);

  const urgencyGroups = useMemo(() => {
    return groupByUrgency(priorityList);
  }, [priorityList]);

  // Combine historical and predictions for charts
  const forecastData = useMemo(() => {
    const grouped = {};
    
    historicalData.forEach(d => {
      if (!grouped[d.week]) {
        grouped[d.week] = { week: d.week, actual: 0, date: d.date };
      }
      grouped[d.week].actual += d.detections;
    });
    
    predictions.forEach(p => {
      if (!grouped[p.week]) {
        grouped[p.week] = { week: p.week, date: p.date };
      }
      if (!grouped[p.week].predicted) grouped[p.week].predicted = 0;
      grouped[p.week].predicted += p.predicted;
    });
    
    return Object.values(grouped).sort((a, b) => a.week - b.week);
  }, [historicalData, predictions]);

  // District comparison data
  const districtComparisonData = useMemo(() => {
    const districts = ['North', 'South', 'East', 'West', 'Central'];
    return districts.map(district => {
      const districtPotholes = filteredDetections.filter(d => d.district === district);
      const districtHealth = healthIndexes.districts.find(d => d.district === district);
      
      return {
        district,
        count: districtPotholes.length,
        healthScore: districtHealth?.ihi.score || 0,
        pending: districtPotholes.filter(d => d.status === 'pending').length,
        resolved: districtPotholes.filter(d => d.status === 'resolved').length
      };
    });
  }, [filteredDetections, healthIndexes]);

  const budgetStatus = useMemo(() => {
    const budget = 500000;
    const percentUsed = (costs.total / budget) * 100;
    return {
      budget,
      used: costs.total,
      remaining: Math.max(0, budget - costs.total),
      percentUsed: Math.min(100, percentUsed),
      status: percentUsed > 100 ? 'over' : percentUsed > 80 ? 'warning' : 'healthy'
    };
  }, [costs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Municipality Command Center</h1>
              <p className="text-gray-600 mt-1">Infrastructure Health & Operations Dashboard</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Detections</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {['overview', 'analytics', 'priorities', 'budget'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Infrastructure Health Index */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Infrastructure Health Index</h2>
              
              <div className="grid lg:grid-cols-6 gap-6">
                {/* Overall Score */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke={healthIndexes.overall.color === 'green' ? '#10b981' : 
                                healthIndexes.overall.color === 'blue' ? '#3b82f6' :
                                healthIndexes.overall.color === 'orange' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(healthIndexes.overall.score / 100) * 553} 553`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-5xl font-bold text-gray-900">{healthIndexes.overall.score}</p>
                      <p className="text-sm text-gray-500">Overall IHI</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg font-semibold text-gray-900">{healthIndexes.overall.status}</p>
                    <p className="text-sm text-gray-600 mt-1">{healthIndexes.overall.message}</p>
                  </div>
                </div>

                {/* District Breakdown */}
                <div className="lg:col-span-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">District Health Scores</h3>
                  <div className="space-y-3">
                    {healthIndexes.districts.map(district => (
                      <div key={district.district}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{district.district}</span>
                          <span className="text-sm font-mono font-medium text-gray-900">{district.ihi.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              district.ihi.score >= 80 ? 'bg-green-500' :
                              district.ihi.score >= 60 ? 'bg-blue-500' :
                              district.ihi.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${district.ihi.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recommended Actions</h3>
                <ul className="space-y-2">
                  {getRecommendations(healthIndexes.overall.score).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Budget Tracker */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600">Cost Factor:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={costFactor}
                    onChange={(e) => setCostFactor(parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm font-mono font-medium text-gray-900">{costFactor.toFixed(1)}x</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="stat-card">
                  <p className="text-sm text-gray-600 mb-2">Total Budget</p>
                  <p className="text-3xl font-bold text-gray-900">${(budgetStatus.budget / 1000).toFixed(0)}K</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-gray-600 mb-2">Estimated Cost</p>
                  <p className="text-3xl font-bold text-primary-600">${(budgetStatus.used / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500 mt-1">{budgetStatus.percentUsed.toFixed(1)}% of budget</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-gray-600 mb-2">Remaining</p>
                  <p className={`text-3xl font-bold ${budgetStatus.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(budgetStatus.remaining / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    budgetStatus.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    budgetStatus.status === 'warning' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {budgetStatus.status === 'healthy' ? 'On Track' : 
                     budgetStatus.status === 'warning' ? 'Monitor' : 'Over Budget'}
                  </div>
                </div>
              </div>
            </div>

            {/* District Comparison */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">District Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={districtComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="district" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Total Potholes" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            {/* Predictive Analytics */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Predictive Insights</h2>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPredicted}
                    onChange={(e) => setShowPredicted(e.target.checked)}
                    className="rounded"
                  />
                  Show Predictions
                </label>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#6b7280"
                    label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis stroke="#6b7280" label={{ value: 'Detections', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" dot={{ r: 4 }} />
                  {showPredicted && (
                    <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Predicted" dot={{ r: 4 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Backlog Growth */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Repair Backlog Projection</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Area type="monotone" dataKey="actual" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Current Backlog" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Priorities Tab */}
        {selectedTab === 'priorities' && (
          <div className="space-y-6">
            {/* Urgency Summary */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card p-4 border-l-4 border-red-500">
                <p className="text-sm text-gray-600 mb-1">Immediate</p>
                <p className="text-3xl font-bold text-gray-900">{urgencyGroups.immediate.length}</p>
                <p className="text-xs text-gray-500 mt-1">0-3 days</p>
              </div>
              <div className="card p-4 border-l-4 border-orange-500">
                <p className="text-sm text-gray-600 mb-1">Urgent</p>
                <p className="text-3xl font-bold text-gray-900">{urgencyGroups.urgent.length}</p>
                <p className="text-xs text-gray-500 mt-1">3-7 days</p>
              </div>
              <div className="card p-4 border-l-4 border-yellow-500">
                <p className="text-sm text-gray-600 mb-1">Medium</p>
                <p className="text-3xl font-bold text-gray-900">{urgencyGroups.medium.length}</p>
                <p className="text-xs text-gray-500 mt-1">1-2 weeks</p>
              </div>
              <div className="card p-4 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Standard</p>
                <p className="text-3xl font-bold text-gray-900">{urgencyGroups.standard.length}</p>
                <p className="text-xs text-gray-500 mt-1">2-4 weeks</p>
              </div>
            </div>

            {/* Priority Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repair Window</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {priorityList.slice(0, 20).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-12 h-12 rounded flex items-center justify-center font-bold text-white ${
                              item.priorityScore >= 80 ? 'bg-red-500' :
                              item.priorityScore >= 60 ? 'bg-orange-500' :
                              item.priorityScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}>
                              {item.priorityScore}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.roadName}</p>
                          <p className="text-xs text-gray-500">{item.district} District</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.severity === 'high' ? 'bg-red-100 text-red-800' :
                            item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.actionTimeline}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">${item.estimatedCost.toFixed(0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.repairWindow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {selectedTab === 'budget' && (
          <div className="space-y-6">
            {/* Cost Breakdown by District */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Cost Breakdown by District</h2>
              <div className="space-y-4">
                {Object.entries(costs.byDistrict || {}).map(([district, data]) => (
                  <div key={district}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{district}</span>
                        <span className="text-xs text-gray-500 ml-2">({data.count} potholes)</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-gray-900">${data.total.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary-600 transition-all"
                        style={{ width: `${(data.total / costs.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost by Severity */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Cost Distribution by Severity</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(costs.bySeverity || {}).map(([severity, data]) => (
                  <div key={severity} className="stat-card">
                    <p className="text-sm text-gray-600 mb-2 capitalize">{severity} Severity</p>
                    <p className="text-2xl font-bold text-gray-900">${data.total.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{data.count} potholes</p>
                    <p className="text-xs text-gray-500">Avg: ${(data.total / data.count).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MunicipalityDashboard;
