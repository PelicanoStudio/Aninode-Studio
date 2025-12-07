import React, { useState } from 'react';
import { Command, MousePointer2, Move, Maximize, Scan, Copy, Undo, ChevronDown, ChevronUp } from 'lucide-react';

interface ShortcutsPanelProps {
  isDarkMode: boolean;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`fixed bottom-4 left-4 rounded-xl border backdrop-blur-sm z-40 transition-all duration-300 ${isDarkMode ? 'bg-black/50 border-white/10 text-neutral-400' : 'bg-white/50 border-neutral-200 text-neutral-600'}`}>
        <div 
            className="flex items-center justify-between p-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <span className="text-[10px] font-bold font-mono uppercase ml-2">Shortcuts</span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
        
        {isExpanded && (
            <div className="p-4 pt-0 text-[10px] font-mono space-y-1 pointer-events-none">
                <div className="flex items-center gap-2"><Command size={10} /> <span>SHIFT + TAB : Node Picker</span></div>
                <div className="flex items-center gap-2"><MousePointer2 size={10} /> <span>SHIFT + CLICK : Multi Select</span></div>
                <div className="flex items-center gap-2"><Move size={10} /> <span>DRAG BG : Pan Canvas</span></div>
                <div className="flex items-center gap-2"><Maximize size={10} /> <span>SHIFT + F : Focus All</span></div>
                <div className="flex items-center gap-2"><Scan size={10} /> <span>F : Focus Selected</span></div>
                <div className="flex items-center gap-2"><Copy size={10} /> <span>CTRL + C/V : Copy/Paste</span></div>
                <div className="flex items-center gap-2"><Undo size={10} /> <span>CTRL + Z/Y : Undo/Redo</span></div>
            </div>
        )}
    </div>
  );
};
