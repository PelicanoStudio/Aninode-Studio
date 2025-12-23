// @ts-nocheck - Touch handler conflicts (useLongPress spreads overlap), not priority for desktop MVP
import {
    getSurface,
    iconSizes,
    signalActive
} from '@/tokens';
import { useLongPress } from '@/ui/hooks/useLongPress';
import { NodeData, NodeType } from '@/ui/types';
import { resolveProperty } from '@core/resolveProperty';
import { engineStore } from '@core/store';
import { Copy } from 'lucide-react';
import React from 'react';
import { useSnapshot } from 'valtio';
import { DebugContent } from './DebugContent';
import { Visualizer } from './Visualizer';

interface NodeContentProps {
  node: NodeData;
  isDarkMode: boolean;
  updateConfig: (key: string, val: any) => void;
  pushHistory: () => void;
  onPropertyContextMenu?: (nodeId: string, propKey: string, x: number, y: number) => void;
}

export const NodeContent: React.FC<NodeContentProps> = ({
  node,
  isDarkMode,
  updateConfig,
  pushHistory,
  onPropertyContextMenu
}) => {
  // Subscribe to runtime overrides for reactive updates when connections change values
  const snap = useSnapshot(engineStore);
  const _overrides = snap.runtime.overrides[node.id]; // Triggers re-render on override change
  const handleLongPress = (propKey: string) => {
      return useLongPress((e) => {
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
          onPropertyContextMenu?.(node.id, propKey, clientX, clientY);
      });
  };

  const valueLongPress = handleLongPress('value');
  const enabledLongPress = handleLongPress('enabled');

  // Token-based styling
  const accentColor = signalActive;
  const inactiveSwitchBg = isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300';
  const inputBorderClass = isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black';

  switch(node.type) {
      case NodeType.OSCILLATOR: {
          // Read resolved values (includes overrides from connections)
          const resolvedFrequency = resolveProperty(node.id, 'frequency', node.config.frequency || 1);
          const resolvedWaveform = resolveProperty(node.id, 'waveform', node.config.waveform || 'sine');
          return (
              <div className="w-full h-full flex flex-col items-center justify-center">
                  <Visualizer 
                    mode="static"
                    type="sine" 
                    waveform={resolvedWaveform}
                    frequency={resolvedFrequency} 
                    amplitude={1} 
                    active={node.config?.enabled !== false} 
                    isDarkMode={isDarkMode} 
                  />
              </div>
          );
      }
      case NodeType.PICKER:
          return (
              <div 
                className="w-full h-full flex-1 min-h-[100px] rounded-lg overflow-hidden relative group"
                style={{ backgroundColor: getSurface('menu', isDarkMode) }}
              >
                   {node.config.src ? <img src={node.config.src} alt="Asset" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-700">No Asset</div>}
              </div>
          );
      case NodeType.SLIDER:
          return (
              <div className="pt-2" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  <div className="flex justify-between text-xs font-mono mb-1 opacity-70">
                      <span>{node.config.min || 0}</span>
                      <span style={{ color: accentColor }} className="font-bold">{node.config.value}</span>
                      <span>{node.config.max || 100}</span>
                  </div>
                  <input 
                    type="range" 
                    min={node.config.min} 
                    max={node.config.max} 
                    step={node.config.step} 
                    value={node.config.value} 
                    onChange={(e) => updateConfig('value', parseFloat(e.target.value))} 
                    onMouseUp={pushHistory} 
                    onTouchEnd={pushHistory} 
                    className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: accentColor }}
                    onContextMenu={(e) => { e.preventDefault(); onPropertyContextMenu?.(node.id, 'value', e.clientX, e.clientY); }}
                    {...valueLongPress}
                  />
              </div>
          );
      case NodeType.NUMBER:
          return (
              <div className="pt-1">
                  <input 
                    type="number" 
                    value={node.config.value} 
                    onChange={(e) => updateConfig('value', parseFloat(e.target.value))} 
                    onBlur={pushHistory} 
                    className={`w-full bg-transparent border-b ${inputBorderClass} font-mono text-lg focus:outline-none transition-colors`}
                    style={{ '--focus-border-color': accentColor } as React.CSSProperties}
                    onMouseDown={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => e.stopPropagation()} 
                    onContextMenu={(e) => { e.preventDefault(); onPropertyContextMenu?.(node.id, 'value', e.clientX, e.clientY); }}
                    {...valueLongPress}
                  />
              </div>
          );
      case NodeType.BOOLEAN:
          return (
              <div className="flex items-center justify-between pt-1" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  <span className="text-xs font-mono opacity-50">{node.config.enabled ? 'ON' : 'OFF'}</span>
                  <button 
                    onClick={() => { updateConfig('enabled', !node.config.enabled); pushHistory(); }} 
                    className={`w-10 h-5 rounded-full relative transition-colors ${node.config.enabled ? '' : inactiveSwitchBg}`}
                    style={{ backgroundColor: node.config.enabled ? accentColor : undefined }}
                    onContextMenu={(e) => { e.preventDefault(); onPropertyContextMenu?.(node.id, 'enabled', e.clientX, e.clientY); }}
                    {...enabledLongPress}
                  >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${node.config.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
              </div>
          );
      case NodeType.CLONE:
          return <div className="h-8 flex items-center justify-center gap-2 opacity-50"><Copy size={iconSizes.sm} /><span className="text-xs font-mono">Linked Instance</span></div>;
      case NodeType.DEBUG:
          return <DebugContent nodeId={node.id} config={node.config} />;
      default: return <div className="h-8 flex items-center justify-center text-xs opacity-30 font-mono uppercase">{node.type}</div>;
  }
};

