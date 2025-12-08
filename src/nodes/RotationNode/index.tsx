import { useNodeRegistration } from '@core/useNodeRegistration'

export type RotationNodeProps = {
  id: string
  name?: string
  mode: 'Static' | 'Animated' | 'Controlled'
  staticAngle: number
  animationEnabled: boolean
  startAngle: number
  endAngle: number
  speed: number
  direction: 'CW' | 'CCW'
  continuous: boolean
  duration: number
  loop: boolean
  yoyo: boolean
  inputNodeId?: string
  inputProperty?: string
  multiplier: number
  offset: number
  anchorX: number
  anchorY: number
}

export function RotationNode(props: RotationNodeProps) {
  const { id } = props

  // Passive Registration Only
  // The engine (AnimationEngine) will read these props from the store
  // and handle the logic (Static vs Animated vs Controlled).
  useNodeRegistration(id, 'RotationNode', props)

  return null
}
