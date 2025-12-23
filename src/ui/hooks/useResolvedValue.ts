/**
 * useResolvedValue Hook
 * 
 * Reactively reads a property value, respecting the 3-level hierarchy:
 * OVERRIDE (runtime) > PRESET > BASE (config)
 * 
 * This bridges the gap between:
 * - AnimationEngine writing to engineStore.runtime.overrides (60fps)
 * - React components reading from useSnapshot
 */

import { engineStore } from '@core/store'
import { useSnapshot } from 'valtio'

/**
 * Get resolved value for a node property, subscribing to runtime changes.
 * 
 * @param nodeId - The node ID
 * @param propName - The property name to resolve
 * @param defaultVal - Fallback value if nothing found
 * @returns The resolved value (override > base > default)
 * 
 * @example
 * const frequency = useResolvedValue(nodeId, 'frequency', 1)
 */
export function useResolvedValue<T>(
  nodeId: string | undefined,
  propName: string,
  defaultVal: T
): T {
  // Subscribe to both runtime and project state
  const snap = useSnapshot(engineStore)
  
  if (!nodeId) return defaultVal
  
  // Level 3: Check Runtime Overrides first
  const override = snap.runtime.overrides[nodeId]?.[propName]
  if (override !== undefined) {
    return override as T
  }
  
  // Level 1: Check Base Props
  const node = snap.project.nodes[nodeId]
  if (node?.baseProps[propName] !== undefined) {
    return node.baseProps[propName] as T
  }
  
  return defaultVal
}

/**
 * Get all resolved values for a node, useful for displaying in SidePanel.
 * Merges base props with runtime overrides.
 */
export function useResolvedConfig(nodeId: string | undefined): Record<string, any> {
  const snap = useSnapshot(engineStore)
  
  if (!nodeId) return {}
  
  const node = snap.project.nodes[nodeId]
  if (!node) return {}
  
  // Start with base props
  const config = { ...node.baseProps }
  
  // Apply runtime overrides on top
  const overrides = snap.runtime.overrides[nodeId]
  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      config[key] = value
    })
  }
  
  return config
}

/**
 * Get the computed output value from a node (what it produces).
 * Used for showing real-time LFO output, slider value, etc.
 */
export function useNodeOutput(
  nodeId: string | undefined,
  outputName: string = 'value'
): number | undefined {
  const snap = useSnapshot(engineStore)
  
  if (!nodeId) return undefined
  
  return snap.runtime.nodeOutputs[nodeId]?.[outputName] as number | undefined
}
