/**
 * @aninode/ui - Token Barrel Export
 * Clean public API for importing design tokens
 */

// Master theme (preferred import)
export { getAnimation, getLayout, getThemeColors, theme } from './theme.tokens';
export type { Theme } from './theme.tokens';

// Individual token modules
export * as animation from './animation';
export * as colors from './colors';
export * as layout from './layout';
export * as performanceModule from './performance';
export * as responsiveModule from './responsive';
export * as shortcutsModule from './shortcuts';
export * as spacingModule from './spacing';

// Engine contract (for animation engine integration)
export {
    CONNECTION_PROPS,
    defaultPerformanceHints,
    getDefaultSourceProp,
    getDefaultTargetProp,
    getEngineUIConfig,
    type EnginePerformanceHints,
    type EngineUIConfig
} from './engine.contract';

// Commonly used direct exports
export {
    getBorder, getColor, getGrid, getPort, getSurface, getText, getWire, neonPalette, signalActive
} from './colors';

export {
    canvas as canvasLayout, icon as iconSizes, interaction, node as nodeLayout, panel as panelLayout, port as portLayout,
    wire as wireLayout, zIndex
} from './layout';

export {
    cssEasing, duration,
    easing
} from './animation';

export {
    formatShortcut,
    getShortcutsByCategory, shortcuts, valueConversion
} from './shortcuts';

export {
    connectionRules, getConnectionTypeOptions, suggestConnectionType,
    validateConnectionType
} from './connections';

// Spacing exports
export {
    baseUnit, calcSpacing, getSemanticSpacing, getSpacing, nodeSpacing, semanticSpacing, spacing
} from './spacing';

// Responsive exports
export {
    between, breakpoints, canvasResponsive, getCurrentBreakpoint, matchesBreakpoint, maxWidth, minWidth, responsiveValue
} from './responsive';

// Performance exports
export {
    QualityTier, getLodLevel, getQualityFeatures, getRecommendedTier,
    getVisualizerInterval, isFeatureEnabled, lodThresholds, nodeRenderThresholds, qualityFeatures, visualizerThrottle,
    wireSimplification
} from './performance';

// Waveform exports (LFO visualization)
export {
    calculateWaveformY, getWaveformColor, getWaveformLabel,
    staticWaveformLayout, waveformAnimation, waveformColors,
    waveformIconPaths, waveformLayout
} from './waveform';
export type { WaveformType } from './waveform';

// Port exports (default ports, expose buttons)
export {
    defaultPorts,
    exposeButton, getDefaultPorts, getExposeButtonColor, isDefaultPort, portTooltips
} from './ports';
export type { PortDefinition, PortDirection } from './ports';

// Node sizing exports (responsive dimensions)
export {
    getNodeDimensions, getResponsiveDimension,
    getResponsiveFontSize,
    getResponsiveIconSize, isNodeScalable, nodeCategories,
    nodeDimensions,
    nodeScalability, responsiveScale
} from './nodeSizing';
export type { Breakpoint, NodeCategory } from './nodeSizing';

// Connection semantics exports
export {
    connectionColors, connectionSemantics,
    connectionStyles, getConnectionColor,
    getConnectionStyle, suggestConnectionType as suggestConnectionTypeSemantic
} from './connectionSemantics';
export type { ConnectionSemantic } from './connectionSemantics';

