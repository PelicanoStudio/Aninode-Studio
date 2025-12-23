/**
 * TOPOLOGICAL SORT
 * 
 * Ensures nodes are processed in dependency order.
 * Signal generators (no inputs) are processed first,
 * then nodes that depend on them, and so on.
 * 
 * Handles cycles by detecting them and breaking at arbitrary points.
 */

import { engineStore } from '@core/store'

/**
 * Build a dependency graph from connections
 * Returns a map of nodeId -> array of nodeIds it depends on
 */
function buildDependencyGraph(): Map<string, string[]> {
  const connections = Object.values(engineStore.project.connections)
  const deps = new Map<string, string[]>()
  
  // Initialize all nodes with empty dependency arrays
  Object.keys(engineStore.project.nodes).forEach(nodeId => {
    deps.set(nodeId, [])
  })
  
  // Add dependencies based on connections
  // If A's output -> B's input, then B depends on A
  connections.forEach(conn => {
    const existing = deps.get(conn.targetNodeId) || []
    if (!existing.includes(conn.sourceNodeId)) {
      existing.push(conn.sourceNodeId)
      deps.set(conn.targetNodeId, existing)
    }
  })
  
  return deps
}

/**
 * Kahn's algorithm for topological sorting
 * Returns nodes in order where all dependencies are processed before dependents
 */
export function getProcessingOrder(): string[] {
  const deps = buildDependencyGraph()
  const nodeIds = Array.from(deps.keys())
  
  // Calculate in-degree (number of dependencies) for each node
  const inDegree = new Map<string, number>()
  nodeIds.forEach(id => inDegree.set(id, deps.get(id)?.length || 0))
  
  // Start with nodes that have no dependencies (signal generators)
  const queue: string[] = []
  nodeIds.forEach(id => {
    if (inDegree.get(id) === 0) {
      queue.push(id)
    }
  })
  
  const sorted: string[] = []
  
  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current)
    
    // For each node that depends on current, reduce its in-degree
    nodeIds.forEach(id => {
      const nodeDeps = deps.get(id) || []
      if (nodeDeps.includes(current)) {
        const newDegree = (inDegree.get(id) || 0) - 1
        inDegree.set(id, newDegree)
        if (newDegree === 0) {
          queue.push(id)
        }
      }
    })
  }
  
  // Check for cycles (nodes that couldn't be processed)
  const remaining = nodeIds.filter(id => !sorted.includes(id))
  if (remaining.length > 0) {
    console.warn('[TopoSort] Cycle detected in node graph. Adding remaining nodes:', remaining)
    // Add remaining nodes anyway (cycle broken at arbitrary point)
    sorted.push(...remaining)
  }
  
  return sorted
}

/**
 * Get just the signal generator nodes (nodes with no input connections)
 */
export function getSignalGenerators(): string[] {
  const connections = Object.values(engineStore.project.connections)
  const nodes = Object.keys(engineStore.project.nodes)
  
  // Nodes that have no incoming connections
  const targetNodes = new Set(connections.map(c => c.targetNodeId))
  return nodes.filter(id => !targetNodes.has(id))
}

/**
 * Get nodes that are downstream of a given node
 */
export function getDownstreamNodes(nodeId: string): string[] {
  const connections = Object.values(engineStore.project.connections)
  const visited = new Set<string>()
  const result: string[] = []
  
  function traverse(id: string) {
    if (visited.has(id)) return
    visited.add(id)
    
    connections.forEach(conn => {
      if (conn.sourceNodeId === id) {
        result.push(conn.targetNodeId)
        traverse(conn.targetNodeId)
      }
    })
  }
  
  traverse(nodeId)
  return result
}
