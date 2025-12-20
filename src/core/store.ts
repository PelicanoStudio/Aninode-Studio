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
    clipboard: NodeDefinition[]
    // Menus
    isNodePickerOpen: boolean
    activeMenu: 'MAIN' | 'CONNECTION' | 'DISCONNECT' | 'PORT' | null
    menuData: any
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
    clipboard: [],
    isNodePickerOpen: false,
    activeMenu: null,
    menuData: null,
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
      Object.assign(node.baseProps, props)
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

  // --- Clipboard ---
  copyNodes: (nodeIds: string[]) => {
    engineStore.ui.clipboard = nodeIds
      .map(id => engineStore.project.nodes[id])
      .filter(Boolean)
  },
  pasteNodes: (offsetX = 50, offsetY = 50) => {
    const newIds: string[] = []
    engineStore.ui.clipboard.forEach(node => {
      const newId = `n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newNode: NodeDefinition = {
        ...node,
        id: newId,
        name: node.name + ' (Copy)',
        position: { x: node.position.x + offsetX, y: node.position.y + offsetY },
      }
      engineStore.project.nodes[newId] = newNode
      newIds.push(newId)
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
      engineStore.ui.selectedNodeIds = []
    }
  },
  redo: () => {
    if (engineStore.ui.historyIndex < engineStore.history.length - 1) {
      engineStore.ui.historyIndex++
      const snapshot = engineStore.history[engineStore.ui.historyIndex]
      engineStore.project.nodes = JSON.parse(JSON.stringify(snapshot.nodes))
      engineStore.project.connections = JSON.parse(JSON.stringify(snapshot.connections))
      engineStore.ui.selectedNodeIds = []
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
