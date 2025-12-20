import { canvasLayout, getGrid } from '@/tokens';
import { GridType } from '@/ui/types';
import React from 'react';

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
  const gridColor = getGrid(isDarkMode);
  const snapSize = canvasLayout.snapSize;
  
  // Dynamic Level of Detail (LOD) Calculation
  // Prevent grid from becoming a solid block when zoomed out
  const getLOD = (zoom: number) => {
    if (zoom < 0.25) return 4; // Show every 4th line
    if (zoom < 0.5) return 2;  // Show every 2nd line
    return 1;                  // Show all lines
  };

  const lodMultiplier = getLOD(viewport.zoom);
  const visualsSnapSize = snapSize * lodMultiplier;
  const scaledSize = visualsSnapSize * viewport.zoom;

  // Offsets to align grid with viewport panning
  let patternX = (viewport.x % scaledSize);
  let patternY = (viewport.y % scaledSize);

  // For CROSS grid, we render the cross in the center of the tile to avoid clipping.
  // To align this center with the grid intersections (0,0), we need to shift the pattern by half a cell.
  if (gridType === 'CROSS') {
      patternX -= scaledSize / 2;
      patternY -= scaledSize / 2;
  }

  // SVG Pattern Definitions
  const renderPattern = () => {
    const strokeWidth = 1.0; // Keep thin lines
    const crossSize = 4; // Size of the cross arms
    
    switch (gridType) {
      case 'DOTS':
        return (
          <circle cx={strokeWidth} cy={strokeWidth} r={1} fill={gridColor} />
        );
      case 'CROSS':
        // Isolated crosses: + shape at intersection, not connected lines
        return (
            <path 
                d={`M ${-crossSize} 0 L ${crossSize} 0 M 0 ${-crossSize} L 0 ${crossSize}`} 
                stroke={gridColor} 
                strokeWidth={strokeWidth} 
                vectorEffect="non-scaling-stroke"
                transform={`translate(${strokeWidth/2}, ${strokeWidth/2})`}
            />
        );
      case 'LINES':
      default:
        // Standard square grid
        return (
          <path 
            d={`M ${scaledSize} 0 L 0 0 0 ${scaledSize}`} 
            fill="none" 
            stroke={gridColor} 
            strokeWidth={strokeWidth} 
          />
        );
    }
  };

  return (
    <div 
        className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden" 
        style={{ zIndex: 0 }}
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern 
            id={`grid-pattern-${gridType}`} 
            x={patternX} 
            y={patternY} 
            width={scaledSize} 
            height={scaledSize} 
            patternUnits="userSpaceOnUse"
          >
            {gridType === 'CROSS' ? (
                // Center the cross in the tile
                 <g transform={`translate(${scaledSize/2}, ${scaledSize/2})`}>
                    {renderPattern()}
                 </g>
            ) : (
                renderPattern()
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-pattern-${gridType})`} />
      </svg>
    </div>
  );
};

