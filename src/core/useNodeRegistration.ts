import { useEffect, useRef } from 'react'
import { aninodeStore, storeActions } from './store'
import type { NodeState, NodeType } from '../types'

/**
 * Hook to register and unregister a node in the global store
 */
export function useNodeRegistration(
  nodeId: string | null | undefined,
  nodeType: NodeType,
  baseProps: any,
  initialPosition = { x: 0, y: 0 }
) {
  const propsRef = useRef(baseProps)
  propsRef.current = baseProps

  useEffect(() => {
    if (!nodeId) return

    // Register node on mount
    const newNode: NodeState = {
      id: nodeId,
      type: nodeType,
      name: baseProps.name || nodeId,
      position: initialPosition,
      baseProps: { ...propsRef.current },
      overrides: {},
      outputs: {},
      connectedInputs: {},
    }

    storeActions.addNode(newNode)
    console.log(`[Aninode] Node registered: ${nodeId} (Type: ${nodeType})`)

    // Cleanup on unmount
    return () => {
      storeActions.removeNode(nodeId)
      console.log(`[Aninode] Node unregistered: ${nodeId}`)
    }
  }, [nodeId, nodeType, initialPosition])

  // Update baseProps when they change
  useEffect(() => {
    if (nodeId && aninodeStore.nodes[nodeId]) {
      aninodeStore.nodes[nodeId].baseProps = { ...propsRef.current }
    }
  }, [nodeId, baseProps])
}
