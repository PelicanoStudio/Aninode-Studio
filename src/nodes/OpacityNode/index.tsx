import { useNodeRegistration } from '@core/useNodeRegistration'

export type OpacityNodeProps = {
  id: string
  name?: string
  mode: 'Static' | 'Animated' | 'Controlled'
  staticOpacity: number
  animationEnabled: boolean
  startOpacity: number
  endOpacity: number
  duration: number
  loop: boolean
  yoyo: boolean
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  effect: 'none' | 'fadeIn' | 'fadeOut' | 'pulse' | 'blink'
  blinkSpeed: number
  inputNodeId?: string
  inputProperty?: string
  baseOpacity: number
  multiplier: number
  offset: number
  clamp: boolean
}

export function OpacityNode(props: OpacityNodeProps) {
  const { id } = props

  // Passive Registration Only
  useNodeRegistration(id, 'OpacityNode', props)

  return null
}
