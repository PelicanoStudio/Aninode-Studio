/**
 * @aninode/ui - Engine Contract
 * Explicit interface for animation engine integration
 * 
 * This file defines the contract between the UI library and the consuming engine.
 * The engine should use these types and accessors to configure UI components.
 */

import { getSurface, getBorder, getPort, getWire, getGrid, getText, signalActive, neonPalette } from './colors';
import { node, port, wire, canvas, panel, zIndex, icon } from './layout';
import { duration, easing, spring } from './animation';
import { spacing, semanticSpacing, nodeSpacing } from './spacing';
import { breakpoints, canvasResponsive } from './responsive';
import { 
  QualityTier, 
  qualityFeatures, 
  lodThresholds, 
  visualizerThrottle,
  nodeRenderThresholds,
  getQualityFeatures,
  getRecommendedTier,
  getVisualizerInterval,
  getLodLevel
} from './performance';

// =============================================================================
// ENGINE PERFORMANCE HINTS INTERFACE
// =============================================================================
export interface EnginePerformanceHints {
  /** Current quality tier (engine decides based on metrics) */
  qualityTier: QualityTier;
  /** Whether user is currently interacting (drag, pan, zoom) */
  isInteracting: boolean;
  /** Number of nodes currently visible in viewport */
  visibleNodeCount: number;
  /** Current zoom level */
  zoom: number;
  /** Measured FPS (if available) */
  measuredFps?: number;
  /** Force pause all visualizers */
  pauseVisualizers?: boolean;
}

// =============================================================================
// ENGINE UI CONFIG INTERFACE
// =============================================================================
export interface EngineUIConfig {
  // Theme
  isDarkMode: boolean;
  
  // Performance
  performance: EnginePerformanceHints;
  
  // Colors (resolved for current theme)
  colors: {
    signal: { active: string };
    surface: {
      node: string;
      panel: string;
      canvas: string;
      menu: string;
      overlay: string;
    };
    border: {
      default: string;
      divider: string;
      menu: string;
    };
    port: {
      inactive: string;
      innerInactive: string;
    };
    wire: {
      default: string;
      temp: string;
      doubleInner: string;
    };
    grid: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      accent: string;
    };
    neonPalette: readonly string[];
  };
  
  // Layout
  layout: {
    node: typeof node;
    port: typeof port;
    wire: typeof wire;
    canvas: typeof canvas;
    panel: typeof panel;
    zIndex: typeof zIndex;
    icon: typeof icon;
  };
  
  // Spacing
  spacing: {
    base: typeof spacing;
    semantic: typeof semanticSpacing;
    node: typeof nodeSpacing;
  };
  
  // Responsive
  responsive: {
    breakpoints: typeof breakpoints;
    canvas: typeof canvasResponsive;
  };
  
  // Animation
  animation: {
    duration: typeof duration;
    easing: typeof easing;
    spring: typeof spring;
  };
  
  // Quality features (resolved for current tier)
  features: ReturnType<typeof getQualityFeatures>;
  
  // Visualizer interval (resolved for current context)
  visualizerInterval: number;
  
  // LOD level (resolved for current zoom)
  lodLevel: 'near' | 'mid' | 'far' | 'ultraFar';
}

// =============================================================================
// MAIN CONFIG ACCESSOR
// =============================================================================

/**
 * Get complete UI configuration for engine consumption
 * 
 * @example
 * // In animation engine's Valtio store:
 * const uiConfig = getEngineUIConfig(
 *   store.ui.isDarkMode,
 *   store.performance
 * );
 */
export const getEngineUIConfig = (
  isDarkMode: boolean,
  performance: EnginePerformanceHints
): EngineUIConfig => ({
  isDarkMode,
  performance,
  
  colors: {
    signal: { active: signalActive },
    surface: {
      node: getSurface('node', isDarkMode),
      panel: getSurface('panel', isDarkMode),
      canvas: getSurface('canvas', isDarkMode),
      menu: getSurface('menu', isDarkMode),
      overlay: getSurface('overlay', isDarkMode),
    },
    border: {
      default: getBorder('default', isDarkMode),
      divider: getBorder('divider', isDarkMode),
      menu: getBorder('menuBorder', isDarkMode),
    },
    port: {
      inactive: getPort('inactive', isDarkMode),
      innerInactive: getPort('innerInactive', isDarkMode),
    },
    wire: {
      default: getWire('default', isDarkMode),
      temp: getWire('temp', isDarkMode),
      doubleInner: getWire('doubleInner', isDarkMode),
    },
    grid: getGrid(isDarkMode),
    text: {
      primary: getText('primary', isDarkMode),
      secondary: getText('secondary', isDarkMode),
      muted: getText('muted', isDarkMode),
      accent: signalActive,
    },
    neonPalette,
  },
  
  layout: { node, port, wire, canvas, panel, zIndex, icon },
  spacing: { base: spacing, semantic: semanticSpacing, node: nodeSpacing },
  responsive: { breakpoints, canvas: canvasResponsive },
  animation: { duration, easing, spring },
  
  features: getQualityFeatures(performance.qualityTier),
  visualizerInterval: getVisualizerInterval(performance.qualityTier, performance.isInteracting),
  lodLevel: getLodLevel(performance.zoom),
});

// =============================================================================
// CONVENIENCE EXPORTS FOR ENGINE
// =============================================================================

/** Default performance hints for initial state */
export const defaultPerformanceHints: EnginePerformanceHints = {
  qualityTier: QualityTier.HIGH,
  isInteracting: false,
  visibleNodeCount: 0,
  zoom: 1,
};

/** Re-export performance utilities for engine use */
export {
  QualityTier,
  qualityFeatures,
  lodThresholds,
  visualizerThrottle,
  nodeRenderThresholds,
  getQualityFeatures,
  getRecommendedTier,
  getVisualizerInterval,
  getLodLevel,
};

// =============================================================================
// VALTIO STATE STRUCTURE SUGGESTION
// =============================================================================
/**
 * Suggested Valtio store structure for engine:
 * 
 * ```typescript
 * import { proxy } from 'valtio';
 * import { QualityTier, defaultPerformanceHints } from '@aninode/ui/tokens';
 * 
 * export const engineStore = proxy({
 *   ui: {
 *     isDarkMode: true,
 *   },
 *   performance: {
 *     ...defaultPerformanceHints,
 *   },
 *   viewport: {
 *     x: 0,
 *     y: 0,
 *     zoom: 1,
 *   },
 * });
 * ```
 */
