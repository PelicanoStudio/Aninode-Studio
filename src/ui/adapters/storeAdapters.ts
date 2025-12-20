/**
 * Store Adapters
 * 
 * Bridge between UI Library types (NodeData, Connection) 
 * and Engine types (NodeDefinition, ConnectionDefinition)
 */

import { Connection, ConnectionType, NodeData, NodeType } from '@/ui/types'
import { ConnectionDefinition, NodeDefinition } from '@core/store'

/**
 * Convert UI NodeData to Engine NodeDefinition
 */
export function nodeDataToDefinition(node: NodeData): NodeDefinition {
  return {
    id: node.id,
    type: node.type, // Both use string enums
    name: node.label,
    position: { x: node.position.x, y: node.position.y },
    baseProps: {
      ...node.config,
      // Store boundProps in baseProps for now
      boundProps: node.boundProps,
      dimensions: node.dimensions,
      collapsed: node.collapsed,
    },
    timelineConfig: {
      mode: 'linked',
      offset: 0,
      keyframes: {},
    },
  }
}

/**
 * Convert Engine NodeDefinition to UI NodeData
 */
export function definitionToNodeData(def: NodeDefinition): NodeData {
  const { boundProps, dimensions, collapsed, ...config } = def.baseProps || {}
  return {
    id: def.id,
    type: def.type as NodeType,
    label: def.name,
    position: { x: def.position.x, y: def.position.y },
    config: config || {},
    boundProps: boundProps,
    dimensions: dimensions,
    collapsed: collapsed,
  }
}

/**
 * Convert UI Connection to Engine ConnectionDefinition
 */
export function connectionToDefinition(conn: Connection): ConnectionDefinition {
  return {
    id: conn.id,
    sourceNodeId: conn.source,
    sourceProp: 'output', // Default output prop
    targetNodeId: conn.target,
    targetProp: 'input', // Default input prop
  }
}

/**
 * Convert Engine ConnectionDefinition to UI Connection
 */
export function definitionToConnection(def: ConnectionDefinition): Connection {
  return {
    id: def.id,
    source: def.sourceNodeId,
    target: def.targetNodeId,
    type: ConnectionType.BEZIER, // Default connection type for UI
  }
}

/**
 * Map UI NodeType to Engine node type string
 * (Both use same values, but this ensures consistency)
 */
export const nodeTypeMap: Record<NodeType, string> = {
  [NodeType.PICKER]: 'PICKER',
  [NodeType.OSCILLATOR]: 'OSCILLATOR',
  [NodeType.TRANSFORM]: 'TRANSFORM',
  [NodeType.OUTPUT]: 'OUTPUT',
  [NodeType.LOGIC]: 'LOGIC',
  [NodeType.SLIDER]: 'SLIDER',
  [NodeType.NUMBER]: 'NUMBER',
  [NodeType.BOOLEAN]: 'BOOLEAN',
  [NodeType.CLONE]: 'CLONE',
}
