/**
 * @aninode/ui - Engine Contract
 * Explicit interface for animation engine integration
 * 
 * This file defines the contract between the UI library and the consuming engine.
 * The engine should use these types and accessors to configure UI components.
 */

import { duration, easing, spring } from './animation';
import { getBorder, getGrid, getPort, getSurface, getText, getWire, neonPalette, signalActive } from './colors';
import { canvas, icon, node, panel, port, wire, zIndex } from './layout';
import {
    QualityTier,
    getLodLevel,
    getQualityFeatures,
    getRecommendedTier,
    getVisualizerInterval,
    lodThresholds,
    nodeRenderThresholds,
    qualityFeatures,
    visualizerThrottle
} from './performance';
import { breakpoints, canvasResponsive } from './responsive';
import { nodeSpacing, semanticSpacing, spacing } from './spacing';

// =============================================================================
// CONNECTION PROP NAME CONSTANTS
// =============================================================================
// CRITICAL: These are the standard prop names used across the engine.
// Using these constants prevents mismatches between:
// - Connection definitions (sourceProp/targetProp)
// - nodeOutputs storage keys
// - runtime.overrides keys
// - resolveProperty lookups

/**
 * Standard property names for node connections and data flow.
 * ALL code that creates connections or reads/writes node values MUST use these.
 */
export const CONNECTION_PROPS = {
  /** Default output property - used by nodeOutputs[nodeId].value */
  OUTPUT: 'value',
  /** Default input property - writes to overrides[nodeId].value */
  INPUT: 'value',
  /** Alias for clarity in source context */
  SOURCE_DEFAULT: 'value',
  /** Alias for clarity in target context */
  TARGET_DEFAULT: 'value',
} as const;

/** Helper to get default source prop */
export const getDefaultSourceProp = () => CONNECTION_PROPS.OUTPUT;

/** Helper to get default target prop */
export const getDefaultTargetProp = () => CONNECTION_PROPS.INPUT;

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
    QualityTier, getLodLevel, getQualityFeatures,
    getRecommendedTier,
    getVisualizerInterval, lodThresholds, nodeRenderThresholds, qualityFeatures, visualizerThrottle
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
