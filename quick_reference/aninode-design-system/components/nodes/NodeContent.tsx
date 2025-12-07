import React from 'react';
import { NodeData, NodeType } from '../../types';
import { Visualizer } from './Visualizer';
import { Copy } from 'lucide-react';
import { useLongPress } from '../../hooks/useLongPress';

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
  const handleLongPress = (propKey: string) => {
      return useLongPress((e) => {
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
          onPropertyContextMenu?.(node.id, propKey, clientX, clientY);
      });
  };

  const valueLongPress = handleLongPress('value');
  const enabledLongPress = handleLongPress('enabled');

  switch(node.type) {
      case NodeType.OSCILLATOR:
          return <Visualizer type="sine" frequency={node.config.frequency || 1} amplitude={node.config.amplitude || 1} active={true} isDarkMode={isDarkMode} />;
      case NodeType.PICKER:
          return (
              <div className="w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden relative group">
                   {node.config.src ? <img src={node.config.src} alt="Asset" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-700">No Asset</div>}
              </div>
          );
      case NodeType.SLIDER:
          return (
              <div className="pt-2" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  <div className="flex justify-between text-xs font-mono mb-1 opacity-70">
                      <span>{node.config.min || 0}</span><span className="text-accent-red font-bold">{node.config.value}</span><span>{node.config.max || 100}</span>
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
                    className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-accent-red" 
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
                    className={`w-full bg-transparent border-b ${isDarkMode ? 'border-white/20 text-white' : 'border-black/20 text-black'} font-mono text-lg focus:outline-none focus:border-accent-red transition-colors`} 
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
                    className={`w-10 h-5 rounded-full relative transition-colors ${node.config.enabled ? 'bg-accent-red' : (isDarkMode ? 'bg-neutral-700' : 'bg-neutral-300')}`}
                    onContextMenu={(e) => { e.preventDefault(); onPropertyContextMenu?.(node.id, 'enabled', e.clientX, e.clientY); }}
                    {...enabledLongPress}
                  >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${node.config.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
              </div>
          );
      case NodeType.CLONE:
          return <div className="h-8 flex items-center justify-center gap-2 opacity-50"><Copy size={12} /><span className="text-xs font-mono">Linked Instance</span></div>;
      default: return <div className="h-8 flex items-center justify-center text-xs opacity-30 font-mono uppercase">{node.type}</div>;
  }
};
