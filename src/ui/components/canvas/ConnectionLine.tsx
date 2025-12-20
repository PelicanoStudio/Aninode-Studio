import {
    getWire,
    nodeLayout,
    portLayout,
    QualityTier,
    wireLayout,
    wireSimplification
} from '@/tokens';
import { Connection, ConnectionType, NodeData } from '@/ui/types';
import { getRayBoxIntersection } from '@/ui/utils/geometry';
import React from 'react';

interface ConnectionLineProps {
  connection: Connection;
  sourceNode: NodeData | undefined;
  targetNode: NodeData | undefined;
  viewport: { x: number; y: number; zoom: number };
  isDarkMode: boolean;
  onDelete: (id: string) => void;
  // Performance props
  qualityTier?: QualityTier;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceNode,
  targetNode,
  viewport,
  isDarkMode,
  onDelete,
  qualityTier = QualityTier.HIGH
}) => {
  if (!sourceNode || !targetNode) return null;

  // Get quality settings for wire rendering
  const wireQuality = wireSimplification[qualityTier];

  const s = sourceNode.position;
  const t = targetNode.position;
  let d = "";
  let strokeWidth = Math.max(1.5, Math.min(6, 2 / viewport.zoom));
  let strokeDash = "none";
  let markerEnd = "none";
  let strokeColor = getWire('default', isDarkMode);

  // Port offset constants from tokens
  const nodeWidth = nodeLayout.width;
  const sourceWidth = sourceNode?.dimensions?.width || nodeWidth;
  
  // Calculate dynamic output X based on node width
  // Original static logic: outputX = 272 (256 + 16). 
  // Dynamic: width + 16
  const outputX = sourceWidth + 16;
  const inputX = portLayout.inputX;    // -16
  const portY = portLayout.offsetY;    // 40
  const controlOffset = wireLayout.controlPointOffset; // 100

  // At MINIMAL tier, use simplified straight lines for all connection types
  if (qualityTier === QualityTier.MINIMAL && connection.type !== ConnectionType.STRAIGHT) {
    // Simple straight line at minimal quality
    const sx = s.x + outputX;
    const sy = s.y + portY;
    const tx = t.x + inputX;
    const ty = t.y + portY;
    d = `M ${sx} ${sy} L ${tx} ${ty}`;
  }
  // Telepathic Arrow
  else if (connection.type === ConnectionType.STRAIGHT) {
      const sWidth = sourceNode?.dimensions?.width || nodeWidth;
      const sHeight = sourceNode?.dimensions?.height || nodeLayout.defaultHeight;
      const tWidth = targetNode?.dimensions?.width || nodeWidth;
      const tHeight = targetNode?.dimensions?.height || nodeLayout.defaultHeight;
      
      const scx = s.x + sWidth/2; 
      const scy = s.y + sHeight/2; 
      const tcx = t.x + tWidth/2; 
      const tcy = t.y + tHeight/2;
      
      const end = getRayBoxIntersection(scx, scy, tcx, tcy, tWidth, tHeight, wireLayout.dashGap / viewport.zoom);
      const start = getRayBoxIntersection(tcx, tcy, scx, scy, sWidth, sHeight, wireLayout.dashGap / viewport.zoom);
      
      d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      strokeWidth = Math.max(1, 1.5 / viewport.zoom);
      
      // Only animate dash at higher quality tiers
      if (wireQuality.animateDash) {
        strokeDash = `${wireLayout.dashGap/viewport.zoom} ${wireLayout.dashGap/viewport.zoom}`;
      } else {
        strokeDash = `${wireLayout.dashGap * 2} ${wireLayout.dashGap * 2}`; // Static larger dash
      }
      markerEnd = "url(#arrow-head)";
  
  // Orthogonal Step
  } else if (connection.type === ConnectionType.STEP) {
      const sx = s.x + outputX; 
      const sy = s.y + portY; 
      const tx = t.x + inputX; 
      const ty = t.y + portY;
      const midX = sx + (tx - sx) / 2;
      d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  
  // Dotted Bezier
  } else if (connection.type === ConnectionType.DOTTED) {
      // Reduce control point offset at lower quality for flatter curves
      const qualityControlOffset = qualityTier === QualityTier.LOW 
        ? controlOffset * 0.5 
        : controlOffset;
      
      d = `M ${s.x + outputX} ${s.y + portY} C ${s.x + outputX + qualityControlOffset} ${s.y + portY} ${t.x + inputX - qualityControlOffset} ${t.y + portY} ${t.x + inputX} ${t.y + portY}`;
      
      if (wireQuality.animateDash) {
        strokeDash = `${wireLayout.dottedDash/viewport.zoom} ${wireLayout.dottedDash/viewport.zoom}`;
      } else {
        strokeDash = `${wireLayout.dottedDash * 2} ${wireLayout.dottedDash * 2}`; // Static larger dash
      }
  
  // Default & Double
  } else {
      // Reduce control point offset at lower quality for flatter curves
      const qualityControlOffset = qualityTier === QualityTier.LOW 
        ? controlOffset * 0.5 
        : controlOffset;
      
      d = `M ${s.x + outputX} ${s.y + portY} C ${s.x + outputX + qualityControlOffset} ${s.y + portY} ${t.x + inputX - qualityControlOffset} ${t.y + portY} ${t.x + inputX} ${t.y + portY}`;
  }

  const isDouble = connection.type === ConnectionType.DOUBLE;
  // Only render double wire gap at higher quality tiers
  const renderDoubleGap = isDouble && wireQuality.renderDoubleGap;

  return (
      <g>
          <path d={d} stroke="transparent" strokeWidth={wireLayout.hitboxWidth / viewport.zoom} fill="none" className="pointer-events-auto cursor-pointer" onClick={(e) => { if(e.altKey) onDelete(connection.id); }} />
          {renderDoubleGap ? (
              <>
                  <path d={d} stroke={strokeColor} strokeWidth={strokeWidth * 3} fill="none" strokeLinecap="round" className="pointer-events-none" />
                  <path d={d} stroke={getWire('doubleInner', isDarkMode)} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" className="pointer-events-none" />
              </>
          ) : isDouble ? (
              // Simplified double at low quality - just thicker line
              <path d={d} stroke={strokeColor} strokeWidth={strokeWidth * 2} fill="none" strokeLinecap="round" className="pointer-events-none" />
          ) : (
              <path d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDash} markerEnd={markerEnd} strokeLinecap="round" className="pointer-events-none" />
          )}
      </g>
  );
};
