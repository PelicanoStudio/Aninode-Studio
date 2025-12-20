/**
 * @aninode/ui - Keyboard Shortcuts Configuration
 * Centralized shortcut definitions for consistent behavior
 * 
 * All shortcuts are extracted from App.tsx and ShortcutsPanel.tsx
 */

// =============================================================================
// SHORTCUT TYPE DEFINITIONS
// =============================================================================
export interface Shortcut {
  /** Primary key (lowercase) */
  key: string;
  /** Modifier keys required */
  modifiers: ('Ctrl' | 'Shift' | 'Alt' | 'Meta')[];
  /** Human-readable description */
  description: string;
  /** Category for grouping in UI */
  category: 'navigation' | 'selection' | 'editing' | 'canvas' | 'node';
}

// =============================================================================
// NAVIGATION & CANVAS SHORTCUTS
// =============================================================================
export const canvasShortcuts: Record<string, Shortcut> = {
  focusAll: {
    key: 'f',
    modifiers: ['Shift'],
    description: 'Focus All Nodes',
    category: 'navigation',
  },
  focusSelected: {
    key: 'f',
    modifiers: [],
    description: 'Focus Selected Nodes',
    category: 'navigation',
  },
  panCanvas: {
    key: 'drag',
    modifiers: [],
    description: 'Pan Canvas (Drag Background)',
    category: 'canvas',
  },
  zoomToFit: {
    key: '0',
    modifiers: ['Ctrl'],
    description: 'Zoom to Fit',
    category: 'canvas',
  },
} as const;

// =============================================================================
// SELECTION SHORTCUTS
// =============================================================================
export const selectionShortcuts: Record<string, Shortcut> = {
  multiSelect: {
    key: 'click',
    modifiers: ['Shift'],
    description: 'Add/Remove from Selection',
    category: 'selection',
  },
  selectAll: {
    key: 'a',
    modifiers: ['Ctrl'],
    description: 'Select All Nodes',
    category: 'selection',
  },
  deselectAll: {
    key: 'Escape',
    modifiers: [],
    description: 'Deselect All / Cancel',
    category: 'selection',
  },
} as const;

// =============================================================================
// EDITING SHORTCUTS
// =============================================================================
export const editingShortcuts: Record<string, Shortcut> = {
  undo: {
    key: 'z',
    modifiers: ['Ctrl'],
    description: 'Undo',
    category: 'editing',
  },
  redo: {
    key: 'y',
    modifiers: ['Ctrl'],
    description: 'Redo',
    category: 'editing',
  },
  copy: {
    key: 'c',
    modifiers: ['Ctrl'],
    description: 'Copy Selected Nodes',
    category: 'editing',
  },
  paste: {
    key: 'v',
    modifiers: ['Ctrl'],
    description: 'Paste Nodes (with connections if selected together)',
    category: 'editing',
  },
  delete: {
    key: 'Delete',
    modifiers: [],
    description: 'Delete Selected Nodes',
    category: 'editing',
  },
  deleteAlt: {
    key: 'Backspace',
    modifiers: [],
    description: 'Delete Selected Nodes (Alternative)',
    category: 'editing',
  },
} as const;

// =============================================================================
// NODE INTERACTION SHORTCUTS
// =============================================================================
export const nodeShortcuts: Record<string, Shortcut> = {
  nodePicker: {
    key: 'Tab',
    modifiers: ['Shift'],
    description: 'Open Node Picker (Shift+Click for multi-select, counter accumulates)',
    category: 'node',
  },
  duplicateDrag: {
    key: 'drag',
    modifiers: ['Alt'],
    description: 'Duplicate Node(s) with Input Connections',
    category: 'node',
  },
  cloneFromPort: {
    key: 'drag',
    modifiers: ['Ctrl', 'Alt'],
    description: 'Clone Node from Output Port',
    category: 'node',
  },
  hotWire: {
    key: 'drag',
    modifiers: ['Shift'],
    description: 'Hot Wire Mode (Click destination to connect)',
    category: 'node',
  },
  portQuickConnect: {
    key: 'doubleClick',
    modifiers: [],
    description: 'Double-click Port: Show compatible nodes to connect',
    category: 'node',
  },
  portDisconnect: {
    key: 'rightClick',
    modifiers: [],
    description: 'Right-click Port: Disconnect menu',
    category: 'node',
  },
  wireDelete: {
    key: 'click',
    modifiers: ['Alt'],
    description: 'Alt+Click Wire: Delete connection',
    category: 'node',
  },
} as const;

// =============================================================================
// ALL SHORTCUTS COMBINED
// =============================================================================
export const shortcuts = {
  ...canvasShortcuts,
  ...selectionShortcuts,
  ...editingShortcuts,
  ...nodeShortcuts,
} as const;

// =============================================================================
// SHORTCUT DISPLAY HELPERS
// =============================================================================

/** Format shortcut for display in UI */
export function formatShortcut(shortcut: Shortcut): string {
  const modifiers = shortcut.modifiers.map(m => {
    switch (m) {
      case 'Ctrl': return '⌘';  // or Ctrl on Windows
      case 'Shift': return '⇧';
      case 'Alt': return '⌥';
      case 'Meta': return '⌘';
      default: return m;
    }
  });
  
  const key = shortcut.key === 'drag' ? 'DRAG' 
    : shortcut.key === 'click' ? 'CLICK'
    : shortcut.key === 'doubleClick' ? 'DBL-CLICK'
    : shortcut.key === 'rightClick' ? 'RIGHT-CLICK'
    : shortcut.key.toUpperCase();
  
  return [...modifiers, key].join(' + ');
}

/** Get shortcuts by category */
export function getShortcutsByCategory(category: Shortcut['category']): Shortcut[] {
  return Object.values(shortcuts).filter(s => s.category === category);
}

// =============================================================================
// PROPERTY TELEPORTATION LOGIC
// =============================================================================
/**
 * Value conversion logic for telepathic connections
 * When teleporting data between incompatible types
 */
export const valueConversion = {
  /** Boolean → Percentage: true=100%, false=0% */
  booleanToPercentage: (value: boolean): number => value ? 100 : 0,
  
  /** Boolean → Numeric: true=1, false=0 */
  booleanToNumber: (value: boolean): number => value ? 1 : 0,
  
  /** Decimal (0-1) → Percentage: multiply by 100 */
  decimalToPercentage: (value: number): number => value * 100,
  
  /** Percentage → Decimal: divide by 100 */
  percentageToDecimal: (value: number): number => value / 100,
  
  /** Numeric → Boolean: 0=false, any other=true */
  numberToBoolean: (value: number): boolean => value !== 0,
} as const;
