/**
 * EngineStats Component
 * 
 * Debug overlay for monitoring engine performance.
 * Shows FPS, frame time, node counts, and other stats.
 */

import { engine } from '@/engines/AnimationEngine';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface StatsData {
  fps: number;
  frameTime: number;
  realElapsedTime: number;
  nodeCount: number;
  outputCount: number;
  connectionCount: number;
}

interface EngineStatsProps {
  visible?: boolean;
  onClose?: () => void;
}

export const EngineStats: React.FC<EngineStatsProps> = ({ visible = true, onClose }) => {
  const [stats, setStats] = useState<StatsData>({
    fps: 60,
    frameTime: 16.67,
    realElapsedTime: 0,
    nodeCount: 0,
    outputCount: 0,
    connectionCount: 0,
  });

  useEffect(() => {
    if (!visible) return;
    
    const update = () => {
      setStats(engine.stats);
    };
    
    // Update stats at 10fps (every 100ms) to avoid overhead
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const fpsColor = stats.fps >= 50 ? '#4ade80' : stats.fps >= 30 ? '#fbbf24' : '#ef4444';

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 11,
        zIndex: 9999,
        minWidth: 180,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 'bold', color: '#aaa', letterSpacing: 1 }}>
          ENGINE STATS
        </span>
        {onClose && (
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>FPS:</span>
        <span style={{ color: fpsColor, fontWeight: 'bold' }}>{stats.fps}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>Frame:</span>
        <span>{stats.frameTime.toFixed(2)}ms</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>Time:</span>
        <span>{stats.realElapsedTime.toFixed(1)}s</span>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>Nodes:</span>
        <span>{stats.nodeCount}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>Outputs:</span>
        <span>{stats.outputCount}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Connections:</span>
        <span>{stats.connectionCount}</span>
      </div>
    </div>
  );
};
