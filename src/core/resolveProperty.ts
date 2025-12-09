import { engineStore } from './engineStore.ts'

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
  // Check Runtime Overrides (Level 3)
  const runtimeOverrides = engineStore.runtime.overrides[nodeId]
  if (runtimeOverrides && runtimeOverrides[propName] !== undefined) {
    return runtimeOverrides[propName]
  }

  // Check Project Definition (Level 1 & 2)
  const node = engineStore.project.nodes[nodeId]
  if (!node) return defaultVal

  // Priority 2: Level 2 - Preset reference
  const basePropValue = node.baseProps[propName]
  if (typeof basePropValue === 'string' && basePropValue.startsWith('preset:')) {
    // const _presetId = basePropValue.substring(7) 
    // TODO: Implement preset resolution from engineStore.project.presets
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
  // Check Runtime Overrides
  const runtimeOverrides = engineStore.runtime.overrides[nodeId]
  
  // Try exact item-prop match if overrides supports it (Convention: "itemId.propName"?)
  // For now assuming the new store overrides are simple Prop Key based.
  // If the old system used nested objects, we might need to adjust key generation.
  // Let's check for specific override key convention if applicable, otherwise skip.
  
  // Fallback to global node override for this prop
  if (runtimeOverrides && runtimeOverrides[propName] !== undefined) {
    return runtimeOverrides[propName]
  }

  // Check Project Definition
  const node = engineStore.project.nodes[nodeId]
  if (!node) return defaultVal

  // Priority 2: Level 2 - Preset (not yet implemented)
  const basePropKey = `${propName}${itemId}` // e.g., "scale3"
  const basePropValue = node.baseProps[basePropKey] ?? node.baseProps[propName]

  // Priority 3: Level 1 - Base Props
  if (basePropValue !== undefined) {
    return basePropValue
  }

  return defaultVal
}
