/**
 * @aninode/ui - Responsive Tokens
 * Breakpoint definitions for responsive layouts
 * 
 * Note: The node editor is primarily a desktop experience but
 * supports tablet/touch. Mobile is constrained viewport mode.
 */

// =============================================================================
// BREAKPOINTS (px)
// =============================================================================
export const breakpoints = {
  /** Small devices (landscape phones) */
  sm: 640,
  /** Medium devices (tablets) */
  md: 768,
  /** Large devices (desktops) */
  lg: 1024,
  /** Extra large devices (large desktops) */
  xl: 1280,
  /** 2K+ displays */
  xxl: 1536,
} as const;

// =============================================================================
// MEDIA QUERY HELPERS
// =============================================================================

/** Generate min-width media query string */
export const minWidth = (bp: keyof typeof breakpoints): string => 
  `(min-width: ${breakpoints[bp]}px)`;

/** Generate max-width media query string */
export const maxWidth = (bp: keyof typeof breakpoints): string => 
  `(max-width: ${breakpoints[bp] - 1}px)`;

/** Generate between breakpoints media query */
export const between = (
  minBp: keyof typeof breakpoints, 
  maxBp: keyof typeof breakpoints
): string => 
  `(min-width: ${breakpoints[minBp]}px) and (max-width: ${breakpoints[maxBp] - 1}px)`;

// =============================================================================
// VIEWPORT DETECTION (for SSR-safe checks)
// =============================================================================

/** Check if viewport matches breakpoint (client-side only) */
export const matchesBreakpoint = (bp: keyof typeof breakpoints): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[bp];
};

/** Get current breakpoint key */
export const getCurrentBreakpoint = (): keyof typeof breakpoints | 'xs' => {
  if (typeof window === 'undefined') return 'lg'; // SSR default
  
  const width = window.innerWidth;
  if (width >= breakpoints.xxl) return 'xxl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// =============================================================================
// RESPONSIVE VALUES
// =============================================================================

/** 
 * Select value based on current breakpoint
 * Falls back to smaller breakpoint if not defined
 */
export const responsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
}): T | undefined => {
  const bp = getCurrentBreakpoint();
  const order: (keyof typeof values)[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const startIdx = order.indexOf(bp as keyof typeof values);
  
  for (let i = startIdx; i < order.length; i++) {
    const key = order[i];
    if (values[key] !== undefined) return values[key];
  }
  return undefined;
};

// =============================================================================
// CANVAS-SPECIFIC RESPONSIVE ADJUSTMENTS
// =============================================================================
export const canvasResponsive = {
  /** Minimum zoom at different breakpoints */
  minZoom: {
    xs: 0.3,
    sm: 0.25,
    md: 0.2,
    lg: 0.2,
  },
  /** Touch target size multiplier */
  touchTargetMultiplier: {
    xs: 1.5,
    sm: 1.25,
    md: 1,
    lg: 1,
  },
  /** UI scale factor */
  uiScale: {
    xs: 0.85,
    sm: 0.9,
    md: 1,
    lg: 1,
  },
} as const;

// =============================================================================
// TYPES
// =============================================================================
export type BreakpointKey = keyof typeof breakpoints;
