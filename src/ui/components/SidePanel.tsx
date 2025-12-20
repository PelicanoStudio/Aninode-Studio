
import {
  getBorder,
  getSurface,
  iconSizes,
  panelLayout,
  signalActive,
  zIndex
} from '@/tokens';
import { NodeData, NodeType } from '@/ui/types';
import { Link as LinkIcon, Sliders, X } from 'lucide-react';
import React from 'react';
import { Input } from './ui/Input';

interface SidePanelProps {
  selectedNode: NodeData | null;
  onClose: () => void;
  onUpdate: (id: string, newData: Partial<NodeData>) => void;
  onBindProp: (nodeId: string, propKey: string, action: 'SEND' | 'RECEIVE' | 'UNBIND') => void;
  isDarkMode: boolean; 
  boundProps: Record<string, any>;
  onContextMenu: (menu: { x: number, y: number, propKey: string, nodeId: string } | null) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ selectedNode, onClose, onUpdate, onBindProp: _onBindProp, isDarkMode, boundProps, onContextMenu }) => {

  if (!selectedNode) return null;

  const handleChange = (key: string, value: any) => {
    onUpdate(selectedNode.id, {
        config: {
            ...selectedNode.config,
            [key]: value
        }
    });
  };

  const handleContextMenu = (e: React.MouseEvent, propKey: string) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu({ x: e.clientX, y: e.clientY, propKey, nodeId: selectedNode.id });
  };

  // Token-based styling
  const panelBg = getSurface('panel', isDarkMode);
  const borderColor = getBorder('default', isDarkMode);
  const dividerColor = getBorder('divider', isDarkMode);
  const textClass = isDarkMode ? "text-white" : "text-neutral-900";
  const accentColor = signalActive;

  const renderLabel = (label: string, propKey: string) => (
      <div className="flex justify-between items-center mb-1 pointer-events-none">
          <label className="text-xs text-neutral-500 font-mono uppercase tracking-wider">{label}</label>
          {boundProps[propKey] && (
              <div style={{ color: accentColor }} className="flex items-center gap-1" title="Property Bound">
                  <LinkIcon size={iconSizes.xs} />
              </div>
          )}
      </div>
  );

  return (
    <div 
        className="fixed right-4 top-4 bottom-4 backdrop-blur-xl border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
        style={{
          width: panelLayout.sidePanelWidth,
          backgroundColor: panelBg,
          borderColor: borderColor,
          zIndex: zIndex.sidePanel
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onContextMenu(null); }}
        onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 border-b"
        style={{ borderColor: dividerColor }}
      >
        <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded border flex items-center justify-center"
              style={{ 
                backgroundColor: isDarkMode ? '#000' : '#fff',
                borderColor: borderColor,
                color: accentColor 
              }}
            >
                <Sliders size={iconSizes.md} />
            </div>
            <div>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${textClass}`}>{selectedNode.label}</h2>
                <p className="text-xs text-neutral-500 font-mono opacity-50">ID: {selectedNode.id.slice(-6)}</p>
            </div>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-opacity-80 transition-colors">
          <X size={iconSizes.lg} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        <Input 
            label="Node Label" 
            value={selectedNode.label} 
            onChange={(e) => onUpdate(selectedNode.id, { label: e.target.value })} 
        />

        <div 
          className="h-px my-6"
          style={{ backgroundColor: dividerColor }}
        />

        {/* Dynamic Props based on Node Type */}
        <div className="space-y-4">
            
            {/* OSCILLATOR (LFO) */}
            {selectedNode.type === NodeType.OSCILLATOR && (
                <>
                    <div onContextMenu={(e) => handleContextMenu(e, 'waveform')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                        {renderLabel('Waveform', 'waveform')}
                        <select 
                            value={selectedNode.config.waveform || 'sine'} 
                            onChange={(e) => handleChange('waveform', e.target.value)}
                            className={`w-full px-3 py-2 rounded border text-sm font-mono ${isDarkMode ? 'bg-black border-neutral-800 text-white' : 'bg-white border-neutral-200 text-black'}`}
                        >
                            <option value="sine">Sine (Smooth)</option>
                            <option value="triangle">Triangle</option>
                            <option value="square">Square (On/Off)</option>
                            <option value="sawtooth">Sawtooth</option>
                            <option value="noise">Noise (Random)</option>
                        </select>
                    </div>
                    <div onContextMenu={(e) => handleContextMenu(e, 'frequency')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                        {renderLabel('Frequency (Hz)', 'frequency')}
                        <Input type="number" step="0.1" min="0.01" value={selectedNode.config.frequency || 1} onChange={(e) => handleChange('frequency', parseFloat(e.target.value))} />
                    </div>
                    <div onContextMenu={(e) => handleContextMenu(e, 'amplitude')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                        {renderLabel('Amplitude', 'amplitude')}
                        <Input type="number" step="0.1" min="0" max="2" value={selectedNode.config.amplitude || 1} onChange={(e) => handleChange('amplitude', parseFloat(e.target.value))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div onContextMenu={(e) => handleContextMenu(e, 'min')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                            {renderLabel('Min Value', 'min')}
                            <Input type="number" step="0.1" value={selectedNode.config.min ?? 0} onChange={(e) => handleChange('min', parseFloat(e.target.value))} />
                        </div>
                        <div onContextMenu={(e) => handleContextMenu(e, 'max')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                            {renderLabel('Max Value', 'max')}
                            <Input type="number" step="0.1" value={selectedNode.config.max ?? 1} onChange={(e) => handleChange('max', parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div onContextMenu={(e) => handleContextMenu(e, 'phase')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                        {renderLabel('Phase Offset', 'phase')}
                        <Input type="number" step="0.1" value={selectedNode.config.phase || 0} onChange={(e) => handleChange('phase', parseFloat(e.target.value))} />
                    </div>
                </>
            )}

            {/* TRANSFORM */}
            {selectedNode.type === NodeType.TRANSFORM && (
                 <>
                    <div onContextMenu={(e) => handleContextMenu(e, 'scale')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                         {renderLabel('Scale (%)', 'scale')}
                        <Input type="number" step="1" min="0" max="500" value={selectedNode.config.scale ?? 100} onChange={(e) => handleChange('scale', parseInt(e.target.value))} />
                        <input 
                          type="range" 
                          min="0" max="200" 
                          value={selectedNode.config.scale ?? 100} 
                          onChange={(e) => handleChange('scale', parseInt(e.target.value))}
                          className="w-full mt-2 accent-red-500" 
                        />
                    </div>
                    <div onContextMenu={(e) => handleContextMenu(e, 'rotation')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                         {renderLabel('Rotation (°)', 'rotation')}
                        <Input type="number" step="1" min="-360" max="360" value={selectedNode.config.rotation ?? 0} onChange={(e) => handleChange('rotation', parseInt(e.target.value))} />
                        <input 
                          type="range" 
                          min="-180" max="180" 
                          value={selectedNode.config.rotation ?? 0} 
                          onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
                          className="w-full mt-2 accent-red-500" 
                        />
                    </div>
                    <div onContextMenu={(e) => handleContextMenu(e, 'opacity')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                         {renderLabel('Opacity (%)', 'opacity')}
                        <Input type="number" step="1" min="0" max="100" value={selectedNode.config.opacity ?? 100} onChange={(e) => handleChange('opacity', parseInt(e.target.value))} />
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={selectedNode.config.opacity ?? 100} 
                          onChange={(e) => handleChange('opacity', parseInt(e.target.value))}
                          className="w-full mt-2 accent-red-500" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div onContextMenu={(e) => handleContextMenu(e, 'offsetX')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                            {renderLabel('Offset X', 'offsetX')}
                            <Input type="number" step="1" value={selectedNode.config.offsetX ?? 0} onChange={(e) => handleChange('offsetX', parseInt(e.target.value))} />
                        </div>
                        <div onContextMenu={(e) => handleContextMenu(e, 'offsetY')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                            {renderLabel('Offset Y', 'offsetY')}
                            <Input type="number" step="1" value={selectedNode.config.offsetY ?? 0} onChange={(e) => handleChange('offsetY', parseInt(e.target.value))} />
                        </div>
                    </div>
                 </>
            )}

            {/* PICKER */}
            {selectedNode.type === NodeType.PICKER && (
                <div onContextMenu={(e) => handleContextMenu(e, 'src')} className="p-2 hover:bg-white/5 rounded cursor-context-menu relative group transition-colors">
                    {renderLabel('Image Source URL', 'src')}
                    <Input 
                        value={selectedNode.config.src || ''}
                        onChange={(e) => handleChange('src', e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            )}

            {/* SLIDER */}
            {selectedNode.type === NodeType.SLIDER && (
                <>
                    <div onContextMenu={(e) => handleContextMenu(e, 'value')} className="p-2 hover:bg-white/5 rounded cursor-context-menu transition-colors">
                        {renderLabel('Current Value', 'value')}
                        <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min={selectedNode.config.min || 0} 
                              max={selectedNode.config.max || 100}
                              step={selectedNode.config.step || 1}
                              value={selectedNode.config.value ?? 50} 
                              onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                              className="flex-1 accent-red-500" 
                            />
                            <span className="text-sm font-mono w-12 text-right" style={{ color: accentColor }}>
                                {selectedNode.config.value ?? 50}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div onContextMenu={(e) => handleContextMenu(e, 'min')} className="hover:bg-white/5 rounded p-2 cursor-context-menu transition-colors">
                             {renderLabel('Min', 'min')}
                             <Input type="number" value={selectedNode.config.min ?? 0} onChange={(e) => handleChange('min', parseFloat(e.target.value))} />
                        </div>
                        <div onContextMenu={(e) => handleContextMenu(e, 'max')} className="hover:bg-white/5 rounded p-2 cursor-context-menu transition-colors">
                             {renderLabel('Max', 'max')}
                             <Input type="number" value={selectedNode.config.max ?? 100} onChange={(e) => handleChange('max', parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div onContextMenu={(e) => handleContextMenu(e, 'step')} className="hover:bg-white/5 rounded p-2 cursor-context-menu transition-colors">
                         {renderLabel('Step', 'step')}
                         <Input type="number" value={selectedNode.config.step || 1} onChange={(e) => handleChange('step', parseFloat(e.target.value))} />
                    </div>
                </>
            )}

            {/* NUMBER */}
            {selectedNode.type === NodeType.NUMBER && (
                 <div onContextMenu={(e) => handleContextMenu(e, 'value')} className="p-2 hover:bg-white/5 rounded cursor-context-menu relative group transition-colors">
                     {renderLabel('Current Value', 'value')}
                     <Input type="number" value={selectedNode.config.value || 0} onChange={(e) => handleChange('value', parseFloat(e.target.value))} />
                 </div>
            )}

            {/* BOOLEAN */}
            {selectedNode.type === NodeType.BOOLEAN && (
                 <div onContextMenu={(e) => handleContextMenu(e, 'enabled')} className="p-2 hover:bg-white/5 rounded cursor-context-menu relative group transition-colors">
                     {renderLabel('Initial State', 'enabled')}
                     <div className="flex items-center gap-2 mt-2">
                        <span 
                          className="text-xs font-mono"
                          style={{ color: !selectedNode.config.enabled ? accentColor : undefined, opacity: selectedNode.config.enabled ? 0.5 : 1 }}
                        >
                          OFF
                        </span>
                        <button 
                            onClick={() => handleChange('enabled', !selectedNode.config.enabled)}
                            className="w-12 h-6 rounded-full relative transition-colors"
                            style={{ backgroundColor: selectedNode.config.enabled ? accentColor : (isDarkMode ? '#404040' : '#d4d4d4') }}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${selectedNode.config.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                        <span 
                          className="text-xs font-mono"
                          style={{ color: selectedNode.config.enabled ? accentColor : undefined, opacity: !selectedNode.config.enabled ? 0.5 : 1 }}
                        >
                          ON
                        </span>
                     </div>
                 </div>
            )}
            
            {/* CLONE */}
            {selectedNode.type === NodeType.CLONE && (
                <div className="p-3 rounded bg-white/5 border border-white/10">
                    <p className="text-xs text-neutral-500 mb-2">CLONE INSTANCE</p>
                    <p className="text-sm">Linked to parent source.</p>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
