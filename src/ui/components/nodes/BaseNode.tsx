// @ts-nocheck - Resize logic has unused deltaY reserved for non-proportional mode
import {
  animation,
  getBorder,
  getPort,
  getSurface,
  iconSizes,
  isFeatureEnabled,
  nodeLayout,
  portLayout,
  QualityTier,
  signalActive,
  zIndex
} from '@/tokens';
import { NodeData, NodeType } from '@/ui/types';
import { Activity, Box, ChevronDown, ChevronUp, Copy, Cpu, GripHorizontal, Hash, Image as ImageIcon, Monitor, Sliders, ToggleLeft } from 'lucide-react';
import React from 'react';

interface BaseNodeProps {
  data: NodeData;
  isSelected: boolean;
  isActiveChain: boolean;
  accentColor?: string;
  zoom: number;
  isDarkMode: boolean;
  isHotConnectionSource?: boolean;
  // Performance props
  qualityTier?: QualityTier;
  disableGlow?: boolean;
  // Handlers
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  // Generic Port Handlers
  onPortDown: (id: string, type: 'input' | 'output', e: React.MouseEvent) => void;
  onPortUp: (id: string, type: 'input' | 'output', e: React.MouseEvent) => void;
  onPortContextMenu?: (id: string, type: 'input' | 'output', e: React.MouseEvent) => void;
  onPortDoubleClick?: (id: string, type: 'input' | 'output', e: React.MouseEvent) => void;
  // Node Drag Handler
  onNodeDown: (e: React.MouseEvent) => void;
  // Node Resize Handler
  onResize?: (id: string, width: number, height: number, x?: number, y?: number) => void;
  children: React.ReactNode;
}

const getNodeIcon = (type: NodeType) => {
  const iconSize = iconSizes.sm;
  switch (type) {
    case NodeType.OSCILLATOR: return <Activity size={iconSize} />;
    case NodeType.PICKER: return <ImageIcon size={iconSize} />;
    case NodeType.TRANSFORM: return <Box size={iconSize} />;
    case NodeType.OUTPUT: return <Monitor size={iconSize} />;
    case NodeType.LOGIC: return <Cpu size={iconSize} />;
    case NodeType.SLIDER: return <Sliders size={iconSize} />;
    case NodeType.NUMBER: return <Hash size={iconSize} />;
    case NodeType.BOOLEAN: return <ToggleLeft size={iconSize} />;
    case NodeType.CLONE: return <Copy size={iconSize} />;
    default: return <Box size={iconSize} />;
  }
};

export const getTypeLabel = (type: NodeType) => {
    switch(type) {
        case NodeType.OSCILLATOR: return "LFO";
        case NodeType.TRANSFORM: return "MODIFIER";
        case NodeType.SLIDER: return "SLIDER";
        case NodeType.NUMBER: return "VALUE";
        case NodeType.BOOLEAN: return "SWITCH";
        case NodeType.CLONE: return "INSTANCE";
        default: return type;
    }
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  data, 
  isSelected, 
  isActiveChain,
  accentColor = signalActive,
  zoom,
  isDarkMode,
  isHotConnectionSource,
  qualityTier = QualityTier.HIGH,
  disableGlow = false,
  onSelect, 
  onToggleCollapse,
  onPortDown,
  onPortUp,
  onPortContextMenu,
  onPortDoubleClick,
  onNodeDown,
  onResize,
  children 
}) => {
  
  // Visual Logic
  const borderColor = (isSelected || isActiveChain) 
      ? accentColor 
      : getBorder('default', isDarkMode);
  
  // Surface colors from tokens
  const bgStyle = { backgroundColor: getSurface('node', isDarkMode) };
  const subTextColor = isDarkMode ? 'text-neutral-400' : 'text-neutral-500';

  // Inverse scaling for borders using token values
  const { scaleMin, scaleMax, activeScaleMin, activeScaleMax } = animation.borderAnimation;
  const borderScale = Math.max(scaleMin, Math.min(scaleMax, 1 / zoom));
  const activeBorderScale = Math.max(activeScaleMin, Math.min(activeScaleMax, 2 / zoom));
  const finalBorderWidth = isSelected ? activeBorderScale : borderScale;
  
  // Performance-aware glow rendering
  const glowEnabled = !disableGlow && isFeatureEnabled(qualityTier, 'glow');
  const shadowsEnabled = isFeatureEnabled(qualityTier, 'shadows');
  
  const { selectedRadius, activeChainRadius } = animation.glow;
  
  // Determine shadow style based on quality tier
  let shadowStyle: string;
  if (glowEnabled && isSelected) {
    shadowStyle = `0 0 ${selectedRadius / zoom}px ${accentColor}30`;
  } else if (glowEnabled && isActiveChain) {
    shadowStyle = `0 0 ${activeChainRadius / zoom}px ${accentColor}10`;
  } else if (shadowsEnabled) {
    shadowStyle = isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)';
  } else {
    shadowStyle = 'none'; // MINIMAL tier: no shadows at all
  }

  // Clone Animation
  const animationClass = data.type === NodeType.CLONE ? 'animate-in fade-in zoom-in duration-300' : '';

  // Dimensions
  const styleWidth = data.dimensions?.width || nodeLayout.width;
  const styleHeight = data.dimensions?.height || 'auto';

  // Resize Handler Logic
  // Resize is triggered from 4 invisible corner areas
  // Alt key: Resize from center
  // Shift key (implicit in requirements): Proportional/Aspect Ratio lock is DEFAULT
  const handleResizeStart = (corner: 'nw' | 'ne' | 'sw' | 'se') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onResize) return;

    // Capture initial state
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = data.dimensions?.width || nodeLayout.width;
    const startHeight = data.dimensions?.height || nodeLayout.defaultHeight; // Best guess start height
    const startPosX = data.position.x;
    const startPosY = data.position.y;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (mv: MouseEvent) => {
      const scaleFromCenter = mv.altKey; // Alt key triggers center scaling
      
      const deltaX = (mv.clientX - startX) / zoom;
      const _deltaY = (mv.clientY - startY) / zoom; // Reserved for non-proportional resize

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      // Calculate raw new dimensions based on corner
      // Proportional resizing is ENFORCED (Locked Ratio)
      // We use the dominant axis (larger delta) to drive the scaling
      
      // Determine dominant delta based on corner direction
      // Defaulting to width-driven scaling for stability, or X-axis driven
      let scaleFactor = 1;
      
      if (corner === 'se') {
          scaleFactor = (startWidth + deltaX) / startWidth;
      } else if (corner === 'sw') {
          scaleFactor = (startWidth - deltaX) / startWidth;
      } else if (corner === 'ne') {
           scaleFactor = (startWidth + deltaX) / startWidth;
      } else if (corner === 'nw') {
           scaleFactor = (startWidth - deltaX) / startWidth;
      }

      // Apply scaling
      newWidth = startWidth * scaleFactor;
      newHeight = startHeight * scaleFactor;

      // Min size constraints
      if (newWidth < 160) { newWidth = 160; newHeight = newWidth / aspectRatio; }
      if (newHeight < 80) { newHeight = 80; newWidth = newHeight * aspectRatio; }

      // Position adjustments
      if (scaleFromCenter) {
          // Center scaling: Position shifts to keep center constant
          // Width grew by (newWidth - startWidth), so move X by half that diff * -1
          const widthDiff = newWidth - startWidth;
          const heightDiff = newHeight - startHeight;
          newX = startPosX - (widthDiff / 2);
          newY = startPosY - (heightDiff / 2);
      } else {
          // Corner scaling: Anchor opposite corner
          // If dragging SE, Top-Left (x,y) stays same.
          // If dragging SW, Right edge stays same -> X moves by deltaWidth
          // If dragging NE, Bottom edge stays same -> Y moves by deltaHeight (but Y is top...)
          // Wait, simple logic:
          // X/Y change only if dragging Left or Top sides
          
          if (corner === 'sw' || corner === 'nw') {
              newX = startPosX + (startWidth - newWidth);
          }
          if (corner === 'ne' || corner === 'nw') {
              newY = startPosY + (startHeight - newHeight);
          }
      }

      onResize(data.id, newWidth, newHeight, newX, newY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const resizeHitboxSize = 20; // Invisible corner size

  return (
    <div 
      className={`absolute flex flex-col rounded-xl backdrop-blur-md border-solid group select-none transition-colors duration-200 ease-out pointer-events-auto ${animationClass}`}
      style={{ 
        ...bgStyle,
        left: data.position.x, 
        top: data.position.y,
        borderColor: borderColor,
        borderWidth: `${finalBorderWidth}px`,
        boxShadow: shadowStyle,
        zIndex: isSelected ? zIndex.nodeSelected : zIndex.node,
        width: styleWidth,
        height: styleHeight,
        borderRadius: nodeLayout.borderRadius 
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(data.id);
      }}
      onMouseDown={(e) => {
        onNodeDown(e);
      }}
    >
      {/* Invisible Resize Handles (Corners) */}
      {/* SE */}
      <div 
        className="absolute bottom-0 right-0 z-50 cursor-nwse-resize"
        style={{ width: resizeHitboxSize, height: resizeHitboxSize }}
        onMouseDown={handleResizeStart('se')}
      />
      {/* SW */}
      <div 
        className="absolute bottom-0 left-0 z-50 cursor-nesw-resize"
        style={{ width: resizeHitboxSize, height: resizeHitboxSize }}
        onMouseDown={handleResizeStart('sw')}
      />
      {/* NE */}
      <div 
        className="absolute top-0 right-0 z-50 cursor-nesw-resize"
        style={{ width: resizeHitboxSize, height: resizeHitboxSize }}
        onMouseDown={handleResizeStart('ne')}
      />
      {/* NW */}
      <div 
        className="absolute top-0 left-0 z-50 cursor-nwse-resize"
        style={{ width: resizeHitboxSize, height: resizeHitboxSize }}
        onMouseDown={handleResizeStart('nw')}
      />

      {/* Input Port (Left) */}
      {data.type !== NodeType.PICKER && data.type !== NodeType.SLIDER && data.type !== NodeType.NUMBER && data.type !== NodeType.BOOLEAN && (
        <div 
            className="absolute z-50 group/port flex items-center justify-center cursor-crosshair"
            style={{ 
                left: -portLayout.offsetX, // Use token
                top: portLayout.offsetY - 12, // Center vertically roughly
                width: portLayout.hitboxSize,
                height: portLayout.hitboxSize
            }}
            onMouseDown={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortDown(data.id, 'input', e);
            }}

            onMouseUp={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortUp(data.id, 'input', e);
            }}
            onContextMenu={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortContextMenu && onPortContextMenu(data.id, 'input', e);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortDoubleClick && onPortDoubleClick(data.id, 'input', e);
            }}
        >
            <div 
                className={`w-3 h-3 border rounded-full flex items-center justify-center transition-all duration-300 group-hover/port:scale-150 ${isDarkMode ? 'bg-black' : 'bg-white'} ${isHotConnectionSource ? 'animate-ping' : ''}`}
                style={{ 
                    borderColor: isActiveChain ? accentColor : getPort('inactive', isDarkMode),
                    borderWidth: `${borderScale}px` 
                }}
            >
                <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: isActiveChain ? accentColor : getPort('innerInactive', isDarkMode) }}
                />
            </div>
        </div>
      )}

      {/* Output Port (Right) */}
      {data.type !== NodeType.OUTPUT && (
         <div 
            className="absolute z-50 group/port flex items-center justify-center cursor-crosshair"
            style={{ 
                right: -portLayout.offsetX, // Use token
                top: portLayout.offsetY - 12, 
                width: portLayout.hitboxSize,
                height: portLayout.hitboxSize
            }}
            onMouseDown={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortDown(data.id, 'output', e);
            }}
            onMouseUp={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortUp(data.id, 'output', e);
            }}
            onContextMenu={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortContextMenu && onPortContextMenu(data.id, 'output', e);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation(); e.preventDefault();
                onPortDoubleClick && onPortDoubleClick(data.id, 'output', e);
            }}
         >
            <div 
                className={`w-3 h-3 border rounded-full flex items-center justify-center transition-all duration-300 group-hover/port:scale-150 ${isDarkMode ? 'bg-black' : 'bg-white'} ${isHotConnectionSource ? 'animate-ping' : ''}`}
                style={{ 
                    borderColor: isActiveChain ? accentColor : getPort('inactive', isDarkMode),
                    borderWidth: `${borderScale}px`
                }}
            >
                <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: isActiveChain ? accentColor : getPort('innerInactive', isDarkMode) }}
                />
            </div>
         </div>
      )}

      {/* Header */}
      <div 
        className={`flex-none flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing ${isDarkMode ? 'border-white/5' : 'border-neutral-200'}`}
        style={{ borderBottomWidth: `${borderScale}px` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: isActiveChain || isSelected ? accentColor : (isDarkMode ? '#666' : '#999') }}>
            {getNodeIcon(data.type)}
          </span>
          <div className="flex flex-col leading-none">
            <span className={`text-xs font-semibold tracking-wide ${isActiveChain || isSelected ? (isDarkMode ? 'text-white' : 'text-black') : subTextColor}`}>{data.label}</span>
            <span className="text-[10px] font-mono text-neutral-600 uppercase mt-0.5">{getTypeLabel(data.type)}</span>
          </div>
        </div>
        <div 
            className={`cursor-pointer p-1 hover:text-opacity-80 ${subTextColor}`}
            onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(data.id);
            }}
        >
          {data.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Body */}
      {!data.collapsed && (
        <div className="p-3 flex-1 min-h-0 overflow-auto flex flex-col">
          {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                  // @ts-ignore
                  return React.cloneElement(child, { isDarkMode, accentColor });
              }
              return child;
          })}
        </div>
      )}
      
      {data.collapsed && (
          <div className="px-3 pb-2 pt-1 flex justify-center">
              <GripHorizontal size={12} className={isDarkMode ? "text-neutral-700" : "text-neutral-300"} />
          </div>
      )}
    </div>
  );
};
