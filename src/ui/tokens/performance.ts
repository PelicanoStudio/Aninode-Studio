/**
 * @aninode/ui - Performance Tokens
 * Quality tier definitions for adaptive rendering
 * 
 * The engine monitors system resources and passes quality hints
 * to UI components. Components use these tokens to adjust rendering.
 */

// =============================================================================
// QUALITY TIER ENUM
// =============================================================================
export enum QualityTier {
  /** Full visual fidelity - all effects enabled */
  HIGH = 'HIGH',
  /** Reduced effects - glow/shadows disabled */
  MEDIUM = 'MEDIUM',
  /** Minimal effects - simplified rendering */
  LOW = 'LOW',
  /** Essential only - maximum performance */
  MINIMAL = 'MINIMAL',
}

// =============================================================================
// LOD THRESHOLDS (zoom-based)
// =============================================================================
export const lodThresholds = {
  /** Near: full detail (zoom >= 0.8) */
  near: 0.8,
  /** Mid: reduced detail (zoom >= 0.4) */
  mid: 0.4,
  /** Far: minimal detail (zoom >= 0.2) */
  far: 0.2,
  /** Ultra-far: labels only (zoom < 0.2) */
  ultraFar: 0.1,
} as const;

// =============================================================================
// FEATURE FLAGS PER QUALITY TIER
// =============================================================================
export const qualityFeatures = {
  [QualityTier.HIGH]: {
    glow: true,
    shadows: true,
    opacity: true,
    animations: true,
    waveforms: true,
    gradients: true,
    blur: true,
    antialiasing: true,
  },
  [QualityTier.MEDIUM]: {
    glow: false,       // Disable expensive glow
    shadows: true,
    opacity: true,
    animations: true,
    waveforms: true,
    gradients: true,
    blur: false,       // Disable blur
    antialiasing: true,
  },
  [QualityTier.LOW]: {
    glow: false,
    shadows: false,    // Disable shadows
    opacity: false,    // Solid colors only
    animations: false, // Disable CSS animations
    waveforms: true,   // Keep waveforms (throttled)
    gradients: false,  // Solid fills only
    blur: false,
    antialiasing: true,
  },
  [QualityTier.MINIMAL]: {
    glow: false,
    shadows: false,
    opacity: false,
    animations: false,
    waveforms: false,  // Disable canvas rendering
    gradients: false,
    blur: false,
    antialiasing: false, // Faster but jagged
  },
} as const;

// =============================================================================
// VISUALIZER THROTTLE TIMINGS (ms)
// =============================================================================
export const visualizerThrottle = {
  /** Idle state - smooth 60fps */
  idle: 16,           // ~60fps
  /** Active interaction (drag, pan) */
  interaction: 50,    // 20fps
  /** Low performance detected */
  lowPerf: 100,       // 10fps
  /** Minimal mode - rare updates */
  minimal: 250,       // 4fps
  /** Paused - no updates */
  paused: Infinity,
} as const;

// =============================================================================
// CONNECTION LINE SIMPLIFICATION
// =============================================================================
export const wireSimplification = {
  [QualityTier.HIGH]: {
    /** Bezier control point segments */
    segments: 50,
    /** Stroke dash animation */
    animateDash: true,
    /** Double wire gap rendering */
    renderDoubleGap: true,
  },
  [QualityTier.MEDIUM]: {
    segments: 30,
    animateDash: true,
    renderDoubleGap: true,
  },
  [QualityTier.LOW]: {
    segments: 15,
    animateDash: false,
    renderDoubleGap: false,
  },
  [QualityTier.MINIMAL]: {
    segments: 5,       // Nearly straight lines
    animateDash: false,
    renderDoubleGap: false,
  },
} as const;

// =============================================================================
// NODE RENDER THRESHOLDS
// =============================================================================
export const nodeRenderThresholds = {
  /** Max visible nodes before auto-downgrade to MEDIUM */
  highToMedium: 50,
  /** Max visible nodes before auto-downgrade to LOW */
  mediumToLow: 150,
  /** Max visible nodes before auto-downgrade to MINIMAL */
  lowToMinimal: 300,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get feature flags for a quality tier */
export const getQualityFeatures = (tier: QualityTier) => qualityFeatures[tier];

/** Check if a specific feature is enabled at current tier */
export const isFeatureEnabled = (
  tier: QualityTier, 
  feature: keyof typeof qualityFeatures[QualityTier.HIGH]
): boolean => qualityFeatures[tier][feature];

/** Determine LOD level based on zoom */
export const getLodLevel = (zoom: number): 'near' | 'mid' | 'far' | 'ultraFar' => {
  if (zoom >= lodThresholds.near) return 'near';
  if (zoom >= lodThresholds.mid) return 'mid';
  if (zoom >= lodThresholds.far) return 'far';
  return 'ultraFar';
};

/** Get recommended quality tier based on visible node count */
export const getRecommendedTier = (visibleNodeCount: number): QualityTier => {
  if (visibleNodeCount <= nodeRenderThresholds.highToMedium) return QualityTier.HIGH;
  if (visibleNodeCount <= nodeRenderThresholds.mediumToLow) return QualityTier.MEDIUM;
  if (visibleNodeCount <= nodeRenderThresholds.lowToMinimal) return QualityTier.LOW;
  return QualityTier.MINIMAL;
};

/** Get visualizer frame interval based on context */
export const getVisualizerInterval = (
  tier: QualityTier,
  isInteracting: boolean = false
): number => {
  if (tier === QualityTier.MINIMAL) return visualizerThrottle.minimal;
  if (isInteracting) return visualizerThrottle.interaction;
  if (tier === QualityTier.LOW) return visualizerThrottle.lowPerf;
  return visualizerThrottle.idle;
};

// =============================================================================
// TYPES
// =============================================================================
export type QualityFeatureFlags = typeof qualityFeatures[QualityTier.HIGH];
export type LodLevel = 'near' | 'mid' | 'far' | 'ultraFar';
