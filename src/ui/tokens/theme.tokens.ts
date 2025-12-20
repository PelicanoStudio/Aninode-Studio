/**
 * @aninode/ui - Master Theme Token
 * Single Source of Truth for the Aninode Design System
 * 
 * This file re-exports all tokens and provides the main theme object
 * that bridges UI tokens with Valtio state and GSAP animations.
 */

import * as colors from './colors';
import * as layout from './layout';
import * as animation from './animation';
import * as shortcuts from './shortcuts';

// =============================================================================
// MASTER THEME OBJECT
// =============================================================================
export const theme = {
  colors,
  layout,
  animation,
  shortcuts: shortcuts.shortcuts,
} as const;

// =============================================================================
// TYPED THEME EXPORTS
// =============================================================================
export type Theme = typeof theme;

// Re-export individual modules
export { colors, layout, animation, shortcuts };

// Re-export commonly used helpers
export { 
  getColor, 
  getSurface, 
  getBorder, 
  getPort, 
  getWire, 
  getGrid, 
  getText 
} from './colors';

export { formatShortcut, getShortcutsByCategory, valueConversion } from './shortcuts';

// =============================================================================
// CONVENIENCE ACCESSORS
// =============================================================================

/** Get all colors for current theme mode */
export const getThemeColors = (isDarkMode: boolean) => ({
  signal: {
    active: colors.signalActive,
  },
  surface: {
    node: colors.getSurface('node', isDarkMode),
    panel: colors.getSurface('panel', isDarkMode),
    canvas: colors.getSurface('canvas', isDarkMode),
    menu: colors.getSurface('menu', isDarkMode),
    overlay: colors.getSurface('overlay', isDarkMode),
  },
  border: {
    default: colors.getBorder('default', isDarkMode),
    divider: colors.getBorder('divider', isDarkMode),
    menu: colors.getBorder('menuBorder', isDarkMode),
  },
  port: {
    inactive: colors.getPort('inactive', isDarkMode),
    innerInactive: colors.getPort('innerInactive', isDarkMode),
  },
  wire: {
    default: colors.getWire('default', isDarkMode),
    temp: colors.getWire('temp', isDarkMode),
    doubleInner: colors.getWire('doubleInner', isDarkMode),
  },
  grid: colors.getGrid(isDarkMode),
  text: {
    primary: colors.getText('primary', isDarkMode),
    secondary: colors.getText('secondary', isDarkMode),
    muted: colors.getText('muted', isDarkMode),
    accent: colors.text.accent,
  },
});

/** Get all layout constants */
export const getLayout = () => ({
  node: layout.node,
  port: layout.port,
  wire: layout.wire,
  canvas: layout.canvas,
  panel: layout.panel,
  zIndex: layout.zIndex,
  borderScale: layout.borderScale,
  icon: layout.icon,
});

/** Get all animation constants */
export const getAnimation = () => ({
  duration: animation.duration,
  easing: animation.easing,
  cssEasing: animation.cssEasing,
  borderAnimation: animation.borderAnimation,
  glow: animation.glow,
  spring: animation.spring,
  delay: animation.delay,
});
