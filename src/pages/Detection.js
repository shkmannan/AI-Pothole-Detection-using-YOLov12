import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ImageUpload from '../components/ImageUpload';
import DetectionCanvas from '../components/DetectionCanvas';
import DetectionResults from '../components/DetectionResults';
import ProcessingLoader from '../components/ProcessingLoader';
import { detectPotholes } from '../services/detectionService';
import { fileToDataUrl } from '../utils/helpers';

const Detection = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = async (file) => {
    setError(null);
    setDetections(null);
    setMetadata(null);
    setImageFile(file);

    try {
      const dataUrl = await fileToDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setError('Failed to load image. Please try again.');
    }
  };

  const handleDetect = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await detectPotholes(imageFile);
      
      if (result.success) {
        setDetections(result.detections);
        setMetadata(result.metadata);
      } else {
        setError('Detection failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during detection. Please try again.');
      console.error('Detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setDetections(null);
    setMetadata(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pothole Detection
          </h1>
          <p className="text-gray-600">
            Upload a road image to detect and analyze potholes using AI
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Column - Upload and Image */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Section */}
            {!imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-8"
              >
                <ImageUpload 
                  onImageSelect={handleImageSelect}
                  disabled={isProcessing}
                />
              </motion.div>
            )}

            {/* Image Preview and Results */}
            {imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {detections ? 'Detection Results' : 'Uploaded Image'}
                  </h2>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-5 h-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </div>

                {isProcessing ? (
                  <ProcessingLoader />
                ) : (
                  <div className="flex justify-center">
                    <DetectionCanvas 
                      imageUrl={imageUrl}
                      detections={detections}
                    />
                  </div>
                )}

                {/* Action Button */}
                {!isProcessing && !detections && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleDetect}
                      className="btn-primary"
                      disabled={isProcessing}
                    >
                      <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Run Detection
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Instructions */}
            {!imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Detection Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Use clear, well-lit road images for best results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Ensure potholes are visible and in focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Avoid images with excessive blur or obstruction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Supported formats: JPEG, PNG, WebP (max 10MB)</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {detections && metadata ? (
              <DetectionResults 
                detections={detections}
                processingTime={metadata.processingTime}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    No detections yet
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload an image and run detection to see results
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detection;
