import { QualityTier } from '@/tokens'
import { GridType } from '@/ui/types'
import { proxy } from 'valtio'

/**
 * ENGINE STORE v5.1 (With Timeline Spec)
 * Strict separation between Definition (User Intent) and Runtime (Computed Reality).
 */

// --- 1. DEFINITION LAYER (Saved to disk / JSON) ---

export type Keyframe = {
  id: string
  time: number // Local time within the clip/node context
  value: any
  easing: string
}

export type TimelineTrack = {
  id: string
  type: 'layer' | 'audio' | 'marker'
  label: string
  targetId?: string // Node ID or Asset ID this track controls
  // For Audio tracks
  src?: string
  volume?: number
  muted?: boolean
  // Visuals
  color?: string
  isCollapsed?: boolean
}

export type NodeDefinition = {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  // Level 1: Static values set by user in UI
  baseProps: Record<string, any>
  
  // TIMELINE INTEGRATION
  // Each node effectively has its own "Mini-Timeline" config
  timelineConfig: {
    mode: 'linked' | 'offset' | 'independent'
    offset: number // Start time on master timeline
    duration?: number
    loop?: boolean
    keyframes: Record<string, Keyframe[]> // propName -> Keyframes
  }
}

export type ConnectionDefinition = {
  id: string
  sourceNodeId: string
  sourceProp: string
  targetNodeId: string
  targetProp: string
  // Connection visual type for cable rendering
  connectionType?: 'BEZIER' | 'DOUBLE' | 'DOTTED' | 'STEP' | 'STRAIGHT'
}

export type AssetDefinition = {
  id: string
  type: 'image' | 'video' | 'svg' | 'group'
  src: string
  name: string
  initial: {
    x: number
    y: number
    scaleX: number
    scaleY: number
    rotation: number
    opacity: number
  }
}

// --- 2. RUNTIME LAYER (Computed 60fps / Ephemeral) ---

export type ComputedNodeOutput = Record<string, number | string | boolean>

export type ComputedObjectState = {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  velocityX?: number
  velocityY?: number
}

// --- THE STORE ---

export interface EngineStore {
  // Definition: Only updated by User Interactions
  project: {
    nodes: Record<string, NodeDefinition>
    connections: Record<string, ConnectionDefinition>
    assets: Record<string, AssetDefinition>
    
    // MASTER TIMELINE DEFINITION
    timeline: {
      duration: number // Total seconds
      fps: number
      tracks: TimelineTrack[]
    }
  }

  // Runtime: Updated by AnimationEngine (GSAP Ticker)
  runtime: {
    // Level 3: Overrides
    overrides: Record<string, Record<string, any>>

    // Outputs from Signal/Logic nodes
    nodeOutputs: Record<string, ComputedNodeOutput>

    // Final World State for Renderers
    computedObjects: Record<string, ComputedObjectState>
    
    // MASTER TIMELINE RUNTIME
    timeline: {
      isPlaying: boolean
      masterTime: number // The "Playhead" position in seconds
      timeScale: number // 1 = normal, -1 = reverse
      loop: boolean
      loopRegion: { start: number; end: number } | null
    }
  }

  // UI State (from design system integration)
  ui: {
    isDarkMode: boolean
    gridType: GridType
    // Canvas state
    viewport: { x: number; y: number; zoom: number }
    selectedNodeIds: string[]
    clipboard: {
      nodes: NodeDefinition[]
      connections: ConnectionDefinition[]
    }
    // Menus
    isNodePickerOpen: boolean
    activeMenu: 'MAIN' | 'CONNECTION' | 'DISCONNECT' | 'PORT' | null
    menuData: any
    // Engine Stats display
    showEngineStats: boolean
    // History
    historyIndex: number
  }

  // Performance State (adaptive quality system)
  performance: {
    qualityTier: QualityTier
    isInteracting: boolean
    visibleNodeCount: number
    pauseVisualizers: boolean
  }

  // History snapshots (project state at each point)
  history: Array<{
    nodes: Record<string, NodeDefinition>
    connections: Record<string, ConnectionDefinition>
  }>
}

// Exporting as 'engineStore' to align with new architecture. 
// Legacy 'aninodeStore' users will need update.
export const engineStore = proxy<EngineStore>({
  project: {
    nodes: {},
    connections: {},
    assets: {},
    timeline: {
      duration: 30,
      fps: 60,
      tracks: []
    }
  },
  runtime: {
    overrides: {},
    nodeOutputs: {},
    computedObjects: {},
    timeline: {
      isPlaying: false,
      masterTime: 0,
      timeScale: 1,
      loop: true,
      loopRegion: null
    }
  },
  ui: {
    isDarkMode: true,
    gridType: 'DOTS' as GridType,
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeIds: [],
    clipboard: { nodes: [], connections: [] },
    isNodePickerOpen: false,
    activeMenu: null,
    menuData: null,
    showEngineStats: false, // Hidden by default - toggle with header button
    historyIndex: 0,
  },
  performance: {
    qualityTier: QualityTier.HIGH,
    isInteracting: false,
    visibleNodeCount: 0,
    pauseVisualizers: false,
  },
  history: [{ nodes: {}, connections: {} }],
})

export const storeActions = {
  // --- Node CRUD ---
  addNode: (node: NodeDefinition) => {
    engineStore.project.nodes[node.id] = node
    storeActions.pushHistory()
  },
  removeNode: (nodeId: string) => {
    // Before deleting, clear overrides this node was providing to other nodes
    Object.values(engineStore.project.connections).forEach(conn => {
      if (conn.sourceNodeId === nodeId && engineStore.runtime.overrides[conn.targetNodeId]) {
        // This connection's source is being deleted - clear the override
        delete engineStore.runtime.overrides[conn.targetNodeId][conn.targetProp]
      }
    })
    
    delete engineStore.project.nodes[nodeId]
    delete engineStore.runtime.overrides[nodeId]
    delete engineStore.runtime.nodeOutputs[nodeId]
    // Remove connections involving this node
    Object.keys(engineStore.project.connections).forEach(connId => {
      const conn = engineStore.project.connections[connId]
      if (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId) {
        delete engineStore.project.connections[connId]
      }
    })
    storeActions.pushHistory()
  },
  updateNodeProps: (nodeId: string, props: Record<string, any>) => {
    const node = engineStore.project.nodes[nodeId]
    if (node) {
      // Filter out any properties that have active overrides - prevents corruption
      const overrides = engineStore.runtime.overrides[nodeId]
      if (overrides) {
        const safeProps: Record<string, any> = {}
        for (const [key, value] of Object.entries(props)) {
          if (!(key in overrides)) {
            safeProps[key] = value
          }
          // Properties with active overrides are silently filtered out
        }
        Object.assign(node.baseProps, safeProps)
      } else {
        Object.assign(node.baseProps, props)
      }
    }
  },
  updateNodePosition: (nodeId: string, x: number, y: number) => {
    const node = engineStore.project.nodes[nodeId]
    if (node) {
      node.position = { x, y }
    }
  },
  updateNodeName: (nodeId: string, name: string) => {
    const node = engineStore.project.nodes[nodeId]
    if (node) {
      node.name = name
      storeActions.pushHistory()
    }
  },

  // --- Connection CRUD ---
  addConnection: (conn: ConnectionDefinition) => {
    engineStore.project.connections[conn.id] = conn
    storeActions.pushHistory()
  },
  removeConnection: (connId: string) => {
    const conn = engineStore.project.connections[connId]
    if (conn) {
      // Clear the override this connection was providing (revert to baseProps)
      if (engineStore.runtime.overrides[conn.targetNodeId]) {
        delete engineStore.runtime.overrides[conn.targetNodeId][conn.targetProp]
      }
    }
    delete engineStore.project.connections[connId]
    storeActions.pushHistory()
  },

  // --- Selection ---
  selectNode: (nodeId: string, addToSelection = false) => {
    if (addToSelection) {
      if (!engineStore.ui.selectedNodeIds.includes(nodeId)) {
        engineStore.ui.selectedNodeIds.push(nodeId)
      }
    } else {
      engineStore.ui.selectedNodeIds = [nodeId]
    }
  },
  deselectNode: (nodeId: string) => {
    engineStore.ui.selectedNodeIds = engineStore.ui.selectedNodeIds.filter(id => id !== nodeId)
  },
  clearSelection: () => {
    engineStore.ui.selectedNodeIds = []
  },
  selectMultiple: (nodeIds: string[]) => {
    engineStore.ui.selectedNodeIds = nodeIds
  },

  // --- Viewport ---
  setViewport: (viewport: { x: number; y: number; zoom: number }) => {
    engineStore.ui.viewport = viewport
  },
  pan: (dx: number, dy: number) => {
    engineStore.ui.viewport.x += dx
    engineStore.ui.viewport.y += dy
  },
  zoom: (delta: number, centerX: number, centerY: number) => {
    const oldZoom = engineStore.ui.viewport.zoom
    const newZoom = Math.min(Math.max(oldZoom + delta, 0.2), 3)
    const worldX = (centerX - engineStore.ui.viewport.x) / oldZoom
    const worldY = (centerY - engineStore.ui.viewport.y) / oldZoom
    engineStore.ui.viewport.x = centerX - worldX * newZoom
    engineStore.ui.viewport.y = centerY - worldY * newZoom
    engineStore.ui.viewport.zoom = newZoom
  },

  // --- UI State ---
  setDarkMode: (isDark: boolean) => {
    engineStore.ui.isDarkMode = isDark
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  },
  setGridType: (gridType: GridType) => {
    engineStore.ui.gridType = gridType
  },
  setNodePickerOpen: (isOpen: boolean) => {
    engineStore.ui.isNodePickerOpen = isOpen
  },
  setActiveMenu: (menu: 'MAIN' | 'CONNECTION' | 'DISCONNECT' | 'PORT' | null, data?: any) => {
    engineStore.ui.activeMenu = menu
    engineStore.ui.menuData = data ?? null
  },
  setShowEngineStats: (show: boolean) => {
    engineStore.ui.showEngineStats = show
  },

  // --- Clipboard ---
  copyNodes: (nodeIds: string[]) => {
    const nodesToCopy = nodeIds
      .map(id => engineStore.project.nodes[id])
      .filter(Boolean)
    
    // Also copy connections between selected nodes
    const connectionsToCopy = Object.values(engineStore.project.connections)
      .filter(conn => 
        nodeIds.includes(conn.sourceNodeId) && nodeIds.includes(conn.targetNodeId)
      )
    
    engineStore.ui.clipboard = {
      nodes: nodesToCopy,
      connections: connectionsToCopy,
    }
  },
  pasteNodes: (offsetX = 50, offsetY = 50) => {
    const { nodes: clipboardNodes, connections: clipboardConns } = engineStore.ui.clipboard
    if (!clipboardNodes || clipboardNodes.length === 0) return
    
    const oldToNewIdMap: Record<string, string> = {}
    const newIds: string[] = []
    
    // Create new nodes with remapped IDs
    clipboardNodes.forEach(node => {
      const typePrefix = node.type.slice(0, 3).toLowerCase()
      const newId = `${typePrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      oldToNewIdMap[node.id] = newId
      newIds.push(newId)
      
      const newNode: NodeDefinition = {
        ...node,
        id: newId,
        name: node.name + ' (Copy)',
        position: { x: node.position.x + offsetX, y: node.position.y + offsetY },
        baseProps: {
          ...node.baseProps,
          boundProps: {}, // Clear bound props on paste
        },
      }
      engineStore.project.nodes[newId] = newNode
    })
    
    // Recreate connections between pasted nodes
    clipboardConns.forEach(conn => {
      const newSourceId = oldToNewIdMap[conn.sourceNodeId]
      const newTargetId = oldToNewIdMap[conn.targetNodeId]
      
      if (newSourceId && newTargetId) {
        const newConnId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        const newConn: ConnectionDefinition = {
          ...conn,
          id: newConnId,
          sourceNodeId: newSourceId,
          targetNodeId: newTargetId,
        }
        engineStore.project.connections[newConnId] = newConn
      }
    })
    
    engineStore.ui.selectedNodeIds = newIds
    storeActions.pushHistory()
  },

  // --- History ---
  pushHistory: () => {
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(engineStore.project.nodes)),
      connections: JSON.parse(JSON.stringify(engineStore.project.connections)),
    }
    // Truncate future history if we're not at the end
    engineStore.history = engineStore.history.slice(0, engineStore.ui.historyIndex + 1)
    engineStore.history.push(snapshot)
    engineStore.ui.historyIndex = engineStore.history.length - 1
  },
  undo: () => {
    if (engineStore.ui.historyIndex > 0) {
      engineStore.ui.historyIndex--
      const snapshot = engineStore.history[engineStore.ui.historyIndex]
      engineStore.project.nodes = JSON.parse(JSON.stringify(snapshot.nodes))
      engineStore.project.connections = JSON.parse(JSON.stringify(snapshot.connections))
      // Selection preserved - don't clear selectedNodeIds
    }
  },
  redo: () => {
    if (engineStore.ui.historyIndex < engineStore.history.length - 1) {
      engineStore.ui.historyIndex++
      const snapshot = engineStore.history[engineStore.ui.historyIndex]
      engineStore.project.nodes = JSON.parse(JSON.stringify(snapshot.nodes))
      engineStore.project.connections = JSON.parse(JSON.stringify(snapshot.connections))
      // Selection preserved - don't clear selectedNodeIds
    }
  },

  // --- Timeline ---
  setPlaying: (isPlaying: boolean) => {
    engineStore.runtime.timeline.isPlaying = isPlaying
  },
}

// Legacy Compatibility (Deprecated)
// Allows unmigrated files to compile (runtime may vary)
export const aninodeStore = engineStore as unknown as any

// === DEBUGGING: Expose to window for console access ===
if (typeof window !== 'undefined') {
  (window as any).engineStore = engineStore;
  (window as any).storeActions = storeActions;
  console.log('🔧 DEBUG: engineStore and storeActions exposed to window. Try: engineStore.runtime.nodeOutputs');
}
