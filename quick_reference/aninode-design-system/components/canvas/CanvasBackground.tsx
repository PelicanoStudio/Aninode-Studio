import React from 'react';
import { GridType } from '../../types';
import { SNAP_SIZE } from '../../constants';

interface CanvasBackgroundProps {
  viewport: { x: number; y: number; zoom: number };
  isDarkMode: boolean;
  gridType: GridType;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({
  viewport,
  isDarkMode,
  gridType
}) => {
  return (
    <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{ 
            backgroundPosition: `${viewport.x}px ${viewport.y}px`, 
            backgroundSize: `${SNAP_SIZE * viewport.zoom}px ${SNAP_SIZE * viewport.zoom}px`, 
            backgroundImage: gridType === 'DOTS' 
                ? `radial-gradient(${isDarkMode ? '#ffffffff' : '#333'} 1px, transparent 2px)` 
                : `linear-gradient(${isDarkMode ? '#ffffffff' : '#333'} 1px, transparent 1.5px), linear-gradient(90deg, ${isDarkMode ? '#ffffffff' : '#333'} 1.5px, transparent 1.5px)` 
        }} 
    />
  );
};
