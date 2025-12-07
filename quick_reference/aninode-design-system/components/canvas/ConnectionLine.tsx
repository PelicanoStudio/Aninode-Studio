import React from 'react';
import { Connection, ConnectionType, NodeData } from '../../types';
import { getRayBoxIntersection } from '../../utils/geometry';

interface ConnectionLineProps {
  connection: Connection;
  sourceNode: NodeData | undefined;
  targetNode: NodeData | undefined;
  viewport: { x: number; y: number; zoom: number };
  isDarkMode: boolean;
  onDelete: (id: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceNode,
  targetNode,
  viewport,
  isDarkMode,
  onDelete
}) => {
  if (!sourceNode || !targetNode) return null;

  const s = sourceNode.position;
  const t = targetNode.position;
  let d = "";
  let strokeWidth = Math.max(1.5, Math.min(6, 2 / viewport.zoom));
  let strokeDash = "none";
  let markerEnd = "none";
  let strokeColor = isDarkMode ? "#666" : "#999";

  // Telepathic Arrow
  if (connection.type === ConnectionType.STRAIGHT) {
      const sw = 256; const sh = 100; const scx = s.x + sw/2; const scy = s.y + sh/2; const tcx = t.x + sw/2; const tcy = t.y + sh/2;
      const end = getRayBoxIntersection(scx, scy, tcx, tcy, 256, 128, 5 / viewport.zoom);
      const start = getRayBoxIntersection(tcx, tcy, scx, scy, 256, 128, 5 / viewport.zoom);
      d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      strokeWidth = Math.max(1, 1.5 / viewport.zoom);
      strokeDash = `${5/viewport.zoom} ${5/viewport.zoom}`;
      markerEnd = "url(#arrow-head)";
  
  // Orthogonal Step
  } else if (connection.type === ConnectionType.STEP) {
      const sx = s.x + 272; const sy = s.y + 40; const tx = t.x - 16; const ty = t.y + 40;
      const midX = sx + (tx - sx) / 2;
      d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  
  // Dotted Bezier
  } else if (connection.type === ConnectionType.DOTTED) {
      d = `M ${s.x + 272} ${s.y + 40} C ${s.x + 272 + 100} ${s.y + 40} ${t.x - 16 - 100} ${t.y + 40} ${t.x - 16} ${t.y + 40}`;
      strokeDash = `${10/viewport.zoom} ${10/viewport.zoom}`;
  
  // Default & Double
  } else {
      d = `M ${s.x + 272} ${s.y + 40} C ${s.x + 272 + 100} ${s.y + 40} ${t.x - 16 - 100} ${t.y + 40} ${t.x - 16} ${t.y + 40}`;
  }

  const isDouble = connection.type === ConnectionType.DOUBLE;

  return (
      <g>
          <path d={d} stroke="transparent" strokeWidth={15 / viewport.zoom} fill="none" className="pointer-events-auto cursor-pointer" onClick={(e) => { if(e.altKey) onDelete(connection.id); }} />
          {isDouble ? (
              <>
                  <path d={d} stroke={strokeColor} strokeWidth={strokeWidth * 3} fill="none" strokeLinecap="round" className="pointer-events-none" />
                  <path d={d} stroke={isDarkMode ? '#000000' : '#F5F5F5'} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" className="pointer-events-none" />
              </>
          ) : (
              <path d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDash} markerEnd={markerEnd} strokeLinecap="round" className="pointer-events-none" />
          )}
      </g>
  );
};
