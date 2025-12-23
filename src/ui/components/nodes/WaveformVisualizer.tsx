/**
 * WAVEFORM VISUALIZER
 * 
 * Animated canvas-based waveform preview for LFO/Oscillator nodes.
 * All styling comes from tokens.
 */

import {
    calculateWaveformY,
    getWaveformColor,
    waveformLayout,
    WaveformType,
} from '@/tokens'
import React, { useCallback, useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  waveform: WaveformType
  frequency: number
  amplitude: number
  phase: number
  min: number
  max: number
  isDarkMode: boolean
  width?: number
  enabled?: boolean // Stop animation when false
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  waveform,
  frequency,
  amplitude,
  phase,
  min,
  max,
  isDarkMode,
  width = 220,
  enabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { height, padding, gridLineCount, strokeWidth, resolution } = waveformLayout
    const canvasWidth = width
    const canvasHeight = height

    // Clear
    ctx.fillStyle = getWaveformColor('background', isDarkMode)
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const innerWidth = canvasWidth - padding * 2
    const innerHeight = canvasHeight - padding * 2

    // Draw grid lines (soft, behind wave)
    ctx.strokeStyle = getWaveformColor('gridMinMax', isDarkMode)
    ctx.lineWidth = strokeWidth.grid
    
    for (let i = 0; i <= gridLineCount; i++) {
      const y = padding + (innerHeight / gridLineCount) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvasWidth - padding, y)
      ctx.stroke()
    }

    // Draw min/max guide lines (dashed)
    
    ctx.strokeStyle = getWaveformColor('gridMinMax', isDarkMode)
    ctx.lineWidth = strokeWidth.minMaxGuide
    ctx.setLineDash([3, 3])
    
    // Min line (bottom)
    ctx.beginPath()
    ctx.moveTo(padding, padding + innerHeight)
    ctx.lineTo(canvasWidth - padding, padding + innerHeight)
    ctx.stroke()
    
    // Max line (top)
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(canvasWidth - padding, padding)
    ctx.stroke()
    
    ctx.setLineDash([])

    // Draw zero line
    const zeroY = padding + innerHeight * (1 - (0 - min) / (max - min || 1))
    if (zeroY > padding && zeroY < canvasHeight - padding) {
      ctx.strokeStyle = getWaveformColor('zero', isDarkMode)
      ctx.lineWidth = strokeWidth.zero
      ctx.beginPath()
      ctx.moveTo(padding, zeroY)
      ctx.lineTo(canvasWidth - padding, zeroY)
      ctx.stroke()
    }

    // Draw waveform (dimmed if disabled)
    const waveColor = getWaveformColor('wave', isDarkMode)
    ctx.strokeStyle = enabled ? waveColor : (isDarkMode ? '#444' : '#ccc')
    ctx.lineWidth = strokeWidth.wave
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    const cyclesVisible = 2 // Show 2 cycles of the waveform
    const timeOffset = timeRef.current

    for (let i = 0; i <= resolution; i++) {
      const x = padding + (innerWidth / resolution) * i
      const t = (i / resolution) * cyclesVisible + timeOffset
      
      const value = calculateWaveformY(waveform, t, min, max, amplitude, phase)
      
      // Map value to canvas Y (inverted because canvas Y goes down)
      const normalizedValue = (value - min) / (max - min || 1)
      const y = padding + innerHeight * (1 - normalizedValue)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.stroke()

    // Only animate if enabled
    if (enabled) {
      // Update time for animation
      timeRef.current += 0.02 * frequency
      // Continue animation
      animationRef.current = requestAnimationFrame(draw)
    }
  }, [waveform, frequency, amplitude, phase, min, max, isDarkMode, width, enabled])

  useEffect(() => {
    draw()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={waveformLayout.height}
      className="rounded border"
      style={{
        borderColor: getWaveformColor('grid', isDarkMode),
        display: 'block',
        width: '100%',
        height: waveformLayout.height,
        opacity: enabled ? 1 : 0.5, // Dim when disabled
      }}
    />
  )
}
