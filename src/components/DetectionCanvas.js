import React, { useRef, useEffect, useState } from 'react';
import { getConfidenceColor } from '../services/detectionService';
import { formatConfidence } from '../utils/helpers';

const DetectionCanvas = ({ imageUrl, detections }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    
    image.onload = () => {
      const maxWidth = 1000;
      const maxHeight = 700;
      
      let width = image.width;
      let height = image.height;
      
      // Scale down if too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      setDimensions({ width, height });
      imageRef.current = image;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !dimensions.width) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);

    // Draw bounding boxes
    if (detections && detections.length > 0) {
      detections.forEach((detection, index) => {
        const color = getConfidenceColor(detection.confidence);
        
        // Draw box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

        // Draw label background
        const label = `Pothole ${formatConfidence(detection.confidence)}`;
        ctx.font = '14px JetBrains Mono, monospace';
        const textWidth = ctx.measureText(label).width;
        
        const labelX = detection.x;
        const labelY = detection.y - 8;
        
        ctx.fillStyle = color;
        ctx.fillRect(labelX, labelY - 22, textWidth + 12, 26);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, labelX + 6, labelY - 5);
      });
    }
  }, [detections, dimensions]);

  if (!dimensions.width) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading image...</p>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-lg shadow-lg border border-gray-200"
      />
      
      {detections && detections.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-600">
            {detections.length} {detections.length === 1 ? 'detection' : 'detections'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DetectionCanvas;
