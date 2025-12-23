/**
 * NODE SIZING TOKENS
 * 
 * Defines fixed sizes, scalability rules, and responsive breakpoints
 * for all node types.
 */

import { NodeType } from '@/ui/types'

// === NODE CATEGORIES ===

export type NodeCategory = 
  | 'standard'      // Fixed size, most nodes
  | 'media'         // Scalable, has viewport/thumbnail
  | 'compact'       // Smaller fixed size (slider, switch, number)
  | 'special'       // Custom sizing rules

/**
 * Node type to category mapping
 */
export const nodeCategories: Record<NodeType, NodeCategory> = {
  [NodeType.OSCILLATOR]: 'standard',
  [NodeType.TRANSFORM]: 'standard',
  [NodeType.LOGIC]: 'standard',
  [NodeType.OUTPUT]: 'standard',
  [NodeType.CLONE]: 'standard',
  [NodeType.PICKER]: 'media',       // Has image thumbnail, scalable
  [NodeType.SLIDER]: 'compact',     // Special topology (deferred)
  [NodeType.NUMBER]: 'compact',     // Special topology (deferred)
  [NodeType.BOOLEAN]: 'compact',    // Special topology (deferred)
  [NodeType.DEBUG]: 'special',      // Debug panel, may need larger size
}

// === BASE DIMENSIONS ===

export const nodeDimensions = {
  standard: {
    width: 256,
    height: 'auto',             // Content-based
    minHeight: 100,
    maxHeight: 400,
  },
  media: {
    width: 256,
    height: 180,
    minWidth: 180,
    maxWidth: 500,
    minHeight: 120,
    maxHeight: 400,
  },
  compact: {
    width: 200,
    height: 'auto',
    minHeight: 60,
    maxHeight: 120,
  },
  special: {
    width: 256,
    height: 'auto',
    minHeight: 100,
    maxHeight: 600,
    minWidth: 180,
    maxWidth: 600,
  },
} as const

// === SCALABILITY ===

export const nodeScalability: Record<NodeCategory, boolean> = {
  standard: false,    // Not scalable
  media: true,        // Scalable (has resize handles)
  compact: false,     // Not scalable (deferred design)
  special: true,      // Custom rules
}

/**
 * Check if a node type is scalable
 */
export function isNodeScalable(nodeType: NodeType): boolean {
  const category = nodeCategories[nodeType]
  return nodeScalability[category] || false
}

// === RESPONSIVE BREAKPOINTS ===

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large'

export const breakpoints: Record<Breakpoint, number> = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1440,
}

/**
 * Scaling factors per breakpoint
 */
export const responsiveScale: Record<Breakpoint, number> = {
  mobile: 0.75,
  tablet: 0.85,
  desktop: 1.0,
  large: 1.1,
}

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024
  
  if (width < breakpoints.mobile) return 'mobile'
  if (width < breakpoints.tablet) return 'tablet'
  if (width < breakpoints.desktop) return 'desktop'
  return 'large'
}

/**
 * Get scaled dimension for current breakpoint
 */
export function getResponsiveDimension(baseDimension: number): number {
  const breakpoint = getCurrentBreakpoint()
  const scale = responsiveScale[breakpoint]
  return Math.round(baseDimension * scale)
}

// === TYPOGRAPHY SCALING ===

export const nodeTypography = {
  base: {
    header: 12,         // Node title
    label: 10,          // Field labels
    value: 11,          // Input values
    mono: 10,           // Monospace text
  },
  scale: responsiveScale,
} as const

/**
 * Get scaled font size
 */
export function getResponsiveFontSize(
  key: keyof typeof nodeTypography.base
): number {
  const baseSize = nodeTypography.base[key]
  const breakpoint = getCurrentBreakpoint()
  const scale = responsiveScale[breakpoint]
  return Math.round(baseSize * scale)
}

// === ICON SCALING ===

export const nodeIcons = {
  base: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  scale: responsiveScale,
} as const

/**
 * Get scaled icon size
 */
export function getResponsiveIconSize(
  key: keyof typeof nodeIcons.base
): number {
  const baseSize = nodeIcons.base[key]
  const breakpoint = getCurrentBreakpoint()
  const scale = responsiveScale[breakpoint]
  return Math.round(baseSize * scale)
}

// === NODE DIMENSION GETTERS ===

/**
 * Get node dimensions for a node type
 */
export function getNodeDimensions(nodeType: NodeType) {
  const category = nodeCategories[nodeType]
  const dims = nodeDimensions[category] || nodeDimensions.standard
  
  return {
    width: getResponsiveDimension(dims.width),
    minHeight: dims.minHeight ? getResponsiveDimension(dims.minHeight) : undefined,
    maxHeight: dims.maxHeight ? getResponsiveDimension(dims.maxHeight) : undefined,
    minWidth: 'minWidth' in dims ? getResponsiveDimension(dims.minWidth) : undefined,
    maxWidth: 'maxWidth' in dims ? getResponsiveDimension(dims.maxWidth) : undefined,
  }
}
