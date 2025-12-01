import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { aninodeStore } from '@core/store'
import { useNodeRegistration } from '@core/useNodeRegistration'

export type OpacityNodeProps = {
  id: string
  name?: string

  // Mode
  mode: 'Static' | 'Animated' | 'Controlled'

  // Static mode
  staticOpacity: number // 0-1

  // Animated mode
  animationEnabled: boolean
  startOpacity: number // 0-1
  endOpacity: number // 0-1
  duration: number // seconds
  loop: boolean
  yoyo: boolean
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

  // Preset effects
  effect: 'none' | 'fadeIn' | 'fadeOut' | 'pulse' | 'blink'
  blinkSpeed: number // blinks per second

  // Controlled mode
  inputNodeId?: string
  inputProperty?: string
  baseOpacity: number // base opacity before LFO effect
  multiplier: number
  offset: number
  clamp: boolean // clamp to 0-1
}

// Auto-mapping preset for ObjectPicker
const AUTO_MAPPING_PRESET = {
  opacity: 'opacity',
}

// Map easing names to GSAP equivalents
const GSAP_EASING_MAP: Record<string, string> = {
  linear: 'none',
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
}

export function OpacityNode({
  id,
  name = 'Opacity',
  mode = 'Static',
  staticOpacity = 1,
  animationEnabled = true,
  startOpacity = 0,
  endOpacity = 1,
  duration = 1,
  loop = false,
  yoyo = false,
  easing = 'easeInOut',
  effect = 'none',
  blinkSpeed = 2,
  inputNodeId,
  inputProperty,
  baseOpacity = 0.5,
  multiplier = 1,
  offset = 0,
  clamp = true,
}: OpacityNodeProps) {
  // Reconstruct props for registration
  const baseProps = {
    id,
    name,
    mode,
    staticOpacity,
    animationEnabled,
    startOpacity,
    endOpacity,
    duration,
    loop,
    yoyo,
    easing,
    effect,
    blinkSpeed,
    inputNodeId,
    inputProperty,
    baseOpacity,
    multiplier,
    offset,
    clamp,
  }

  // Register node
  useNodeRegistration(id, 'OpacityNode' as any, baseProps)

  // Animation state - plain object for GSAP
  const stateRef = useRef({ opacity: staticOpacity })
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const lastPublished = useRef<number>(staticOpacity)

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

  // Main opacity logic
  useEffect(() => {
    if (!id) return

    // Kill any existing tween
    if (tweenRef.current) {
      tweenRef.current.kill()
      tweenRef.current = null
    }

    // Helper: Publish opacity value
    const publishOpacity = (value: number) => {
      let finalValue = Math.round(value * 1000) / 1000
      if (clamp) {
        finalValue = Math.max(0, Math.min(1, finalValue))
      }

      if (finalValue !== lastPublished.current) {
        lastPublished.current = finalValue
        if (aninodeStore.nodes[id]) {
          aninodeStore.nodes[id].outputs.opacity = finalValue
        }
      }
    }

    // MODE 1: Static
    if (mode === 'Static') {
      stateRef.current.opacity = staticOpacity
      publishOpacity(staticOpacity)
      return
    }

    // MODE 2: Animated
    if (mode === 'Animated' && animationEnabled) {
      // Handle preset effects
      let effectStart = startOpacity
      let effectEnd = endOpacity
      let effectDuration = duration
      let effectLoop = loop
      let effectYoyo = yoyo

      switch (effect) {
        case 'fadeIn':
          effectStart = 0
          effectEnd = 1
          effectLoop = false
          effectYoyo = false
          break
        case 'fadeOut':
          effectStart = 1
          effectEnd = 0
          effectLoop = false
          effectYoyo = false
          break
        case 'pulse':
          effectStart = 0.3
          effectEnd = 1
          effectLoop = true
          effectYoyo = true
          break
        case 'blink':
          effectStart = 0
          effectEnd = 1
          effectDuration = 1 / blinkSpeed / 2
          effectLoop = true
          effectYoyo = true
          break
      }

      stateRef.current.opacity = effectStart
      const gsapEasing = GSAP_EASING_MAP[easing] || 'power2.inOut'

      tweenRef.current = gsap.to(stateRef.current, {
        opacity: effectEnd,
        duration: effectDuration,
        ease: gsapEasing,
        repeat: effectLoop ? -1 : 0,
        yoyo: effectYoyo,
        onUpdate: () => publishOpacity(stateRef.current.opacity),
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
          // Formula: baseOpacity + (inputValue * multiplier) + offset
          const result = baseOpacity + (inputValue * multiplier) + offset
          stateRef.current.opacity = result
          publishOpacity(result)
        }
      }

      updateFromInput()
      const interval = setInterval(updateFromInput, 16)

      return () => {
        clearInterval(interval)
      }
    }

    // Fallback
    publishOpacity(stateRef.current.opacity)
  }, [
    id,
    mode,
    staticOpacity,
    animationEnabled,
    startOpacity,
    endOpacity,
    duration,
    loop,
    yoyo,
    easing,
    effect,
    blinkSpeed,
    inputNodeId,
    inputProperty,
    baseOpacity,
    multiplier,
    offset,
    clamp,
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
