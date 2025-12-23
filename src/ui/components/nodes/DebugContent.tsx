/**
 * DebugContent Component
 * 
 * A reactive debug panel that displays live node data.
 * Uses requestAnimationFrame + useSnapshot for high-frequency updates.
 */

import { resolveProperty } from '@core/resolveProperty';
import { engineStore } from '@core/store';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';

interface DebugContentProps {
  nodeId: string;
  config: Record<string, any>;
}

export const DebugContent: React.FC<DebugContentProps> = ({ nodeId, config }) => {
  // Force re-render at ~30fps for smooth value display
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    let animationId: number;
    let lastUpdate = 0;
    const update = (time: number) => {
      // Throttle to ~30fps (every 33ms) to reduce render load
      if (time - lastUpdate > 33) {
        setTick(t => t + 1);
        lastUpdate = time;
      }
      animationId = requestAnimationFrame(update);
    };
    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  // Use useSnapshot for reactive Valtio subscription
  const snap = useSnapshot(engineStore);
  
  // Read live data (snapshot ensures we get latest on each render)
  const myOutputs = snap.runtime.nodeOutputs[nodeId] || {};
  const myOverrides = snap.runtime.overrides[nodeId] || {};
  
  // Find incoming connections to this node
  const incomingConnections = Object.values(snap.project.connections)
    .filter((conn: any) => conn.targetNodeId === nodeId);
  
  // Get source node data for each incoming connection
  const sourceData = incomingConnections.map((conn: any) => {
    const sourceNode = snap.project.nodes[conn.sourceNodeId];
    const sourceOutputs = snap.runtime.nodeOutputs[conn.sourceNodeId] || {};
    return {
      sourceId: conn.sourceNodeId,
      sourceName: sourceNode?.name || conn.sourceNodeId,
      sourceType: sourceNode?.type || 'unknown',
      sourceProp: conn.sourceProp || 'value',
      targetProp: conn.targetProp || 'value',
      sourceOutputs,
      sourceValue: sourceOutputs[conn.sourceProp || 'value'],
    };
  });
  
  // Build resolved props using 3-Level Hierarchy
  const resolvedProps: Record<string, any> = {};
  Object.keys(config || {}).forEach(key => {
    resolvedProps[key] = resolveProperty(nodeId, key, config[key]);
  });
  // Also show 'value' if we have an override for it (even if not in base props)
  if (myOverrides['value'] !== undefined) {
    resolvedProps['value'] = myOverrides['value'];
  }
  
  return (
    <div 
      className="flex flex-col gap-2 p-2 text-[10px] font-mono max-h-[280px] overflow-auto" 
      onMouseDown={(e) => e.stopPropagation()} 
      onWheel={(e) => e.stopPropagation()}
    >
      {/* INCOMING CONNECTIONS */}
      <div>
        <div className="text-pink-500 mb-1 font-bold">📥 INCOMING ({incomingConnections.length})</div>
        {sourceData.length === 0 
          ? <span className="text-neutral-600 italic">no connections</span>
          : sourceData.map((src, i) => (
              <div key={i} className="mb-2 pl-2 border-l border-pink-500/30">
                <div className="text-neutral-400">{src.sourceName} <span className="text-neutral-600">({src.sourceType})</span></div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{src.sourceProp}→{src.targetProp}:</span>
                  <span className="text-pink-400">
                    {src.sourceValue !== undefined 
                      ? (typeof src.sourceValue === 'number' ? src.sourceValue.toFixed(3) : JSON.stringify(src.sourceValue)) 
                      : 'undefined'}
                  </span>
                </div>
              </div>
            ))
        }
      </div>
      
      {/* RESOLVED VALUES (using 3-Level Hierarchy) */}
      <div>
        <div className="text-green-500 mb-1 font-bold">📋 RESOLVED VALUES</div>
        {Object.entries(resolvedProps).map(([key, val]) => (
          <div key={key} className="flex justify-between">
            <span className="text-neutral-400">{key}:</span>
            <span className="text-green-400">{typeof val === 'number' ? val.toFixed(2) : JSON.stringify(val)}</span>
          </div>
        ))}
      </div>
      
      {/* MY OVERRIDES (values written by connections) */}
      <div>
        <div className="text-yellow-500 mb-1 font-bold">⚡ OVERRIDES</div>
        {Object.keys(myOverrides).length === 0 
          ? <span className="text-neutral-600 italic">none</span>
          : Object.entries(myOverrides).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-neutral-400">{key}:</span>
                <span className="text-yellow-400">{typeof val === 'number' ? (val as number).toFixed(3) : JSON.stringify(val)}</span>
              </div>
            ))
        }
      </div>
      
      {/* MY OUTPUTS (what this node produces) */}
      <div>
        <div className="text-cyan-500 mb-1 font-bold">📤 MY OUTPUTS</div>
        {Object.keys(myOutputs).length === 0 
          ? <span className="text-neutral-600 italic">none</span>
          : Object.entries(myOutputs).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-neutral-400">{key}:</span>
                <span className="text-cyan-400">{typeof val === 'number' ? (val as number).toFixed(3) : JSON.stringify(val)}</span>
              </div>
            ))
        }
      </div>
    </div>
  );
};
