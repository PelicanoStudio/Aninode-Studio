import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export type ScaleNodeProps = {
  id: string
  name?: string

  // Mode
  mode: 'Static' | 'Animated' | 'Controlled'

  // Uniform vs Non-uniform scaling
  uniform: boolean

  // Static mode
  staticScaleX: number // 1 = 100%
  staticScaleY: number

  // Animated mode
  animationEnabled: boolean
  startScaleX: number
  startScaleY: number
  endScaleX: number
  endScaleY: number
  duration: number // seconds
  loop: boolean
  yoyo: boolean // ping-pong
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring'

  // Controlled mode
  inputNodeId?: string
  inputProperty?: string
  baseScale: number // base scale value before LFO effect
  multiplier: number
  offset: number

  // Transform origin
  anchorX: number // 0-100 (percentage)
  anchorY: number // 0-100 (percentage)
}

// Auto-mapping preset for ObjectPicker
const AUTO_MAPPING_PRESET = {
  scaleX: 'scaleX',
  scaleY: 'scaleY',
  anchorX: 'scaleAnchorX',
  anchorY: 'scaleAnchorY',
}

// Map easing names to GSAP equivalents
const GSAP_EASING_MAP: Record<string, string> = {
  linear: 'none',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  spring: 'elastic.out(1, 0.3)',
}

export function ScaleNode({
  id,
  name = 'Scale',
  mode = 'Static',
  uniform = true,
  staticScaleX = 1,
  staticScaleY = 1,
  animationEnabled = true,
  startScaleX = 1,
  startScaleY = 1,
  endScaleX = 1.5,
  endScaleY = 1.5,
  duration = 1,
  loop = false,
  yoyo = true,
  easing = 'easeInOut',
  inputNodeId,
  inputProperty,
  baseScale = 1,
  multiplier = 1,
  offset = 0,
  anchorX = 50,
  anchorY = 50,
}: ScaleNodeProps) {
  // Reconstruct props for registration
  const baseProps = {
    id,
    name,
    mode,
    uniform,
    staticScaleX,
    staticScaleY,
    animationEnabled,
    startScaleX,
    startScaleY,
    endScaleX,
    endScaleY,
    duration,
    loop,
    yoyo,
    easing,
    inputNodeId,
    inputProperty,
    baseScale,
    multiplier,
    offset,
    anchorX,
    anchorY,
  }

  // Register node
  useNodeRegistration(id, 'ScaleNode' as any, baseProps)

  // Animation state - plain object for GSAP
  const stateRef = useRef({ scaleX: staticScaleX, scaleY: staticScaleY })
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const lastPublishedX = useRef<number>(staticScaleX)
  const lastPublishedY = useRef<number>(staticScaleY)

  // Publish auto-mapping preset
  useEffect(() => {
    if (!id) return

    const registerPreset = () => {
      if (aninodeStore.nodes[id]) {
        aninodeStore.nodes[id].outputs.__autoMappingPreset = AUTO_MAPPING_PRESET
      } else {
        setTimeout(registerPreset, 10)
      }
    }

    registerPreset()

    return () => {
      if (aninodeStore.nodes[id]?.outputs) {
        delete aninodeStore.nodes[id].outputs.__autoMappingPreset
      }
    }
  }, [id])

  // Main scale logic
  useEffect(() => {
    if (!id) return

    // Kill any existing tween
    if (tweenRef.current) {
      tweenRef.current.kill()
      tweenRef.current = null
    }

    // Helper: Publish scale values (with anti-jitter)
    const publishScale = (x: number, y: number) => {
      const roundedX = Math.round(x * 1000) / 1000
      const roundedY = Math.round(y * 1000) / 1000

      if (roundedX !== lastPublishedX.current || roundedY !== lastPublishedY.current) {
        lastPublishedX.current = roundedX
        lastPublishedY.current = roundedY

        if (aninodeStore.nodes[id]) {
          aninodeStore.nodes[id].outputs.scaleX = roundedX
          aninodeStore.nodes[id].outputs.scaleY = roundedY
          aninodeStore.nodes[id].outputs.anchorX = anchorX
          aninodeStore.nodes[id].outputs.anchorY = anchorY
        }
      }
    }

    // MODE 1: Static
    if (mode === 'Static') {
      const finalY = uniform ? staticScaleX : staticScaleY
      stateRef.current.scaleX = staticScaleX
      stateRef.current.scaleY = finalY
      publishScale(staticScaleX, finalY)
      return
    }

    // MODE 2: Animated
    if (mode === 'Animated' && animationEnabled) {
      const finalStartY = uniform ? startScaleX : startScaleY
      const finalEndY = uniform ? endScaleX : endScaleY

      stateRef.current.scaleX = startScaleX
      stateRef.current.scaleY = finalStartY

      const gsapEasing = GSAP_EASING_MAP[easing] || 'power2.inOut'

      tweenRef.current = gsap.to(stateRef.current, {
        scaleX: endScaleX,
        scaleY: finalEndY,
        duration: duration,
        ease: gsapEasing,
        repeat: loop ? -1 : 0,
        yoyo: yoyo,
        onUpdate: () => publishScale(stateRef.current.scaleX, stateRef.current.scaleY),
      })

      return () => {
        if (tweenRef.current) {
          tweenRef.current.kill()
          tweenRef.current = null
        }
      }
    }

    // MODE 3: Controlled
    if (mode === 'Controlled' && inputNodeId && inputProperty) {
      const updateFromInput = () => {
        const inputNode = aninodeStore.nodes[inputNodeId]
        if (!inputNode) return

        const inputValue = inputNode.outputs[inputProperty]
        if (inputValue !== undefined) {
          // Formula: baseScale + (inputValue * multiplier) + offset
          const result = baseScale + (inputValue * multiplier) + offset
          stateRef.current.scaleX = result
          stateRef.current.scaleY = uniform ? result : result
          publishScale(result, uniform ? result : result)
        }
      }

      updateFromInput()
      const interval = setInterval(updateFromInput, 16)

      return () => {
        clearInterval(interval)
      }
    }

    // Fallback
    publishScale(stateRef.current.scaleX, stateRef.current.scaleY)
  }, [
    id,
    mode,
    uniform,
    staticScaleX,
    staticScaleY,
    animationEnabled,
    startScaleX,
    startScaleY,
    endScaleX,
    endScaleY,
    duration,
    loop,
    yoyo,
    easing,
    inputNodeId,
    inputProperty,
    baseScale,
    multiplier,
    offset,
    anchorX,
    anchorY,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill()
      }
    }
  }, [])

  return null
}
