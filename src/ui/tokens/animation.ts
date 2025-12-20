/**
 * @aninode/ui - Animation Tokens
 * Duration, easing, and timing constants for GSAP integration
 */

// =============================================================================
// DURATION (in seconds for GSAP compatibility)
// =============================================================================
export const duration = {
  /** Instant feedback (hover states) */
  instant: 0.1,
  /** Fast transitions (buttons, toggles) */
  fast: 0.2,
  /** Normal transitions (panels, menus) */
  normal: 0.3,
  /** Slow transitions (modals, large elements) */
  slow: 0.5,
  /** Very slow (page transitions) */
  verySlow: 0.8,
} as const;

// =============================================================================
// EASING FUNCTIONS (GSAP-compatible strings)
// =============================================================================
export const easing = {
  /** Standard ease out (default for most animations) */
  out: 'power2.out',
  /** Ease in for exit animations */
  in: 'power2.in',
  /** Ease in-out for symmetric animations */
  inOut: 'power2.inOut',
  /** Elastic for bouncy effects */
  elastic: 'elastic.out(1, 0.5)',
  /** Back for overshoot effects */
  back: 'back.out(1.7)',
  /** Linear for constant speed */
  linear: 'none',
} as const;

// =============================================================================
// CSS EASING (Tailwind-compatible)
// =============================================================================
export const cssEasing = {
  out: 'ease-out',
  in: 'ease-in',
  inOut: 'ease-in-out',
  linear: 'linear',
} as const;

// =============================================================================
// BORDER ANIMATION SCALING
// =============================================================================
export const borderAnimation = {
  /** Scale factor calculation: clamp(min, 1/zoom, max) */
  scaleMin: 0.5,
  scaleMax: 3,
  activeScaleMin: 1,
  activeScaleMax: 4,
  /** Multiplier for active border width */
  activeBorderMultiplier: 2,
} as const;

// =============================================================================
// GLOW ANIMATION
// =============================================================================
export const glow = {
  /** Base glow radius for selected nodes */
  selectedRadius: 10,
  /** Base glow radius for active chain */
  activeChainRadius: 5,
} as const;

// =============================================================================
// SPRING PHYSICS (for future physics-based animations)
// =============================================================================
export const spring = {
  /** Stiffness for snappy animations */
  stiff: { stiffness: 400, damping: 30 },
  /** Normal spring feel */
  normal: { stiffness: 200, damping: 20 },
  /** Loose/wobbly spring */
  loose: { stiffness: 100, damping: 10 },
} as const;

// =============================================================================
// DELAYS
// =============================================================================
export const delay = {
  /** Tooltip show delay */
  tooltip: 0.5,
  /** Hover intent delay */
  hoverIntent: 0.15,
  /** Stagger delay for lists */
  stagger: 0.05,
} as const;
