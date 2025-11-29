import { aninodeStore } from './store.ts'

/**
 * Resolves the final value of a property for a node,
 * following the 3-Level Hierarchy:
 * Level 3 (Overrides) > Level 2 (Presets) > Level 1 (BaseProps)
 */
export function resolveProperty(
  nodeId: string,
  propName: string,
  defaultVal: any
): any {
  const node = aninodeStore.nodes[nodeId]
  if (!node) return defaultVal

  // Priority 1: Level 3 - Override from connections
  if (node.overrides[propName] !== undefined) {
    return node.overrides[propName]
  }

  // Priority 2: Level 2 - Preset reference
  const basePropValue = node.baseProps[propName]
  if (typeof basePropValue === 'string' && basePropValue.startsWith('preset:')) {
    const _presetId = basePropValue.substring(7) // Remove 'preset:' prefix
    // TODO: Implement preset resolution from aninodeStore.presets using _presetId
    // For now, fall through to base value
  }

  // Priority 3: Level 1 - Base Props from UI
  if (basePropValue !== undefined) {
    return basePropValue
  }

  // Fallback
  return defaultVal
}

/**
 * Resolves the final value of a property for an ITEM within a node
 * (e.g., "item_3" within "sceneAnimator1")
 */
export function resolveItemProperty(
  nodeId: string,
  itemId: string,
  propName: string,
  defaultVal: any
): any {
  const node = aninodeStore.nodes[nodeId]
  if (!node) return defaultVal

  // Priority 1: Level 3 - Item-specific override
  if (node.overrides[itemId]?.[propName] !== undefined) {
    return node.overrides[itemId][propName]
  }

  // Priority 1.5: Level 3 - Global node override
  if (node.overrides[propName] !== undefined) {
    return node.overrides[propName]
  }

  // Priority 2: Level 2 - Preset (not yet implemented)
  const basePropKey = `${propName}${itemId}` // e.g., "scale3"
  const basePropValue = node.baseProps[basePropKey] ?? node.baseProps[propName]

  // Priority 3: Level 1 - Base Props
  if (basePropValue !== undefined) {
    return basePropValue
  }

  return defaultVal
}
