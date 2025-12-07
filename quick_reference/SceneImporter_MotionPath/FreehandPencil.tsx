import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"

// Registramos GSAP Plugin
gsap.registerPlugin(MotionPathPlugin)

/**
 * --- ALGORITMOS DE GEOMETRÍA ---
 */

const getSqDist = (p1, p2) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2

const getSqSegDist = (p, p1, p2) => {
    let x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y
    if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy)
        if (t > 1) {
            x = p2.x
            y = p2.y
        } else if (t > 0) {
            x += dx * t
            y += dy * t
        }
    }
    return (p.x - x) ** 2 + (p.y - y) ** 2
}

// Ramer-Douglas-Peucker (Simplificación)
const simplifyPoints = (points, tolerance) => {
    if (points.length <= 2) return points
    const sqTolerance = tolerance * tolerance
    let maxSqDist = 0
    let index = 0

    for (let i = 1; i < points.length - 1; i++) {
        const sqDist = getSqSegDist(
            points[i],
            points[0],
            points[points.length - 1]
        )
        if (sqDist > maxSqDist) {
            index = i
            maxSqDist = sqDist
        }
    }

    if (maxSqDist > sqTolerance) {
        const left = simplifyPoints(points.slice(0, index + 1), tolerance)
        const right = simplifyPoints(points.slice(index), tolerance)
        return [...left.slice(0, -1), ...right]
    }
    return [points[0], points[points.length - 1]]
}

// Generador de Path Suave (Splines)
const getSvgPathFromPoints = (points) => {
    const len = points.length
    if (len < 2) return ""
    if (len === 2)
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < len - 1; i++) {
        const p1 = points[i]
        const mx = (p1.x + points[i + 1].x) / 2
        const my = (p1.y + points[i + 1].y) / 2
        d += ` Q ${p1.x} ${p1.y} ${mx} ${my}`
    }
    d += ` L ${points[len - 1].x} ${points[len - 1].y}`
    return d
}

/**
 * --- COMPONENTE PRINCIPAL ---
 */

export default function FreehandMotion(props) {
    // Estados de Datos
    const [rawPoints, setRawPoints] = React.useState<
        { x: number; y: number }[]
    >([])
    const [smoothing, setSmoothing] = React.useState(20) // Estado interno para el slider

    // Estados de Modo
    const [isDrawing, setIsDrawing] = React.useState(false)
    const [mode, setMode] = React.useState<"DRAWING" | "VIEW">("DRAWING")

    // Refs
    const svgRef = React.useRef<SVGSVGElement>(null)
    const pathRef = React.useRef<SVGPathElement>(null)
    const ballRef = React.useRef<SVGCircleElement>(null)
    const animationRef = React.useRef<gsap.core.Tween | null>(null)

    // --- 1. LÓGICA DE ANIMACIÓN (GSAP) ---
    React.useEffect(() => {
        if (
            mode === "VIEW" &&
            pathRef.current &&
            ballRef.current &&
            rawPoints.length > 1
        ) {
            // Matar animación previa
            if (animationRef.current) animationRef.current.kill()

            // Crear animación
            animationRef.current = gsap.to(ballRef.current, {
                motionPath: {
                    path: pathRef.current,
                    align: pathRef.current,
                    alignOrigin: [0.5, 0.5],
                    autoRotate: true,
                },
                duration: props.animDuration,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
            })
        } else {
            // Resetear si salimos de modo VIEW
            if (animationRef.current) {
                animationRef.current.kill()
                gsap.set(ballRef.current, { clearProps: "all" })
            }
        }

        return () => {
            if (animationRef.current) animationRef.current.kill()
        }
    }, [mode, rawPoints, smoothing, props.animDuration])

    // --- 2. LÓGICA DE TECLADO ---
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMode("DRAWING") // Volver a dibujar/editar
            }
            if (e.key === "Enter") {
                if (e.ctrlKey || e.metaKey) {
                    setMode("VIEW") // Activar animación
                    setIsDrawing(false)
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // --- 3. LÓGICA DE DIBUJO ---
    const getCoords = (e: React.PointerEvent) => {
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (mode === "VIEW") return // No dibujar mientras animamos
        e.preventDefault()
        e.stopPropagation()
        setIsDrawing(true)
        const { x, y } = getCoords(e)
        setRawPoints([{ x, y }]) // Reiniciar trazo
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing || mode === "VIEW") return
        const { x, y } = getCoords(e)
        setRawPoints((prev) => [...prev, { x, y }])
    }

    const handlePointerUp = () => {
        setIsDrawing(false)
    }

    // --- 4. PROCESAMIENTO DE GEOMETRÍA ---
    const processedPath = React.useMemo(() => {
        if (rawPoints.length === 0) return ""
        // Usamos el estado 'smoothing' del slider en pantalla
        const tolerance = Math.max(0.1, smoothing / 10)

        const pointsToRender =
            smoothing === 0 ? rawPoints : simplifyPoints(rawPoints, tolerance)

        return getSvgPathFromPoints(pointsToRender)
    }, [rawPoints, smoothing])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: props.bgColor,
                cursor: mode === "VIEW" ? "default" : "crosshair",
                touchAction: "none",
                position: "relative",
                overflow: "hidden",
                fontFamily: "sans-serif",
            }}
        >
            {/* --- INTERFAZ FLOTANTE (Instrucciones + Slider) --- */}
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(255,255,255,0.95)",
                    color: "#333",
                    padding: "12px",
                    borderRadius: 8,
                    fontSize: 12,
                    zIndex: 10,
                    border: "1px solid #eee",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    width: 200,
                    // Ocultar interfaz en modo animación para experiencia limpia
                    opacity: mode === "VIEW" ? 0 : 1,
                    pointerEvents: mode === "VIEW" ? "none" : "auto",
                    transition: "opacity 0.3s",
                }}
            >
                <div style={{ marginBottom: 8 }}>
                    <strong>{mode} MODE</strong>
                    <br />
                    <span style={{ color: "#666" }}>Click & Drag to draw.</span>
                    <br />
                    <span style={{ color: "#09F" }}>
                        CTRL + ENTER to Animate
                    </span>
                </div>

                <hr
                    style={{
                        border: "0",
                        borderTop: "1px solid #eee",
                        margin: "8px 0",
                    }}
                />

                {/* SLIDER DE SUAVIZADO */}
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <label style={{ fontWeight: 500 }}>Smoothing</label>
                        <span style={{ color: "#888" }}>{smoothing}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={smoothing}
                        onPointerDown={(e) => e.stopPropagation()} // Evitar dibujar al mover slider
                        onChange={(e) => setSmoothing(Number(e.target.value))}
                        style={{ width: "100%", cursor: "pointer" }}
                    />
                </div>
            </div>

            {/* Botón pequeño para salir de View Mode si no saben la tecla */}
            {mode === "VIEW" && (
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        zIndex: 10,
                    }}
                >
                    Playing • Press ESC to Edit
                </div>
            )}

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ display: "block" }}
            >
                {/* PATH DEL DIBUJO */}
                <path
                    ref={pathRef}
                    d={processedPath}
                    stroke={props.strokeColor}
                    strokeWidth={props.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* BOLA ANIMADA */}
                <circle
                    ref={ballRef}
                    r={props.ballSize}
                    fill={props.ballColor}
                    style={{
                        display:
                            mode === "VIEW" && rawPoints.length > 0
                                ? "block"
                                : "none",
                    }}
                />
            </svg>

            {/* Botón Clear (Solo en modo Drawing) */}
            {mode === "DRAWING" && (
                <button
                    onClick={() => setRawPoints([])}
                    style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#333",
                    }}
                >
                    Clear Canvas
                </button>
            )}
        </div>
    )
}

addPropertyControls(FreehandMotion, {
    strokeColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#333",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke",
        defaultValue: 3,
        min: 1,
        max: 20,
    },
    bgColor: { type: ControlType.Color, title: "Bg", defaultValue: "#f9f9f9" },
    ballColor: {
        type: ControlType.Color,
        title: "Ball",
        defaultValue: "#FF0055",
    },
    ballSize: { type: ControlType.Number, title: "Ball Size", defaultValue: 6 },
    animDuration: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 3,
        min: 0.5,
        max: 20,
    },
})
