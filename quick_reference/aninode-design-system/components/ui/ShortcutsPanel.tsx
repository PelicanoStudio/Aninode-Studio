import React, { useState } from 'react';
import { Command, MousePointer2, Move, Maximize, Scan, Copy, Undo, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  getSurface, 
  getBorder,
  zIndex,
  panelLayout,
  iconSizes,
  shortcuts,
  formatShortcut
} from '../../src/tokens';

interface ShortcutsPanelProps {
  isDarkMode: boolean;
}

// Define which shortcuts to show in the panel
const displayShortcuts = [
  { key: 'nodePicker', icon: Command },
  { key: 'multiSelect', icon: MousePointer2 },
  { key: 'panCanvas', icon: Move },
  { key: 'focusAll', icon: Maximize },
  { key: 'focusSelected', icon: Scan },
  { key: 'copy', icon: Copy },
  { key: 'undo', icon: Undo },
] as const;

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const panelBg = getSurface('overlay', isDarkMode);
  const borderColor = getBorder('default', isDarkMode);
  const textColor = isDarkMode ? 'text-neutral-400' : 'text-neutral-600';

  return (
    <div 
      className={`fixed rounded-xl border backdrop-blur-sm transition-all duration-300 ${textColor}`}
      style={{ 
        bottom: panelLayout.shortcutsOffset,
        left: panelLayout.shortcutsOffset,
        backgroundColor: panelBg,
        borderColor: borderColor,
        zIndex: zIndex.shortcuts
      }}
    >
        <div 
            className="flex items-center justify-between p-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <span className="text-[10px] font-bold font-mono uppercase ml-2">Shortcuts</span>
            {isExpanded ? <ChevronDown size={iconSizes.sm} /> : <ChevronUp size={iconSizes.sm} />}
        </div>
        
        {isExpanded && (
            <div className="p-4 pt-0 text-[10px] font-mono space-y-1 pointer-events-none">
                {displayShortcuts.map(({ key, icon: Icon }) => {
                  const shortcut = shortcuts[key as keyof typeof shortcuts];
                  if (!shortcut) return null;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Icon size={iconSizes.xs} />
                      <span>{formatShortcut(shortcut)} : {shortcut.description}</span>
                    </div>
                  );
                })}
            </div>
        )}
    </div>
  );
};

