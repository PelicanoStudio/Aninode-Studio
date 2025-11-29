import { useEffect, useRef } from 'react'
import { useMotionValue, animate } from 'framer-motion'
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

  // Animation state
  const scaleX = useMotionValue(staticScaleX)
  const scaleY = useMotionValue(staticScaleY)
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

  // Get easing function
  const getEasing = () => {
    switch (easing) {
      case 'linear':
        return 'linear'
      case 'easeIn':
        return 'easeIn'
      case 'easeOut':
        return 'easeOut'
      case 'easeInOut':
        return 'easeInOut'
      case 'spring':
        return { type: 'spring', stiffness: 300, damping: 20 }
      default:
        return 'easeInOut'
    }
  }

  // Main scale logic
  useEffect(() => {
    if (!id) return

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
      scaleX.set(staticScaleX)
      scaleY.set(finalY)
      publishScale(staticScaleX, finalY)
      return
    }

    // MODE 2: Animated
    if (mode === 'Animated' && animationEnabled) {
      const finalStartY = uniform ? startScaleX : startScaleY
      const finalEndY = uniform ? endScaleX : endScaleY

      scaleX.set(startScaleX)
      scaleY.set(finalStartY)

      const easingValue = getEasing()

      const controlsX = animate(scaleX, endScaleX, {
        duration,
        ease: typeof easingValue === 'string' ? easingValue : undefined,
        ...(typeof easingValue === 'object' ? easingValue : {}),
        repeat: loop ? Infinity : 0,
        repeatType: yoyo ? 'reverse' : 'loop',
        onUpdate: (latestX) => {
          publishScale(latestX, scaleY.get())
        },
      })

      const controlsY = animate(scaleY, finalEndY, {
        duration,
        ease: typeof easingValue === 'string' ? easingValue : undefined,
        ...(typeof easingValue === 'object' ? easingValue : {}),
        repeat: loop ? Infinity : 0,
        repeatType: yoyo ? 'reverse' : 'loop',
        onUpdate: (latestY) => {
          publishScale(scaleX.get(), latestY)
        },
      })

      return () => {
        controlsX.stop()
        controlsY.stop()
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
          scaleX.set(result)
          scaleY.set(uniform ? result : result)
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
    publishScale(scaleX.get(), scaleY.get())
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

  return null
}
