import React, { useState, useRef, useEffect, useCallback } from "react"
import { Frame, addPropertyControls, ControlType, useMotionValue } from "framer"

// --- Constantes de Configuración ---
const TRACK_HEIGHT = 70
const TRACK_PADDING = 10
const CLIP_HEIGHT = TRACK_HEIGHT - TRACK_PADDING * 2 // 50px
const WAVEFORM_HEIGHT = 35
const NAME_BAR_HEIGHT = 15
const GRID_STEP_PX = 12.5
const TRACK_LINE_COLOR = "rgba(0, 0, 0, 0.2)"
const HANDLE_WIDTH = 10
const WAVEFORM_COLOR = "rgba(255, 255, 255, 0.5)"

// --- Estilos ---
const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
    position: "relative",
}

const transportContainerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    pointerEvents: "none",
    backgroundColor: "transparent",
}

const playPauseButtonStyle: React.CSSProperties = {
    position: "relative",
    width: 80,
    height: 30,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    pointerEvents: "auto",
}

const stopButtonStyle: React.CSSProperties = {
    ...playPauseButtonStyle,
    width: 50,
    backgroundColor: "#555",
}

const timelineStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: "#222",
    overflow: "auto",
    position: "relative",
    cursor: "text",
    backgroundImage: `
        repeating-linear-gradient(
            to right,
            rgba(255, 255, 255, 0.05) 0px,
            rgba(255, 255, 255, 0.05) 1px,
            transparent 1px,
            transparent ${GRID_STEP_PX}px
        ),
        repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent ${TRACK_HEIGHT - 1}px,
            ${TRACK_LINE_COLOR} ${TRACK_HEIGHT - 1}px,
            ${TRACK_LINE_COLOR} ${TRACK_HEIGHT}px
        )
    `,
}

const clipStyle: React.CSSProperties = {
    height: CLIP_HEIGHT,
    borderRadius: 4,
    overflow: "visible",
    boxSizing: "border-box",
    position: "absolute",
    cursor: "grab",
    border: "1px solid #000",
}

const nameBarStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: NAME_BAR_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
    display: "flex", // <-- Clave para la repetición
    alignItems: "center",
    zIndex: 2,
    pointerEvents: "none",
}

const nameTextStyle: React.CSSProperties = {
    color: "white",
    fontSize: "10px",
    paddingLeft: 24,
    whiteSpace: "nowrap",
    flexShrink: 0, // <-- Clave para la repetición
}

// ✅ NUEVO Estilo para el texto repetido
const repeatingNameTextStyle: React.CSSProperties = {
    color: "white",
    fontSize: "10px",
    whiteSpace: "nowrap",
    flexShrink: 0, // <-- Clave para la repetición
    opacity: 0.7, // Un poco más sutil
    display: "flex",
    alignItems: "center",
}

// Estilo para el divisor '|'
const divisorStyle: React.CSSProperties = {
    paddingLeft: 10, // Espacio
    paddingRight: 10,
    opacity: 0.5,
}

const deleteClipStyle: React.CSSProperties = {
    position: "absolute",
    top: 4,
    left: 4,
    width: 16,
    height: 16,
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    zIndex: 15,
}

const playheadStyle: React.CSSProperties = {
    position: "absolute",
    width: 2,
    height: 9999,
    backgroundColor: "red",
    left: 0,
    top: 0,
    zIndex: 100,
    transform: "translateX(0px)",
    willChange: "transform",
    pointerEvents: "none",
}

const dropZoneStyle: React.CSSProperties = {
    // ... (sin cambios)
    width: "90%",
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#777",
    border: "2px dashed #555",
    borderRadius: 8,
    textAlign: "center",
    fontSize: "14px",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
}

const handleStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    width: HANDLE_WIDTH,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    cursor: "ew-resize",
    zIndex: 10,
}

// --- SUB-COMPONENTE: Handle de Recorte ---
function ClipHandle({ side, onTrim, snapToGrid, pixelsPerSecond, clip }) {
    // ... (Sin cambios)
    const dragStartPos = useRef(0)
    const x = useMotionValue(0)

    const handleDragStart = (event) => {
        event.stopPropagation()
        dragStartPos.current = 0
        x.set(0)
    }

    const handleDragEnd = (event, info) => {
        event.stopPropagation()
        let deltaPx = info.offset.x
        const { left, right } = constraints

        if (deltaPx <= left) {
            deltaPx = left
        } else if (deltaPx >= right) {
            deltaPx = right
        } else if (snapToGrid) {
            deltaPx = Math.round(deltaPx / GRID_STEP_PX) * GRID_STEP_PX
        }

        const deltaSeconds = deltaPx / pixelsPerSecond
        onTrim(side, deltaSeconds)
        x.set(0)
    }

    let constraints = {}
    if (side === "left") {
        const leftLimitPx = (0 - clip.trimStart) * pixelsPerSecond
        const rightLimitPx =
            (clip.trimEnd - clip.trimStart - 0.1) * pixelsPerSecond
        constraints = { left: leftLimitPx, right: rightLimitPx }
    } else {
        const leftLimitPx =
            -(clip.trimEnd - clip.trimStart - 0.1) * pixelsPerSecond
        const rightLimitPx = (clip.duration - clip.trimEnd) * pixelsPerSecond
        constraints = { left: leftLimitPx, right: rightLimitPx }
    }

    return (
        <Frame
            style={{
                ...handleStyle,
                [side]: 0,
            }}
            drag="x"
            dragElastic={0}
            dragMomentum={false}
            dragConstraints={constraints}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            x={x}
        />
    )
}

// ==========================================================
// --- COMPONENTE HIJO 'Clip' ---
// ==========================================================
function ClipComponent({
    clip,
    pixelsPerSecond,
    snapToGrid,
    isSelected,
    onSelect,
    onUpdateClip,
    onDelete,
}) {
    const x = useMotionValue(clip.startTime * pixelsPerSecond)
    const y = useMotionValue(clip.top)
    const dragStartPos = useRef({ x: 0, y: 0 })
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // --- Sincronización de Movimiento (sin cambios) ---
    useEffect(() => {
        x.set(clip.startTime * pixelsPerSecond)
    }, [clip.startTime, pixelsPerSecond])

    useEffect(() => {
        y.set(clip.top)
    }, [clip.top])

    // --- Lógica de Arrastre (sin cambios) ---
    const handleDragStart = (event) => {
        onSelect()
        dragStartPos.current = { x: x.get(), y: y.get() }
    }

    const handleDragEnd = (event, info) => {
        const startX = dragStartPos.current.x
        const startY = dragStartPos.current.y
        const offsetX = info.offset.x
        const offsetY = info.offset.y
        const finalRawX = startX + offsetX
        const finalRawY = startY + offsetY

        let finalX = Math.max(0, finalRawX)
        let finalY = Math.max(TRACK_PADDING, finalRawY)

        if (snapToGrid) {
            finalX = Math.round(finalX / GRID_STEP_PX) * GRID_STEP_PX
        }
        const trackIndex = Math.round((finalY - TRACK_PADDING) / TRACK_HEIGHT)
        finalY = trackIndex * TRACK_HEIGHT + TRACK_PADDING

        x.set(finalX)
        y.set(finalY)

        onUpdateClip(clip.id, {
            startTime: finalX / pixelsPerSecond,
            top: finalY,
        })
    }

    // --- Lógica de Recorte (sin cambios) ---
    const handleTrim = (side, deltaSeconds) => {
        onSelect()
        if (side === "left") {
            const newStartTime = clip.startTime + deltaSeconds
            const newTrimStart = clip.trimStart + deltaSeconds
            if (
                newStartTime >= 0 &&
                newTrimStart >= 0 &&
                newTrimStart < clip.trimEnd
            ) {
                onUpdateClip(clip.id, {
                    startTime: newStartTime,
                    trimStart: newTrimStart,
                })
            }
        } else if (side === "right") {
            const newTrimEnd = clip.trimEnd + deltaSeconds
            if (newTrimEnd > clip.trimStart && newTrimEnd <= clip.duration) {
                onUpdateClip(clip.id, { trimEnd: newTrimEnd })
            }
        }
    }

    // --- Cálculo de Ancho (sin cambios) ---
    const clipVisibleDuration = clip.trimEnd - clip.trimStart
    const clipWidth = clipVisibleDuration * pixelsPerSecond

    // --- Hook de Efecto para Dibujar la Onda (sin cambios) ---
    useEffect(() => {
        if (!canvasRef.current || !clip.audioBuffer || clipWidth <= 0) {
            return
        }

        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(clipWidth * dpr)
        canvas.height = Math.round(WAVEFORM_HEIGHT * dpr)
        canvas.style.width = `${clipWidth}px`
        canvas.style.height = `${WAVEFORM_HEIGHT}px`
        context.scale(dpr, dpr)

        const width = clipWidth
        const height = WAVEFORM_HEIGHT
        const middleY = height / 2

        const audioData = clip.audioBuffer.getChannelData(0)
        const sampleRate = clip.audioBuffer.sampleRate

        const startSample = Math.floor(clip.trimStart * sampleRate)
        const endSample = Math.floor(clip.trimEnd * sampleRate)
        const totalVisibleSamples = endSample - startSample
        const samplesPerPixel = totalVisibleSamples / width

        context.clearRect(0, 0, width, height)
        context.beginPath()
        context.strokeStyle = WAVEFORM_COLOR
        context.lineWidth = 1

        for (let i = 0; i < width; i++) {
            const chunkStart = startSample + Math.floor(i * samplesPerPixel)
            const chunkEnd = startSample + Math.floor((i + 1) * samplesPerPixel)

            if (chunkStart >= audioData.length) break

            let min = 1.0
            let max = -1.0

            for (let j = chunkStart; j < chunkEnd; j++) {
                const sample = audioData[j]
                if (sample < min) min = sample
                if (sample > max) max = sample
            }

            const y_max = (max * 0.8 + 1) * middleY
            const y_min = (min * 0.8 + 1) * middleY

            context.moveTo(i + 0.5, y_min)
            context.lineTo(i + 0.5, y_max)
        }

        context.stroke()
    }, [clip.audioBuffer, clipWidth, clip.trimStart, clip.trimEnd])

    return (
        <Frame
            key={clip.id}
            width={clipWidth}
            height={CLIP_HEIGHT}
            backgroundColor={clip.color}
            style={{
                ...clipStyle,
                x,
                y,
                border: isSelected ? "2px solid #0099FF" : "1px solid #000",
                boxShadow: isSelected ? "0 0 10px rgba(0,153,255,0.5)" : "none",
            }}
            drag={true}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onPointerDown={onSelect}
            title={clip.name}
        >
            {/* --- El Canvas para la onda de sonido --- */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: WAVEFORM_HEIGHT,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            />

            {/* ✅ --- La Barra de Nombre (con repetición) --- */}
            <div style={nameBarStyle}>
                <span style={nameTextStyle}>{clip.name}</span>

                {/* Un número alto y fijo de repeticiones. 
                    'overflow: hidden' en el padre se encarga
                    de la performance. */}
                {Array(20)
                    .fill(0)
                    .map((_, index) => (
                        <span key={index} style={repeatingNameTextStyle}>
                            <span style={divisorStyle}>|</span>
                            {clip.name}
                        </span>
                    ))}
            </div>

            {/* --- Handles de Recorte --- */}
            <ClipHandle
                side="left"
                onTrim={handleTrim}
                snapToGrid={snapToGrid}
                pixelsPerSecond={pixelsPerSecond}
                clip={clip}
            />
            <ClipHandle
                side="right"
                onTrim={handleTrim}
                snapToGrid={snapToGrid}
                pixelsPerSecond={pixelsPerSecond}
                clip={clip}
            />

            {/* --- Botón (X) Fijo --- */}
            <Frame
                style={deleteClipStyle}
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(clip.id)
                }}
                whileHover={{ scale: 1.2 }}
            >
                X
            </Frame>
        </Frame>
    )
}

// ==========================================================
// --- COMPONENTE PADRE 'AudioTimeline' ---
// (Sin cambios)
// ==========================================================
export function AudioTimeline(props) {
    const { pixelsPerSecond, snapToGrid } = props

    // --- ESTADOS ---
    const [clips, setClips] = useState([])
    const [idCounter, setIdCounter] = useState(0)
    const [selectedClipId, setSelectedClipId] = useState(null)
    const [playbackState, setPlaybackState] = useState("stopped")

    // --- REFS ---
    const audioContextRef = useRef(null)
    const activeSourcesRef = useRef([])
    const startTimeRef = useRef(0)
    const pauseTimeRef = useRef(0)
    const animationFrameRef = useRef(null)
    const playheadRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)

    // --- Función segura para obtener el AudioContext ---
    const getAudioContext = () => {
        if (typeof window === "undefined") return null
        if (audioContextRef.current) {
            audioContextRef.current.resume()
            return audioContextRef.current
        }
        audioContextRef.current = new window.AudioContext()
        audioContextRef.current.resume()
        return audioContextRef.current
    }

    // --- LÓGICA DE DRAG & DROP ---
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
    }
    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault()
        const audioContext = getAudioContext()
        if (!audioContext) return

        const files = event.dataTransfer.files
        if (files.length === 0) return

        for (const file of Array.from(files)) {
            if (file.type.startsWith("audio/")) {
                try {
                    const arrayBuffer = await file.arrayBuffer()
                    const audioBuffer =
                        await audioContext.decodeAudioData(arrayBuffer)

                    const newClip = {
                        id: idCounter,
                        name: file.name,
                        top: clips.length * TRACK_HEIGHT + TRACK_PADDING,
                        color: `#${Math.floor(
                            Math.random() * 16777215
                        ).toString(16)}`,
                        audioBuffer: audioBuffer,
                        duration: audioBuffer.duration,
                        startTime: 0,
                        trimStart: 0,
                        trimEnd: audioBuffer.duration,
                    }

                    setClips((prevClips) => [...prevClips, newClip])
                    setIdCounter((prev) => prev + 1)
                } catch (e) {
                    console.error("Error decodificando el archivo de audio:", e)
                }
            }
        }
    }

    // --- LÓGICA DE CLIPS ---
    const updateClip = (id, changes) => {
        setClips((prevClips) =>
            prevClips.map((c) => {
                if (c.id === id) {
                    return { ...c, ...changes }
                }
                return c
            })
        )
    }

    // --- LÓGICA DE REPRODUCCIÓN (ENVUELTA EN useCallback) ---
    const stopAllAudio = useCallback((resetTime = false) => {
        cancelAnimationFrame(animationFrameRef.current)
        activeSourcesRef.current.forEach((source) => {
            try {
                source.stop()
            } catch (e) {}
        })
        activeSourcesRef.current = []

        if (resetTime) {
            pauseTimeRef.current = 0
            if (playheadRef.current) {
                playheadRef.current.style.transform = "translateX(0px)"
            }
        }
    }, [])

    const deleteClip = useCallback(
        (id) => {
            stopAllAudio(true)
            setClips((prevClips) => prevClips.filter((c) => c.id !== id))
            setSelectedClipId(null)
        },
        [stopAllAudio]
    )

    const animatePlayhead = () => {
        if (audioContextRef.current && playheadRef.current) {
            const elapsedTime =
                audioContextRef.current.currentTime - startTimeRef.current
            pauseTimeRef.current = elapsedTime
            const newLeft = elapsedTime * pixelsPerSecond
            playheadRef.current.style.transform = `translateX(${newLeft}px)`
        }
        animationFrameRef.current = requestAnimationFrame(animatePlayhead)
    }

    const playAllAudio = useCallback(
        (startTime = pauseTimeRef.current) => {
            const audioContext = getAudioContext()
            if (!audioContext) return

            stopAllAudio(false)
            startTimeRef.current = audioContext.currentTime - startTime

            const newSources = clips
                .map((clip) => {
                    const source = audioContext.createBufferSource()
                    source.buffer = clip.audioBuffer
                    source.connect(audioContext.destination)

                    const clipStartTime = clip.startTime
                    const clipTrimStart = clip.trimStart
                    const clipTrimEnd = clip.trimEnd

                    let playTime = startTimeRef.current + clipStartTime
                    let audioOffset = clipTrimStart
                    let duration = clipTrimEnd - clipTrimStart

                    if (startTime > clipStartTime) {
                        const offsetInClip = startTime - clipStartTime
                        if (offsetInClip > duration) {
                            return null
                        }
                        playTime = audioContext.currentTime
                        audioOffset = clipTrimStart + offsetInClip
                        duration = duration - offsetInClip
                    }

                    if (duration > 0) {
                        source.start(playTime, audioOffset, duration)
                        return source
                    }
                    return null
                })
                .filter(Boolean)

            activeSourcesRef.current = newSources
            animatePlayhead()
            setPlaybackState("playing")
        },
        [clips, pixelsPerSecond, stopAllAudio]
    )

    const handlePlayPause = useCallback(() => {
        if (playbackState === "playing") {
            stopAllAudio(false)
            setPlaybackState("paused")
        } else {
            playAllAudio()
        }
    }, [playbackState, playAllAudio, stopAllAudio])

    const handleStop = useCallback(() => {
        stopAllAudio(true)
        setPlaybackState("stopped")
    }, [stopAllAudio])

    // --- LÓGICA DE SCRUBBING (Clic en Timeline) ---
    const handleTimelineClick = (event) => {
        if (event.target !== timelineRef.current) {
            return
        }

        const rect = event.target.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const scrollX = event.target.scrollLeft
        const newX = clickX + scrollX

        const newTime = newX / pixelsPerSecond
        if (newTime < 0) return

        pauseTimeRef.current = newTime

        if (playheadRef.current) {
            playheadRef.current.style.transform = `translateX(${newX}px)`
        }

        setSelectedClipId(null)

        if (playbackState === "playing") {
            stopAllAudio(false)
            playAllAudio(newTime)
        } else {
            setPlaybackState("paused")
        }
    }

    // --- LÓGICA DE TECLADO (BARRA ESPACIADORA Y SUPR) ---
    const handleKeyDown = useCallback(
        (event) => {
            if (
                event.target.tagName === "INPUT" ||
                event.target.tagName === "TEXTAREA"
            ) {
                return
            }

            if (event.key === " ") {
                event.preventDefault()
                handlePlayPause()
            }

            if (event.key === "Delete" || event.key === "Backspace") {
                if (selectedClipId !== null) {
                    event.preventDefault()
                    deleteClip(selectedClipId)
                }
            }
        },
        [selectedClipId, deleteClip, handlePlayPause]
    )

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [handleKeyDown])

    // --- EFECTO DE LIMPIEZA ---
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            activeSourcesRef.current.forEach((source) => {
                try {
                    source.stop()
                } catch (e) {}
            })
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    // --- RENDERIZADO (JSX) ---
    return (
        <Frame style={containerStyle}>
            <Frame
                ref={timelineRef}
                style={timelineStyle}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleTimelineClick}
            >
                {clips.map((clip) => (
                    <ClipComponent
                        key={clip.id}
                        clip={clip}
                        pixelsPerSecond={pixelsPerSecond}
                        snapToGrid={snapToGrid}
                        isSelected={clip.id === selectedClipId}
                        onSelect={() => setSelectedClipId(clip.id)}
                        onUpdateClip={updateClip}
                        onDelete={deleteClip}
                    />
                ))}

                {clips.length === 0 && (
                    <div style={dropZoneStyle}>
                        Arrastra tus archivos de audio aquí
                    </div>
                )}

                <Frame style={playheadStyle} ref={playheadRef} />
            </Frame>

            <Frame style={transportContainerStyle}>
                <Frame
                    style={{
                        ...playPauseButtonStyle,
                        backgroundColor:
                            playbackState === "playing" ? "#F44336" : "#4CAF50",
                    }}
                    onClick={handlePlayPause}
                    whileTap={{ scale: 0.95 }}
                >
                    {playbackState === "playing" ? "PAUSE" : "PLAY"}
                </Frame>

                <Frame
                    style={stopButtonStyle}
                    onClick={handleStop}
                    whileTap={{ scale: 0.95 }}
                >
                    STOP
                </Frame>
            </Frame>
        </Frame>
    )
}

// --- Configuración para el panel derecho ---
addPropertyControls(AudioTimeline, {
    pixelsPerSecond: {
        type: ControlType.Number,
        title: "Zoom (px/s)",
        defaultValue: 20,
        min: 5,
        max: 200,
        step: 5,
    },
    snapToGrid: {
        type: ControlType.Boolean,
        title: "Snap to Grid",
        defaultValue: true,
    },
})

// Valores por defecto
AudioTimeline.defaultProps = {
    width: 600,
    height: 300,
    pixelsPerSecond: 20,
    snapToGrid: true,
}
