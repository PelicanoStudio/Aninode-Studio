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
}

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
})