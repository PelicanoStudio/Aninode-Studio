/**
 * NODE REGISTRY
 * 
 * Central registry for all node type definitions.
 * This is the single source of truth for node metadata, ports, defaults, and compute logic.
 * 
 * To add a new node:
 * 1. Create a NodeTypeDefinition
 * 2. Call registerNodeType(definition)
 * 3. Optionally create a custom Content component
 */

import type { EngineStore } from '@core/store'
import type { LucideIcon } from 'lucide-react'

// === NODE CATEGORIES ===

export type NodeCategory = 
  | 'signal'      // LFO, Noise, Curve - generate data
  | 'transform'   // Scale, Rotation, Position - modify data
  | 'physics'     // Body, Force, Collision
  | 'visual'      // Color, Opacity, Shadow
  | 'control'     // Timeline, Trigger, Logic
  | 'io'          // Input, Output, API
  | 'special'     // Debug, Clone, Picker

// === PORT DEFINITION ===

export interface PortDefinition {
  key: string           // Property key (e.g., 'frequency', 'value')
  label: string         // Display label
  dataType: 'number' | 'boolean' | 'string' | 'array' | 'object'
  isDefault: boolean    // Is this the "obvious" default port for connections?
}

// === TIMELINE MODES ===

export type TimelineMode = 'independent' | 'linked' | 'offset'

// === COMPUTE CONTEXT ===

export interface ComputeContext {
  nodeId: string
  time: number                    // Resolved time (realElapsed or master)
  realElapsedTime: number         // Wall-clock time
  masterTime: number              // Timeline time
  inputs: Record<string, any>     // Resolved input values from connections
  baseProps: Record<string, any>  // User-defined config values
  store: EngineStore
}

// === NODE TYPE DEFINITION ===

export interface NodeTypeDefinition {
  // Metadata
  id: string                      // e.g., 'OSCILLATOR'
  label: string                   // e.g., 'LFO'
  icon: LucideIcon                // Lucide icon component
  category: NodeCategory
  
  // Port definitions
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  
  // Default base props (includes enable/bypass)
  defaultBaseProps: {
    enabled: boolean              // Stop computation when false
    bypassed: boolean             // Pass input directly to output when true
    [key: string]: any            // Node-specific props
  }
  
  // Timeline behavior
  defaultTimelineMode: TimelineMode
  
  // UI Content component (optional - use for custom visualizations)
  // If not provided, uses generic property display
  Content?: React.FC<NodeContentProps>
  
  // Compute function - called by AnimationEngine each frame
  // If not provided, node is purely visual/config
  compute?: (ctx: ComputeContext) => NodeComputeResult
}

// === COMPUTE RESULT ===

export interface NodeComputeResult {
  outputs: Record<string, any>    // Values to write to nodeOutputs
}

// === NODE CONTENT PROPS ===

export interface NodeContentProps {
  nodeId: string
  config: Record<string, any>
  isDarkMode: boolean
}

// === THE REGISTRY ===

const registry: Map<string, NodeTypeDefinition> = new Map()

/**
 * Register a node type definition
 */
export function registerNodeType(def: NodeTypeDefinition): void {
  if (registry.has(def.id)) {
    console.warn(`[NodeRegistry] Overwriting existing definition for ${def.id}`)
  }
  registry.set(def.id, def)
}

/**
 * Get a node type definition
 */
export function getNodeDefinition(typeId: string): NodeTypeDefinition | undefined {
  return registry.get(typeId)
}

/**
 * Get all registered node types
 */
export function getAllNodeTypes(): NodeTypeDefinition[] {
  return Array.from(registry.values())
}

/**
 * Get all node types in a category
 */
export function getNodeTypesByCategory(category: NodeCategory): NodeTypeDefinition[] {
  return Array.from(registry.values()).filter(def => def.category === category)
}

/**
 * Check if a node type is registered
 */
export function isNodeTypeRegistered(typeId: string): boolean {
  return registry.has(typeId)
}

/**
 * Get default ports for a registered node type
 */
export function getRegistryPorts(typeId: string): { inputs: PortDefinition[], outputs: PortDefinition[] } {
  const def = registry.get(typeId)
  if (!def) return { inputs: [], outputs: [] }
  return { inputs: def.inputs, outputs: def.outputs }
}
