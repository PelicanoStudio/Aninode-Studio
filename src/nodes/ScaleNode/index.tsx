import { useNodeRegistration } from '@core/useNodeRegistration'

export type ScaleNodeProps = {
  id: string
  name?: string
  mode: 'Static' | 'Animated' | 'Controlled'
  uniform: boolean
  staticScaleX: number
  staticScaleY: number
  animationEnabled: boolean
  startScaleX: number
  startScaleY: number
  endScaleX: number
  endScaleY: number
  duration: number
  loop: boolean
  yoyo: boolean
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring'
  inputNodeId?: string
  inputProperty?: string
  baseScale: number
  multiplier: number
  offset: number
  anchorX: number
  anchorY: number
}

export function ScaleNode(props: ScaleNodeProps) {
  const { id } = props

  // Passive Registration Only
  useNodeRegistration(id, 'ScaleNode', props)

  return null
}
