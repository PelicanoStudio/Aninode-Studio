import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"

gsap.registerPlugin(MotionPathPlugin)

type Point = {
    x: number
    y: number
    hx: number
    hy: number
}

type ToolMode = "DRAWING" | "EDITING" | "VIEW"

type DragTarget = {
    index: number
    type: "ANCHOR" | "HANDLE"
} | null

export default function MotionPathPenUltimate(props) {
    // --- ESTADOS ---
    const [points, setPoints] = React.useState<Point[]>([])
    const [mode, setMode] = React.useState<ToolMode>("DRAWING")
    const [isClosed, setIsClosed] = React.useState(false)

    // Interacción
    const [dragTarget, setDragTarget] = React.useState<DragTarget>(null)
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [isCreatingCurve, setIsCreatingCurve] = React.useState(false)

    // NUEVO: Posición del cursor para el "Preview"
    const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 })

    const svgRef = React.useRef<SVGSVGElement>(null)
    const pathRef = React.useRef<SVGPathElement>(null)
    const ballRef = React.useRef<SVGCircleElement>(null)
    const animationRef = React.useRef<gsap.core.Tween | null>(null)

    // --- GSAP ANIMATION ---
    React.useEffect(() => {
        if (
            mode === "VIEW" &&
            pathRef.current &&
            ballRef.current &&
            points.length > 1
        ) {
            if (animationRef.current) animationRef.current.kill()

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
            if (animationRef.current) {
                animationRef.current.kill()
                gsap.set(ballRef.current, { clearProps: "all" })
            }
        }
        return () => {
            if (animationRef.current) animationRef.current.kill()
        }
    }, [mode, points, props.animDuration])

    // --- MATH UTILS ---
    const getCoords = (e: React.PointerEvent) => {
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
    }

    const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

    const applyAngleConstraint = (dx: number, dy: number) => {
        const angle = Math.atan2(dy, dx)
        const length = Math.sqrt(dx * dx + dy * dy)
        const snap = Math.PI / 4
        const snappedAngle = Math.round(angle / snap) * snap
        return {
            x: Math.cos(snappedAngle) * length,
            y: Math.sin(snappedAngle) * length,
        }
    }

    // --- TECLADO ---
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMode("EDITING")

            if (e.key === "Enter") {
                if (e.ctrlKey || e.metaKey) {
                    // CTRL + ENTER -> ANIMAR
                    setMode("VIEW")
                    setDragTarget(null)
                    setIsCreatingCurve(false)
                } else {
                    // ENTER -> FINALIZAR DIBUJO
                    if (mode === "DRAWING") {
                        setMode("EDITING")
                        setDragTarget(null)
                        setIsCreatingCurve(false)
                    }
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [mode])

    // --- PUNTERO ---
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault()
        const { x, y } = getCoords(e)
        setCursorPos({ x, y }) // Actualizar cursor al clickear

        if (mode === "VIEW") return

        // DRAWING
        if (mode === "DRAWING") {
            // Cerrar path
            if (points.length > 2) {
                const dToStart = dist(x, y, points[0].x, points[0].y)
                if (dToStart < 15) {
                    setIsClosed(true)
                    setMode("EDITING")
                    return
                }
            }
            // Nuevo punto
            const newPoint = { x, y, hx: 0, hy: 0 }
            setPoints([...points, newPoint])
            setDragTarget({ index: points.length, type: "HANDLE" })
            setIsCreatingCurve(true)
            return
        }

        // EDITING
        if (mode === "EDITING") {
            for (let i = 0; i < points.length; i++) {
                const p = points[i]
                // Check Handle
                if (p.hx !== 0 || p.hy !== 0) {
                    const hxPos = p.x + p.hx
                    const hyPos = p.y + p.hy
                    const hxNeg = p.x - p.hx
                    const hyNeg = p.y - p.hy
                    if (
                        dist(x, y, hxPos, hyPos) < 10 ||
                        dist(x, y, hxNeg, hyNeg) < 10
                    ) {
                        setDragTarget({ index: i, type: "HANDLE" })
                        return
                    }
                }
                // Check Anchor
                if (dist(x, y, p.x, p.y) < 10) {
                    setDragTarget({ index: i, type: "ANCHOR" })
                    return
                }
            }
        }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        const { x, y } = getCoords(e)
        setCursorPos({ x, y }) // SIEMPRE actualizamos cursor para el preview

        // Hover logic
        if (!dragTarget) {
            let foundHover = null
            if (mode === "DRAWING" && points.length > 0) {
                // Detectar si vamos a cerrar el path
                if (dist(x, y, points[0].x, points[0].y) < 15) foundHover = 0
            }
            if (mode === "EDITING") {
                points.forEach((p, i) => {
                    if (dist(x, y, p.x, p.y) < 10) foundHover = i
                })
            }
            setHoverIndex(foundHover)
        }

        // Drag logic
        if (dragTarget) {
            const { index, type } = dragTarget
            const currentP = points[index]
            const updatedPoints = [...points]

            if (type === "ANCHOR") {
                updatedPoints[index] = { ...currentP, x, y }
            } else if (type === "HANDLE") {
                // Lógica invertida (Illustrator style)
                let dx = x - currentP.x
                let dy = y - currentP.y

                if (e.shiftKey) {
                    const constrained = applyAngleConstraint(dx, dy)
                    dx = constrained.x
                    dy = constrained.y
                }
                updatedPoints[index] = { ...currentP, hx: dx, hy: dy }
            }
            setPoints(updatedPoints)
        }
    }

    const handlePointerUp = () => {
        setDragTarget(null)
        setIsCreatingCurve(false)
    }

    // --- PATH GENERATION ---

    // El path final confirmado
    const generatePath = () => {
        if (points.length === 0) return ""
        let d = `M ${points[0].x} ${points[0].y}`
        const loopLength = isClosed ? points.length + 1 : points.length

        for (let i = 1; i < loopLength; i++) {
            const currIdx = i % points.length
            const prevIdx = (i - 1) % points.length
            const p1 = points[prevIdx]
            const p2 = points[currIdx]

            const cp1x = p1.x + p1.hx
            const cp1y = p1.y + p1.hy
            const cp2x = p2.x - p2.hx
            const cp2y = p2.y - p2.hy

            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
        }
        if (isClosed) d += " Z"
        return d
    }

    // NUEVO: El path de "Preview" (Línea fantasma)
    const generatePreviewPath = () => {
        // Solo mostrar si estamos dibujando, hay al menos un punto y NO estamos arrastrando (creando curva)
        if (mode !== "DRAWING" || points.length === 0 || isCreatingCurve)
            return ""

        const lastP = points[points.length - 1]

        // Destino: Si estamos haciendo hover sobre el inicio, el destino es el inicio (cerrar)
        // Si no, el destino es el cursor mouse
        const targetX =
            hoverIndex === 0 && points.length > 2 ? points[0].x : cursorPos.x
        const targetY =
            hoverIndex === 0 && points.length > 2 ? points[0].y : cursorPos.y

        // Inicio del path
        let d = `M ${lastP.x} ${lastP.y}`

        // Si el último punto tiene handles, dibujamos curva suave hacia el mouse
        if (lastP.hx !== 0 || lastP.hy !== 0) {
            const cp1x = lastP.x + lastP.hx
            const cp1y = lastP.y + lastP.hy
            // Usamos el target como segundo control point para una aproximación visual simple
            d += ` C ${cp1x} ${cp1y}, ${targetX} ${targetY}, ${targetX} ${targetY}`
        } else {
            // Si no, línea recta
            d += ` L ${targetX} ${targetY}`
        }

        return d
    }

    const getCursor = () => {
        if (mode === "VIEW") return "default"
        if (dragTarget) return "grabbing"
        if (hoverIndex !== null && mode === "EDITING") return "grab"
        if (hoverIndex === 0 && mode === "DRAWING") return "pointer"
        if (mode === "DRAWING") return "crosshair"
        return "default"
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: props.bgColor,
                position: "relative",
                overflow: "hidden",
                cursor: getCursor(),
            }}
        >
            {/* UI de Instrucciones */}
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(0,0,0,0.8)",
                    color: "white",
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    pointerEvents: "none",
                    zIndex: 10,
                    fontFamily: "sans-serif",
                }}
            >
                <strong style={{ color: "#09F" }}>{mode}</strong>
                {mode === "DRAWING" && " • Click/Drag • ENTER: Done"}
                {mode === "EDITING" && " • Adjust • CTRL+ENTER: Play"}
                {mode === "VIEW" && " • ESC: Edit"}
            </div>

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ display: "block", userSelect: "none" }}
            >
                {/* 1. PREVIEW PATH (Línea gris/fantasma) */}
                <path
                    d={generatePreviewPath()}
                    stroke={props.strokeColor}
                    strokeWidth={1}
                    strokeDasharray="4 4" // Línea punteada para diferenciar
                    fill="none"
                    opacity={0.5}
                    pointerEvents="none"
                />

                {/* 2. PATH REAL */}
                <path
                    ref={pathRef}
                    id="motionPath"
                    d={generatePath()}
                    stroke={props.strokeColor}
                    strokeWidth={props.strokeWidth}
                    fill={props.fillColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* 3. OBJETO (BOLA) */}
                <circle
                    ref={ballRef}
                    r={props.ballSize}
                    fill={props.ballColor}
                    style={{
                        display:
                            mode === "VIEW" && points.length > 0
                                ? "block"
                                : "none",
                    }}
                />

                {/* 4. UI DE EDICIÓN (Puntos y Handles) */}
                {mode !== "VIEW" &&
                    points.map((p, i) => (
                        <g key={i}>
                            {(p.hx !== 0 || p.hy !== 0) && (
                                <g opacity={0.4}>
                                    <line
                                        x1={p.x}
                                        y1={p.y}
                                        x2={p.x + p.hx}
                                        y2={p.y + p.hy}
                                        stroke="#09F"
                                        strokeWidth={1}
                                    />
                                    <line
                                        x1={p.x}
                                        y1={p.y}
                                        x2={p.x - p.hx}
                                        y2={p.y - p.hy}
                                        stroke="#09F"
                                        strokeWidth={1}
                                    />
                                    <circle
                                        cx={p.x + p.hx}
                                        cy={p.y + p.hy}
                                        r={3}
                                        fill="#09F"
                                    />
                                    <circle
                                        cx={p.x - p.hx}
                                        cy={p.y - p.hy}
                                        r={3}
                                        fill="#09F"
                                    />
                                </g>
                            )}
                            <rect
                                x={p.x - 4}
                                y={p.y - 4}
                                width={8}
                                height={8}
                                fill="white"
                                stroke="#000"
                                strokeWidth={1}
                                style={{
                                    stroke: hoverIndex === i ? "#09F" : "#000",
                                }}
                            />
                            {i === 0 &&
                                mode === "DRAWING" &&
                                hoverIndex === 0 &&
                                points.length > 2 && (
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={12}
                                        fill="none"
                                        stroke="#09F"
                                        strokeWidth={2}
                                    />
                                )}
                        </g>
                    ))}
            </svg>
        </div>
    )
}

addPropertyControls(MotionPathPenUltimate, {
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#333",
    },
    strokeWidth: { type: ControlType.Number, title: "Width", defaultValue: 2 },
    fillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "rgba(0,0,0,0)",
    },
    bgColor: { type: ControlType.Color, title: "Bg", defaultValue: "#f0f0f0" },
    ballColor: {
        type: ControlType.Color,
        title: "Ball",
        defaultValue: "#FF0055",
    },
    ballSize: { type: ControlType.Number, title: "Ball Size", defaultValue: 8 },
    animDuration: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.1,
    },
})
