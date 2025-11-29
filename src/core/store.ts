import { proxy } from 'valtio'
import type { NodeState, Connection, TimelineState, PresetData, SceneData } from '../types'

export type AninodeStore = {
  // Node graph
  nodes: Record<string, NodeState>
  connections: Connection[]

  // Scene data
  scene: SceneData | null
  loadedImages: Record<string, string> // file path -> blob URL

  // Timeline
  timeline: Record<string, TimelineState>

  // Presets library
  presets: Record<string, Record<string, PresetData>>

  // UI State
  ui: {
    selectedNodeIds: string[]
    selectedLayerId: string | null
    toolMode: 'SELECT' | 'DRAW' | 'PAN'
    isPlaying: boolean
    sidebarOpen: boolean
    propertiesPanelOpen: boolean
    timelinePanelOpen: boolean
    zoom: number
  }
}

export const aninodeStore = proxy<AninodeStore>({
  nodes: {},
  connections: [],

  scene: null,
  loadedImages: {},

  timeline: {
    default: {
      id: 'default',
      isPlaying: false,
      currentTime: 0,
      duration: 30,
      fps: 60,
    },
  },

  presets: {},

  ui: {
    selectedNodeIds: [],
    selectedLayerId: null,
    toolMode: 'SELECT',
    isPlaying: false,
    sidebarOpen: true,
    propertiesPanelOpen: true,
    timelinePanelOpen: true,
    zoom: 1,
  },
})

// Helper functions for store manipulation
export const storeActions = {
  // Node operations
  addNode: (node: NodeState) => {
    aninodeStore.nodes[node.id] = node
  },

  removeNode: (nodeId: string) => {
    delete aninodeStore.nodes[nodeId]
    // Remove connections involving this node
    aninodeStore.connections = aninodeStore.connections.filter(
      (conn) => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    )
  },

  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    if (aninodeStore.nodes[nodeId]) {
      aninodeStore.nodes[nodeId].position = position
    }
  },

  updateNodeProps: (nodeId: string, props: Partial<NodeState['baseProps']>) => {
    if (aninodeStore.nodes[nodeId]) {
      Object.assign(aninodeStore.nodes[nodeId].baseProps, props)
    }
  },

  // Connection operations
  addConnection: (connection: Connection) => {
    aninodeStore.connections.push(connection)

    // Update target node's connectedInputs
    const targetNode = aninodeStore.nodes[connection.targetNodeId]
    if (targetNode) {
      targetNode.connectedInputs[connection.targetInput] = {
        sourceNodeId: connection.sourceNodeId,
        sourceOutputName: connection.sourceOutput,
      }
    }
  },

  removeConnection: (connectionId: string) => {
    const connection = aninodeStore.connections.find((c) => c.id === connectionId)
    if (connection) {
      // Clear target node's connectedInput
      const targetNode = aninodeStore.nodes[connection.targetNodeId]
      if (targetNode) {
        targetNode.connectedInputs[connection.targetInput] = null
      }
    }
    aninodeStore.connections = aninodeStore.connections.filter((c) => c.id !== connectionId)
  },

  // Scene operations
  loadScene: (scene: SceneData, images: Record<string, string>) => {
    aninodeStore.scene = scene
    aninodeStore.loadedImages = images
  },

  clearScene: () => {
    // Revoke blob URLs
    Object.values(aninodeStore.loadedImages).forEach((url) => {
      URL.revokeObjectURL(url)
    })
    aninodeStore.scene = null
    aninodeStore.loadedImages = {}
  },

  // Timeline operations
  setPlaying: (isPlaying: boolean, timelineId = 'default') => {
    if (aninodeStore.timeline[timelineId]) {
      aninodeStore.timeline[timelineId].isPlaying = isPlaying
    }
    aninodeStore.ui.isPlaying = isPlaying
  },

  setCurrentTime: (time: number, timelineId = 'default') => {
    if (aninodeStore.timeline[timelineId]) {
      aninodeStore.timeline[timelineId].currentTime = time
    }
  },

  // UI operations
  selectNode: (nodeId: string, multi = false) => {
    if (multi) {
      if (aninodeStore.ui.selectedNodeIds.includes(nodeId)) {
        aninodeStore.ui.selectedNodeIds = aninodeStore.ui.selectedNodeIds.filter(
          (id) => id !== nodeId
        )
      } else {
        aninodeStore.ui.selectedNodeIds.push(nodeId)
      }
    } else {
      aninodeStore.ui.selectedNodeIds = [nodeId]
    }
  },

  deselectAll: () => {
    aninodeStore.ui.selectedNodeIds = []
  },

  setToolMode: (mode: AninodeStore['ui']['toolMode']) => {
    aninodeStore.ui.toolMode = mode
  },

  toggleSidebar: () => {
    aninodeStore.ui.sidebarOpen = !aninodeStore.ui.sidebarOpen
  },

  setZoom: (zoom: number) => {
    aninodeStore.ui.zoom = Math.max(0.1, Math.min(3, zoom))
  },
}
