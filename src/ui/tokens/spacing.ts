/**
 * @aninode/ui - Spacing Tokens
 * Responsive spacing system based on 4px grid
 * 
 * All spacing values derive from a base unit for consistent rhythm
 */

// =============================================================================
// BASE UNIT
// =============================================================================
export const baseUnit = 4;

// =============================================================================
// SPACING SCALE (4px grid)
// =============================================================================
export const spacing = {
  /** 0px - No space */
  none: 0,
  /** 2px - Hairline spacing */
  xxs: baseUnit * 0.5,  // 2px
  /** 4px - Tight spacing */
  xs: baseUnit,          // 4px
  /** 8px - Compact spacing */
  sm: baseUnit * 2,      // 8px
  /** 12px - Default spacing */
  md: baseUnit * 3,      // 12px
  /** 16px - Comfortable spacing */
  lg: baseUnit * 4,      // 16px
  /** 24px - Relaxed spacing */
  xl: baseUnit * 6,      // 24px
  /** 32px - Generous spacing */
  xxl: baseUnit * 8,     // 32px
  /** 48px - Section spacing */
  xxxl: baseUnit * 12,   // 48px
} as const;

// =============================================================================
// SEMANTIC SPACING
// =============================================================================
export const semanticSpacing = {
  /** Inline element gaps */
  inlineGap: spacing.xs,        // 4px
  /** Stack element gaps */
  stackGap: spacing.sm,         // 8px
  /** Component internal padding */
  componentPadding: spacing.md, // 12px
  /** Card/panel padding */
  cardPadding: spacing.lg,      // 16px
  /** Section margins */
  sectionMargin: spacing.xl,    // 24px
  /** Page margins */
  pageMargin: spacing.xxl,      // 32px
} as const;

// =============================================================================
// NODE-SPECIFIC SPACING
// =============================================================================
export const nodeSpacing = {
  /** Header internal padding */
  headerPadding: spacing.sm,    // 8px
  /** Body internal padding */
  bodyPadding: spacing.md,      // 12px
  /** Gap between body elements */
  bodyGap: spacing.sm,          // 8px
  /** Port offset from node edge */
  portOffset: spacing.xl,       // 24px
  /** Margin between nodes (snap grid) */
  nodeMargin: spacing.lg * 1.25, // 20px (snap size)
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get spacing value by key */
export const getSpacing = (size: keyof typeof spacing): number => spacing[size];

/** Get semantic spacing by key */
export const getSemanticSpacing = (key: keyof typeof semanticSpacing): number => 
  semanticSpacing[key];

/** Calculate spacing based on multiplier */
export const calcSpacing = (multiplier: number): number => baseUnit * multiplier;

// =============================================================================
// TYPES
// =============================================================================
export type SpacingKey = keyof typeof spacing;
export type SemanticSpacingKey = keyof typeof semanticSpacing;
