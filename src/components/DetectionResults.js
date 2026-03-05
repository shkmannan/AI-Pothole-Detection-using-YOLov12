import React from 'react';
import { motion } from 'framer-motion';
import { calculateStats, formatConfidence, getSeverityColor } from '../utils/helpers';
import { calculateSeverity } from '../services/detectionService';

const DetectionResults = ({ detections, processingTime }) => {
  const stats = calculateStats(detections);
  const severity = calculateSeverity(detections);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Summary Header */}
      <motion.div variants={item}>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Detection Summary</h3>
        <div className={`inline-block px-4 py-2 rounded-lg border ${getSeverityColor(severity)}`}>
          <span className="text-sm font-medium">Severity: {severity}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Detected</span>
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Potholes found</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Confidence</span>
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatConfidence(stats.avgConfidence)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Detection accuracy</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Processing Time</span>
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {processingTime ? `${processingTime.toFixed(2)}s` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Inference time</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Model</span>
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">YOLOv12</p>
          <p className="text-xs text-gray-500 mt-1">Detection model</p>
        </div>
      </motion.div>

      {/* Confidence Breakdown */}
      <motion.div variants={item} className="card p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Confidence Distribution</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700">High (≥85%)</span>
            </div>
            <span className="text-sm font-mono font-medium text-gray-900">
              {stats.highConfidence}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">Medium (70-85%)</span>
            </div>
            <span className="text-sm font-mono font-medium text-gray-900">
              {stats.mediumConfidence}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Low (&lt;70%)</span>
            </div>
            <span className="text-sm font-mono font-medium text-gray-900">
              {stats.lowConfidence}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Detection List */}
      <motion.div variants={item} className="card p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Individual Detections</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {detections.map((detection, index) => (
            <div
              key={detection.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-medium text-gray-500">
                  #{index + 1}
                </span>
                <span className="text-sm text-gray-700">Pothole</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500">
                  {detection.width}×{detection.height}px
                </span>
                <span
                  className="px-2 py-1 text-xs font-mono font-medium rounded"
                  style={{
                    backgroundColor: `${getConfidenceColor(detection.confidence)}20`,
                    color: getConfidenceColor(detection.confidence)
                  }}
                >
                  {formatConfidence(detection.confidence)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DetectionResults;

function getConfidenceColor(confidence) {
  if (confidence >= 0.85) return '#10b981';
  if (confidence >= 0.70) return '#f59e0b';
  return '#ef4444';
}
