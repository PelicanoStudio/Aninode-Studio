import { useEffect, useRef } from 'react'
import { engineStore, NodeDefinition } from './engineStore'

/**
 * Hook to register and unregister a node in the global store
 * (Passive Data Entry - No Side Effects)
 */
export function useNodeRegistration(
  nodeId: string | null | undefined,
  nodeType: string,
  baseProps: any,
  initialPosition = { x: 0, y: 0 }
) {
  const propsRef = useRef(baseProps)
  propsRef.current = baseProps

  useEffect(() => {
    if (!nodeId) return

    // 1. Construct Definition (Project Layer)
    const newNode: NodeDefinition = {
      id: nodeId,
      type: nodeType,
      name: baseProps.name || nodeId,
      position: initialPosition, 
      baseProps: { ...propsRef.current },
      // Default Timeline Config (Independent/Passive)
      timelineConfig: {
        mode: 'independent',
        offset: 0,
        keyframes: {}
      }
    }

    // 2. Register to Store (Mutation)
    engineStore.project.nodes[nodeId] = newNode
    console.log(`[Aninode] Node registered: ${nodeId}`)

    // 3. Cleanup
    return () => {
      delete engineStore.project.nodes[nodeId]
      console.log(`[Aninode] Node unregistered: ${nodeId}`)
    }
  }, [nodeId, nodeType]) // initialPosition ignored for now as nodes are layout-less in this phase or handled by UI

  // Update baseProps when they change (Reactive)
  useEffect(() => {
    if (nodeId && engineStore.project.nodes[nodeId]) {
        // Sync new props to definition
      engineStore.project.nodes[nodeId].baseProps = { ...propsRef.current }
    }
  }, [nodeId, baseProps])
}
