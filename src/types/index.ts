// Core type definitions for Aninode

export type NodeType =
  // Transform nodes
  | 'RotationNode'
  | 'ScaleNode'
  | 'PositionNode'
  // Appearance nodes
  | 'OpacityNode'
  | 'ColorNode'
  | 'DeformationNode'
  // Signal generators
  | 'LFONode'
  | 'CurveNode'
  | 'TriggerNode'
    // Physics nodes
  | 'PhysicsNode'
  // Scene control
  | 'SceneAnimatorNode'
  | 'ObjectPickerNode'
  | 'SpriteAtlasNode'
  // Advanced
  | 'PathDrawerNode'
  | 'AudioTimelineNode'
  | 'LightControllerNode'
  // Legacy (to be migrated)
  | 'SceneAnimator'
  | 'LFO'
  | 'ObjectPicker'
  | 'ScaleModifier'
  | 'LightController'
  | 'AudioTimeline'
  | 'PathDrawer'
  | 'AnimationCurveNode'

export type NodeState = {
  id: string
  type: NodeType
  name: string
  position: { x: number; y: number }
  // Level 1: Static props from UI
  baseProps: Record<string, any>
  // Level 3: Dynamic values from connections
  overrides: Record<string, any>
  // Computed outputs this node exposes
  outputs: Record<string, any>
  // Connection metadata
  connectedInputs: Record<
    string,
    {
      sourceNodeId: string
      sourceOutputName: string
    } | null
  >
}

export type Connection = {
  id: string
  sourceNodeId: string
  sourceOutput: string
  targetNodeId: string
  targetInput: string
}

export type TimelineState = {
  id: string
  isPlaying: boolean
  currentTime: number
  duration: number
  fps: number
}

export type PresetData = {
  id: string
  type: 'color' | 'easing' | 'gradient' | 'transform'
  value: any
}

export type SceneAsset = {
  id: string
  name: string
  file: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  blendMode: string
  zIndex: number
}

export type SceneData = {
  project: string
  canvas: { width: number; height: number }
  assets: SceneAsset[]
}

export type PathPoint = {
  x: number
  y: number
  hx: number // handle x offset
  hy: number // handle y offset
}

export type AnimationConfig = {
  duration: number
  loop: boolean
  yoyo: boolean
  autoRotate: boolean
  ease: string
}

export type LayerAnimData = {
  points: PathPoint[]
  config: AnimationConfig
}

export type PathData = {
  d: string
  viewBox: { x: number; y: number; width: number; height: number }
}
