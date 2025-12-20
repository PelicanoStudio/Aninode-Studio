/**
 * @aninode/ui - Color Tokens
 * OLED Aesthetic Color System with Dark/Light Mode Support
 * 
 * These tokens are designed for future customization by users.
 * Colors can be driven by Valtio state and used in ReactFlow/R3F.
 */

// =============================================================================
// PRIMARY ACCENT COLORS (Neon Palette for Node Chains)
// =============================================================================
export const neonPalette = [
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FF3333', // Red
  '#FFA500', // Orange
  '#8A2BE2', // Violet
] as const;

// Signal Active Color (Wire glow, node accent)
export const signalActive = '#FF1F1F';

// =============================================================================
// SURFACE COLORS (Backgrounds, Cards, Modals)
// =============================================================================
export const surface = {
  // Node backgrounds
  node: {
    dark: 'rgba(0,0,0,0.9)',
    light: 'rgba(255,255,255,0.95)',
  },
  // Panel backgrounds (SidePanel, Header)
  panel: {
    dark: 'rgba(0,0,0,0.8)',
    light: 'rgba(255,255,255,0.8)',
  },
  // Canvas/Viewport background
  canvas: {
    dark: '#000000',
    light: '#F5F5F5',
  },
  // Menu backgrounds
  menu: {
    dark: '#000000',
    light: '#FFFFFF',
  },
  // Overlay for dialogs
  overlay: {
    dark: 'rgba(0,0,0,0.5)',
    light: 'rgba(255,255,255,0.5)',
  },
} as const;

// =============================================================================
// BORDER COLORS
// =============================================================================
export const border = {
  // Default inactive borders
  default: {
    dark: 'rgba(255,255,255,0.1)',
    light: 'rgba(0,0,0,0.1)',
  },
  // Divider lines
  divider: {
    dark: 'rgba(255,255,255,0.05)',
    light: 'rgba(0,0,0,0.1)',
  },
  // Menu/panel borders
  menuBorder: {
    dark: 'rgba(255,255,255,0.1)',
    light: 'rgba(0,0,0,0.1)',
  },
} as const;

// =============================================================================
// PORT COLORS
// =============================================================================
export const port = {
  // Inactive port outer ring
  inactive: {
    dark: '#555555',
    light: '#CCCCCC',
  },
  // Inactive port inner dot
  innerInactive: {
    dark: '#333333',
    light: '#CCCCCC',
  },
} as const;

// =============================================================================
// WIRE/CONNECTION COLORS
// =============================================================================
export const wire = {
  // Default wire color
  default: {
    dark: '#666666',
    light: '#999999',
  },
  // Temporary wire (while dragging)
  temp: {
    dark: '#666666',
    light: '#999999',
  },
  // Double wire inner stroke
  doubleInner: {
    dark: '#000000',
    light: '#F5F5F5',
  },
} as const;

// =============================================================================
// GRID COLORS (Canvas Background)
// =============================================================================
export const grid = {
  dark: '#ffffffff',
  light: '#333333',
} as const;

// =============================================================================
// TEXT COLORS
// =============================================================================
export const text = {
  primary: {
    dark: '#FFFFFF',
    light: '#171717', // neutral-900
  },
  secondary: {
    dark: '#A3A3A3', // neutral-400
    light: '#737373', // neutral-500
  },
  muted: {
    dark: '#525252', // neutral-600
    light: '#A3A3A3', // neutral-400
  },
  accent: '#FF1F1F',
} as const;

// =============================================================================
// STATE COLORS (Feedback & Interaction)
// =============================================================================
export const state = {
  success: '#22C55E', // green-500
  warning: '#F59E0B', // amber-500
  error: '#EF4444',   // red-500
  info: '#3B82F6',    // blue-500
} as const;

// =============================================================================
// GLOW/SHADOW COLORS
// =============================================================================
export const glow = {
  // Selected node glow (uses accent color with alpha)
  selectedAlpha: '30',  // 30% opacity suffix for hex
  activeChainAlpha: '10', // 10% opacity suffix for hex
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get color based on dark mode state */
export const getColor = <T extends { dark: string; light: string }>(
  colorObj: T,
  isDarkMode: boolean
): string => isDarkMode ? colorObj.dark : colorObj.light;

/** Get surface color for node/panel backgrounds */
export const getSurface = (type: keyof typeof surface, isDarkMode: boolean): string =>
  isDarkMode ? surface[type].dark : surface[type].light;

/** Get border color */
export const getBorder = (type: keyof typeof border, isDarkMode: boolean): string =>
  isDarkMode ? border[type].dark : border[type].light;

/** Get port color */
export const getPort = (type: keyof typeof port, isDarkMode: boolean): string =>
  isDarkMode ? port[type].dark : port[type].light;

/** Get wire color */
export const getWire = (type: keyof typeof wire, isDarkMode: boolean): string =>
  isDarkMode ? wire[type].dark : wire[type].light;

/** Get grid color */
export const getGrid = (isDarkMode: boolean): string =>
  isDarkMode ? grid.dark : grid.light;

/** Get text color */
export const getText = (type: keyof typeof text, isDarkMode: boolean): string => {
  const color = text[type];
  if (typeof color === 'string') return color;
  return isDarkMode ? color.dark : color.light;
};
