import React from 'react';
import { Plus, Undo, Redo, Grid3X3, Grid, Sun, Moon } from 'lucide-react';
import { GridType } from '../../types';

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
  return (
    <div className={`fixed top-0 left-0 right-0 h-14 border-b flex items-center justify-between px-4 z-50 backdrop-blur-md ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/80 border-neutral-200'}`} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-red animate-pulse" /><span className="font-bold tracking-tight">ANINODE</span><span className="text-xs font-mono opacity-50 border px-1 rounded">SYS.0.2</span></div>
            <div className={`h-6 w-px ${isDarkMode ? 'bg-white/10' : 'bg-neutral-300'}`} />
            <button onClick={() => { setIsNodePickerOpen(true); setPickerCounts({}); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-neutral-100'}`}><Plus size={14} /> Add Node</button>
            <div className={`h-6 w-px ${isDarkMode ? 'bg-white/10' : 'bg-neutral-300'}`} />
            <div className="flex items-center gap-1">
                <button onClick={handleUndo} className={`p-1.5 rounded hover:bg-white/10 ${historyIndex === 0 ? 'opacity-30' : ''}`}><Undo size={14}/></button>
                <button onClick={handleRedo} className={`p-1.5 rounded hover:bg-white/10 ${historyIndex === historyLength - 1 ? 'opacity-30' : ''}`}><Redo size={14}/></button>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'border-white/10 bg-black/50' : 'border-neutral-200 bg-neutral-50'}`}>
                 <button onClick={() => setGridType('DOTS')} className={`p-1.5 rounded ${gridType === 'DOTS' ? (isDarkMode ? 'bg-white/20' : 'bg-white shadow') : ''}`}><Grid3X3 size={14}/></button>
                 <button onClick={() => setGridType('LINES')} className={`p-1.5 rounded ${gridType === 'LINES' ? (isDarkMode ? 'bg-white/20' : 'bg-white shadow') : ''}`}><Grid size={14}/></button>
                 <button onClick={() => setGridType('CROSS')} className={`p-1.5 rounded ${gridType === 'CROSS' ? (isDarkMode ? 'bg-white/20' : 'bg-white shadow') : ''}`}><Plus size={14}/></button>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'border-white/10 hover:bg-white/10' : 'border-neutral-200 hover:bg-neutral-100'}`}>{isDarkMode ? <Moon size={16} /> : <Sun size={16} />}</button>
        </div>
    </div>
  );
};
