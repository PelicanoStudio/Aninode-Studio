import React from 'react';
import { Plus, Undo, Redo, Grid3X3, Grid, Sun, Moon } from 'lucide-react';
import { GridType } from '../../types';
import { 
  signalActive, 
  getSurface,
  getBorder,
  panelLayout,
  zIndex,
  iconSizes 
} from '../../src/tokens';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  gridType: GridType;
  setGridType: (type: GridType) => void;
  historyIndex: number;
  historyLength: number;
  handleUndo: () => void;
  handleRedo: () => void;
  setIsNodePickerOpen: (isOpen: boolean) => void;
  setPickerCounts: (counts: Record<string, number>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  setIsDarkMode,
  gridType,
  setGridType,
  historyIndex,
  historyLength,
  handleUndo,
  handleRedo,
  setIsNodePickerOpen,
  setPickerCounts
}) => {
  // Token-based styling
  const headerBg = getSurface('panel', isDarkMode);
  const borderColor = getBorder('default', isDarkMode);
  const dividerClass = isDarkMode ? 'bg-white/10' : 'bg-neutral-300';
  const hoverClass = isDarkMode ? 'hover:bg-white/10' : 'hover:bg-neutral-100';
  const activeClass = isDarkMode ? 'bg-white/20' : 'bg-white shadow';

  return (
    <div 
      className="fixed top-0 left-0 right-0 border-b flex items-center justify-between px-4 backdrop-blur-md"
      style={{ 
        height: panelLayout.headerHeight,
        backgroundColor: headerBg,
        borderColor: borderColor,
        zIndex: zIndex.header
      }}
      onMouseDown={e => e.stopPropagation()}
    >
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full animate-pulse" 
                style={{ backgroundColor: signalActive }}
              />
              <span className="font-bold tracking-tight">ANINODE</span>
              <span className="text-xs font-mono opacity-50 border px-1 rounded">SYS.0.2</span>
            </div>
            <div className={`h-6 w-px ${dividerClass}`} />
            <button 
              onClick={() => { setIsNodePickerOpen(true); setPickerCounts({}); }} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${hoverClass}`}
            >
              <Plus size={iconSizes.sm} /> Add Node
            </button>
            <div className={`h-6 w-px ${dividerClass}`} />
            <div className="flex items-center gap-1">
                <button 
                  onClick={handleUndo} 
                  className={`p-1.5 rounded ${hoverClass} ${historyIndex === 0 ? 'opacity-30' : ''}`}
                >
                  <Undo size={iconSizes.sm}/>
                </button>
                <button 
                  onClick={handleRedo} 
                  className={`p-1.5 rounded ${hoverClass} ${historyIndex === historyLength - 1 ? 'opacity-30' : ''}`}
                >
                  <Redo size={iconSizes.sm}/>
                </button>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div 
              className="flex items-center p-1 rounded-lg border"
              style={{ 
                borderColor: borderColor,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(250,250,250,1)'
              }}
            >
                 <button 
                   onClick={() => setGridType('DOTS')} 
                   className={`p-1.5 rounded ${gridType === 'DOTS' ? activeClass : ''}`}
                 >
                   <Grid3X3 size={iconSizes.sm}/>
                 </button>
                 <button 
                   onClick={() => setGridType('LINES')} 
                   className={`p-1.5 rounded ${gridType === 'LINES' ? activeClass : ''}`}
                 >
                   <Grid size={iconSizes.sm}/>
                 </button>
                 <button 
                   onClick={() => setGridType('CROSS')} 
                   className={`p-1.5 rounded ${gridType === 'CROSS' ? activeClass : ''}`}
                 >
                   <Plus size={iconSizes.sm}/>
                 </button>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2 rounded-lg border transition-colors ${hoverClass}`}
              style={{ borderColor: borderColor }}
            >
              {isDarkMode ? <Moon size={iconSizes.md} /> : <Sun size={iconSizes.md} />}
            </button>
        </div>
    </div>
  );
};

