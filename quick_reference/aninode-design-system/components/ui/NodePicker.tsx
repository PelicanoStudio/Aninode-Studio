import React from 'react';
import { X, Box } from 'lucide-react';
import { NodeType } from '../../types';
import { getTypeLabel } from '../nodes/BaseNode';

interface NodePickerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  pickerCounts: Record<string, number>;
  setPickerCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onAdd: () => void;
  onSingleAdd: (type: NodeType) => void;
}

export const NodePicker: React.FC<NodePickerProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  pickerCounts,
  setPickerCounts,
  onAdd,
  onSingleAdd
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onMouseDown={e => e.stopPropagation()}>
        <div className={`w-[600px] h-[400px] rounded-2xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-neutral-200'}`}>
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Add Nodes</h2>
                <div className="flex gap-2">
                  {Object.keys(pickerCounts).length > 0 && <button onClick={onAdd} className="bg-accent-red text-white px-4 py-2 rounded text-xs font-bold">ADD SELECTED</button>}
                  <button onClick={onClose}><X /></button>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6 overflow-y-auto">
                {Object.values(NodeType).map(type => (
                    <div key={type} className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all relative ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-neutral-200 hover:bg-neutral-50'}`} onClick={(e) => { 
                        if (e.shiftKey) { 
                            setPickerCounts(p => ({ ...p, [type]: (p[type] || 0) + 1 })); 
                        } else { 
                            onSingleAdd(type); 
                            onClose(); 
                        } 
                    }}>
                        <Box size={24} className="mb-2 opacity-50" /><span className="text-xs font-mono font-bold">{getTypeLabel(type)}</span>
                        {pickerCounts[type] > 0 && <div className="absolute top-2 right-2 bg-accent-red text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{pickerCounts[type]}</div>}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
