import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// --- IMPORTS CDN (ESM) ---
// @ts-ignore
import { gsap } from "https://esm.sh/gsap"
// @ts-ignore
import { MotionPathPlugin } from "https://esm.sh/gsap/MotionPathPlugin"

gsap.registerPlugin(MotionPathPlugin)

// --- TIPOS ---
type AssetData = {
    id: number
    name: string
    file: string
    x: number
    y: number
    width: number
    height: number
    opacity: number
    blendMode: string
    zIndex: number
}

type SceneData = {
    project: string
    canvas: { width: number; height: number }
    assets: AssetData[]
}

type Point = { x: number; y: number; hx: number; hy: number }
type DragTarget = { index: number; type: "ANCHOR" | "HANDLE" } | null

// Configuración de Animación por Capa
type AnimConfig = {
    duration: number
    loop: boolean
    yoyo: boolean // Mirror Loop
    autoRotate: boolean // Girar con el camino
    ease: string // "power1.inOut", "linear", "elastic", etc.
}

// Estructura para guardar datos de la capa
type LayerAnimData = {
    points: Point[]
    config: AnimConfig
}

// Configuración por defecto
const DEFAULT_CONFIG: AnimConfig = {
    duration: 5,
    loop: true,
    yoyo: true,
    autoRotate: true,
    ease: "power1.inOut",
}

// --- ESTILOS ---
const styles = {
    container: {
        width: "100%",
        height: "100%",
        background: "#111",
        display: "block",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        color: "white",
        position: "relative" as "relative",
        touchAction: "none",
        userSelect: "none" as "none",
    } as React.CSSProperties,

    sidebar: (isOpen: boolean) =>
        ({
            position: "absolute" as "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "260px",
            background: "rgba(20, 20, 20, 0.85)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column" as "column",
            zIndex: 200,
            transform: isOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
            boxShadow: "5px 0 30px rgba(0,0,0,0.5)",
        }) as React.CSSProperties,

    // NUEVO: Panel Derecho de Propiedades
    rightPanel: (isVisible: boolean) =>
        ({
            position: "absolute" as "absolute",
            top: 20,
            right: 20,
            width: "240px",
            background: "rgba(30, 30, 30, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column" as "column",
            gap: "12px",
            zIndex: 200,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateX(0)" : "translateX(20px)",
            pointerEvents: isVisible ? "all" : "none",
            transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }) as React.CSSProperties,

    toggleButton: {
        position: "absolute" as "absolute",
        left: "10px",
        top: "10px",
        zIndex: 201,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "white",
        borderRadius: "6px",
        padding: "8px 12px",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
    } as React.CSSProperties,

    // Botón Toggle Canvas Clip
    clipButton: (isActive: boolean) =>
        ({
            position: "absolute" as "absolute",
            right: "20px",
            top: "20px",
            zIndex: 100,
            background: isActive ? "#007AFF" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            fontSize: "18px",
        }) as React.CSSProperties,

    header: {
        padding: "20px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
    } as React.CSSProperties,
    layerList: {
        flex: 1,
        overflowY: "auto" as "auto",
        padding: "10px",
    } as React.CSSProperties,

    layerItem: (isActive: boolean) => ({
        padding: "10px 12px",
        borderRadius: "6px",
        background: isActive ? "rgba(0, 122, 255, 0.3)" : "transparent",
        border: isActive
            ? "1px solid rgba(0, 122, 255, 0.5)"
            : "1px solid transparent",
        color: isActive ? "white" : "#aaa",
        cursor: "pointer",
        fontSize: "13px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "4px",
        transition: "all 0.2s",
    }),

    viewport: {
        width: "100%",
        height: "100%",
        position: "relative" as "relative",
        zIndex: 1,
        overflow: "hidden",
    } as React.CSSProperties,

    artboard: (w: number, h: number, scale: number, clip: boolean) =>
        ({
            width: w,
            height: h,
            background: "#1a1a1a",
            position: "absolute" as "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            border: "1px dashed rgba(255,255,255,0.3)",
            // TOGGLE DE RECORTE
            overflow: clip ? "hidden" : "visible",
            transition: "overflow 0s", // Instantáneo
        }) as React.CSSProperties,

    actionButton: {
        width: "100%",
        padding: "12px",
        background: "#007AFF",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: 600,
        marginTop: "10px",
        fontSize: "12px",
    } as React.CSSProperties,

    // Estilos Controles Panel Derecho
    controlGroup: {
        display: "flex",
        flexDirection: "column" as "column",
        gap: "6px",
    } as React.CSSProperties,
    label: {
        fontSize: "11px",
        color: "#888",
        fontWeight: 500,
        textTransform: "uppercase" as "uppercase",
    } as React.CSSProperties,
    input: {
        background: "#222",
        border: "1px solid #444",
        padding: "6px",
        borderRadius: "4px",
        color: "white",
        fontSize: "12px",
    } as React.CSSProperties,
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    } as React.CSSProperties,
    switch: (active: boolean) =>
        ({
            width: "32px",
            height: "18px",
            background: active ? "#34C759" : "#444",
            borderRadius: "10px",
            position: "relative" as "relative",
            cursor: "pointer",
            transition: "background 0.2s",
        }) as React.CSSProperties,
    knob: (active: boolean) =>
        ({
            width: "14px",
            height: "14px",
            background: "white",
            borderRadius: "50%",
            position: "absolute" as "absolute",
            top: "2px",
            left: active ? "16px" : "2px",
            transition: "left 0.2s",
        }) as React.CSSProperties,
}

export default function WebEngineProV4(props) {
    const [sceneData, setSceneData] = React.useState<SceneData | null>(null)
    const [images, setImages] = React.useState<Record<string, string>>({})

    // Estados UI
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
    const [scale, setScale] = React.useState(1)
    const [selectedLayerId, setSelectedLayerId] = React.useState<number | null>(
        null
    )
    const [toolMode, setToolMode] = React.useState<"SELECT" | "DRAW">("SELECT")
    const [isPlaying, setIsPlaying] = React.useState(false)

    // SOLICITUD 2: Toggle Recorte
    const [clipCanvas, setClipCanvas] = React.useState(false)

    // Datos de Animación (Puntos + Config)
    const [layerAnims, setLayerAnims] = React.useState<
        Record<number, LayerAnimData>
    >({})

    // Estado Temporal para Edición (Lo que se ve en el panel derecho antes de guardar)
    const [currentPoints, setCurrentPoints] = React.useState<Point[]>([])
    const [currentConfig, setCurrentConfig] =
        React.useState<AnimConfig>(DEFAULT_CONFIG)

    const [dragTarget, setDragTarget] = React.useState<DragTarget>(null)
    const [hoverPointIndex, setHoverPointIndex] = React.useState<number | null>(
        null
    )

    const viewportRef = React.useRef<HTMLDivElement>(null)
    const artboardRef = React.useRef<HTMLDivElement>(null)

    // Carga
    const loadProject = async () => {
        try {
            const handle = await window.showDirectoryPicker()
            const fileHandle = await handle.getFileHandle("data.json")
            const file = await fileHandle.getFile()
            const text = await file.text()
            const json = JSON.parse(text) as SceneData
            const assetsMap: Record<string, string> = {}
            for (const asset of json.assets) {
                try {
                    const imgHandle = await handle.getFileHandle(asset.file)
                    const imgFile = await imgHandle.getFile()
                    assetsMap[asset.file] = URL.createObjectURL(imgFile)
                } catch (e) {
                    console.warn(`Missing: ${asset.file}`)
                }
            }
            setSceneData(json)
            setImages(assetsMap)
        } catch (err) {
            console.error(err)
        }
    }

    // Escala
    React.useEffect(() => {
        if (!sceneData || !viewportRef.current) return
        const updateScale = () => {
            const vp = viewportRef.current!.getBoundingClientRect()
            const margin = 80
            const sW = (vp.width - margin) / sceneData.canvas.width
            const sH = (vp.height - margin) / sceneData.canvas.height
            setScale(Math.min(sW, sH))
        }
        updateScale()
        window.addEventListener("resize", updateScale)
        return () => window.removeEventListener("resize", updateScale)
    }, [sceneData, isSidebarOpen])

    // Teclado
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (selectedLayerId === null) return

            // P -> Toggle Modo Dibujo
            if (e.key.toLowerCase() === "p") {
                setToolMode((prev) => {
                    if (prev === "SELECT") {
                        // Al entrar a editar, cargamos los datos existentes o defaults
                        const existing = layerAnims[selectedLayerId]
                        setCurrentPoints(existing ? existing.points : [])
                        setCurrentConfig(
                            existing ? existing.config : DEFAULT_CONFIG
                        )
                        return "DRAW"
                    }
                    return "SELECT"
                })
            }

            // Enter -> Guardar y Salir
            if (e.key === "Enter" && toolMode === "DRAW") {
                // Guardamos Puntos + Configuración del Panel
                setLayerAnims((prev) => ({
                    ...prev,
                    [selectedLayerId]: {
                        points: currentPoints,
                        config: currentConfig,
                    },
                }))
                setToolMode("SELECT")
                setDragTarget(null)
            }

            // Esc -> Cancelar
            if (e.key === "Escape") {
                setToolMode("SELECT")
                setDragTarget(null)
            }

            // Espacio -> Play/Pause
            if (e.code === "Space" && toolMode !== "DRAW") {
                e.preventDefault() // Evitar scroll
                setIsPlaying((p) => !p)
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [selectedLayerId, toolMode, currentPoints, layerAnims, currentConfig]) // Dependencias actualizadas

    // --- LOGICA PUNTERO ---
    const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

    const getCoords = (e: React.PointerEvent) => {
        const rect = artboardRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale,
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (toolMode !== "DRAW") return
        e.stopPropagation()
        e.preventDefault()
        const { x, y } = getCoords(e)

        // Si el click es en el Panel Derecho, no dibujar (aunque stopPropagation debería bastar)
        // Check simple distance logic for points
        for (let i = 0; i < currentPoints.length; i++) {
            const p = currentPoints[i]
            if (p.hx !== 0 || p.hy !== 0) {
                if (dist(x, y, p.x + p.hx, p.y + p.hy) < 15 / scale) {
                    setDragTarget({ index: i, type: "HANDLE" })
                    return
                }
                if (dist(x, y, p.x - p.hx, p.y - p.hy) < 15 / scale) {
                    setDragTarget({ index: i, type: "HANDLE" })
                    return
                }
            }
            if (dist(x, y, p.x, p.y) < 15 / scale) {
                setDragTarget({ index: i, type: "ANCHOR" })
                return
            }
        }

        let newP = { x, y, hx: 0, hy: 0 }
        if (
            currentPoints.length === 0 &&
            selectedLayerId !== null &&
            sceneData
        ) {
            const asset = sceneData.assets.find((a) => a.id === selectedLayerId)
            if (asset) {
                newP.x = asset.x + asset.width / 2
                newP.y = asset.y + asset.height / 2
            }
        }

        const updated = [...currentPoints, newP]
        setCurrentPoints(updated)
        setDragTarget({ index: updated.length - 1, type: "HANDLE" })
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (toolMode !== "DRAW") return
        const { x, y } = getCoords(e)
        if (!dragTarget) {
            let found = null
            currentPoints.forEach((p, i) => {
                if (dist(x, y, p.x, p.y) < 15 / scale) found = i
            })
            setHoverPointIndex(found)
            return
        }
        const { index, type } = dragTarget
        const p = currentPoints[index]
        const newPoints = [...currentPoints]
        if (type === "ANCHOR") {
            newPoints[index] = { ...p, x, y }
        } else if (type === "HANDLE") {
            let dx = -(x - p.x)
            let dy = -(y - p.y)
            newPoints[index] = { ...p, hx: dx, hy: dy }
        }
        setCurrentPoints(newPoints)
    }
    const handlePointerUp = () => {
        setDragTarget(null)
    }

    const generatePathString = (pts: Point[]) => {
        if (pts.length === 0) return ""
        let d = `M ${pts[0].x} ${pts[0].y}`
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1]
            const curr = pts[i]
            const cp1x = prev.x - prev.hx
            const cp1y = prev.y - prev.hy
            const cp2x = curr.x + curr.hx
            const cp2y = curr.y + curr.hy
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
        }
        return d
    }

    // SOLICITUD 1: Cursor Global
    // Aplicamos el cursor al container padre
    const cursorStyle =
        toolMode === "DRAW"
            ? dragTarget
                ? "grabbing"
                : hoverPointIndex !== null
                  ? "grab"
                  : "crosshair"
            : "default"

    return (
        <div
            style={{ ...styles.container, cursor: cursorStyle }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Botón Toggle Sidebar */}
            <button
                style={{
                    ...styles.toggleButton,
                    transform: isSidebarOpen
                        ? "translateX(260px)"
                        : "translateX(0)",
                    transition: "transform 0.3s",
                }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? "◀" : "▶"}
            </button>

            {/* SOLICITUD 2: Botón Toggle Recorte (Clip Canvas) */}
            {sceneData && (
                <button
                    style={styles.clipButton(clipCanvas)}
                    onClick={() => setClipCanvas(!clipCanvas)}
                    title="Alternar Recorte de Lienzo"
                >
                    {clipCanvas ? "📺" : "👁️"}
                </button>
            )}

            {/* PANEL IZQUIERDO (LISTA CAPAS) */}
            <div style={styles.sidebar(isSidebarOpen)}>
                <div style={styles.header}>
                    <h3
                        style={{
                            margin: "0 0 10px 0",
                            fontSize: "14px",
                            letterSpacing: "1px",
                        }}
                    >
                        SCENE EDITOR
                    </h3>
                    {!sceneData ? (
                        <button
                            style={styles.actionButton}
                            onClick={loadProject}
                        >
                            ABRIR PROYECTO
                        </button>
                    ) : (
                        <>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#888",
                                    marginBottom: "10px",
                                }}
                            >
                                {sceneData.canvas.width} x{" "}
                                {sceneData.canvas.height} px
                            </div>
                            <button
                                style={{
                                    ...styles.actionButton,
                                    background: isPlaying
                                        ? "#FF3B30"
                                        : "#34C759",
                                }}
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? "PAUSAR" : "REPRODUCIR"}
                            </button>
                        </>
                    )}
                </div>
                <div style={styles.layerList}>
                    {sceneData?.assets
                        .sort((a, b) => b.zIndex - a.zIndex)
                        .map((asset) => (
                            <div
                                key={asset.id}
                                style={styles.layerItem(
                                    selectedLayerId === asset.id
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (toolMode !== "DRAW")
                                        setSelectedLayerId(asset.id)
                                }}
                            >
                                <span>{asset.name}</span>
                                {layerAnims[asset.id] && (
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            background: "white",
                                            color: "black",
                                            padding: "2px 4px",
                                            borderRadius: "2px",
                                        }}
                                    >
                                        PATH
                                    </span>
                                )}
                            </div>
                        ))}
                </div>
                <div
                    style={{
                        padding: "20px",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        fontSize: "11px",
                        color: "#888",
                    }}
                >
                    {toolMode === "DRAW" ? (
                        <div style={{ color: "#007AFF" }}>
                            <strong>MODO EDICIÓN</strong>
                            <br />
                            Dibuja la ruta y configura las propiedades a la
                            derecha.
                            <br />
                            <strong>Enter</strong> para guardar.
                        </div>
                    ) : (
                        <div>
                            Selecciona capa y presiona <strong>'P'</strong>.
                        </div>
                    )}
                </div>
            </div>

            {/* SOLICITUD 3: PANEL DERECHO (PROPIEDADES ANIMACIÓN) */}
            {/* Solo aparece en modo DRAW y atrapa eventos para no dibujar al clickearlo */}
            <div
                style={styles.rightPanel(toolMode === "DRAW")}
                onPointerDown={(e) => e.stopPropagation()} // Evitar poner puntos al hacer click aqui
            >
                <h4
                    style={{
                        margin: "0 0 10px 0",
                        fontSize: "12px",
                        borderBottom: "1px solid #444",
                        paddingBottom: "8px",
                    }}
                >
                    ANIMACIÓN
                </h4>

                {/* Velocidad */}
                <div style={styles.controlGroup}>
                    <div style={styles.row}>
                        <span style={styles.label}>Duración (s)</span>
                        <span style={styles.label}>
                            {currentConfig.duration}s
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={currentConfig.duration}
                        onChange={(e) =>
                            setCurrentConfig({
                                ...currentConfig,
                                duration: parseFloat(e.target.value),
                            })
                        }
                    />
                </div>

                {/* Easing */}
                <div style={styles.controlGroup}>
                    <span style={styles.label}>Cadencia (Ease)</span>
                    <select
                        style={styles.input}
                        value={currentConfig.ease}
                        onChange={(e) =>
                            setCurrentConfig({
                                ...currentConfig,
                                ease: e.target.value,
                            })
                        }
                    >
                        <option value="none">Lineal</option>
                        <option value="power1.inOut">Suave (Power1)</option>
                        <option value="power2.inOut">Normal (Power2)</option>
                        <option value="elastic.out(1, 0.3)">Elástico</option>
                        <option value="bounce.out">Rebote</option>
                        <option value="steps(5)">Pasos (Steps)</option>
                    </select>
                </div>

                {/* Loop */}
                <div style={styles.row}>
                    <span style={styles.label}>Loop Infinito</span>
                    <div
                        style={styles.switch(currentConfig.loop)}
                        onClick={() =>
                            setCurrentConfig({
                                ...currentConfig,
                                loop: !currentConfig.loop,
                            })
                        }
                    >
                        <div style={styles.knob(currentConfig.loop)} />
                    </div>
                </div>

                {/* Mirror */}
                <div style={styles.row} title="Va y viene (PingPong)">
                    <span style={styles.label}>Mirror (Yoyo)</span>
                    <div
                        style={styles.switch(currentConfig.yoyo)}
                        onClick={() =>
                            setCurrentConfig({
                                ...currentConfig,
                                yoyo: !currentConfig.yoyo,
                            })
                        }
                    >
                        <div style={styles.knob(currentConfig.yoyo)} />
                    </div>
                </div>

                {/* Auto Rotate */}
                <div style={styles.row} title="Girar segun la curva">
                    <span style={styles.label}>Orientar al camino</span>
                    <div
                        style={styles.switch(currentConfig.autoRotate)}
                        onClick={() =>
                            setCurrentConfig({
                                ...currentConfig,
                                autoRotate: !currentConfig.autoRotate,
                            })
                        }
                    >
                        <div style={styles.knob(currentConfig.autoRotate)} />
                    </div>
                </div>

                <div
                    style={{
                        marginTop: "10px",
                        fontSize: "10px",
                        color: "#666",
                        textAlign: "center",
                    }}
                >
                    Presiona ENTER para guardar
                </div>
            </div>

            {/* CANVAS */}
            <div style={styles.viewport} ref={viewportRef}>
                {sceneData && (
                    <div
                        ref={artboardRef}
                        style={styles.artboard(
                            sceneData.canvas.width,
                            sceneData.canvas.height,
                            scale,
                            clipCanvas
                        )}
                    >
                        {sceneData.assets.map((asset) => (
                            <LayerComponent
                                key={asset.id}
                                asset={asset}
                                imageUrl={images[asset.file]}
                                isSelected={selectedLayerId === asset.id}
                                animData={layerAnims[asset.id]} // Pasamos Data Completa
                                isPlaying={isPlaying}
                                generatePathString={generatePathString}
                            />
                        ))}

                        {/* SVG DIBUJO EDITOR */}
                        {toolMode === "DRAW" && (
                            <svg
                                style={{
                                    position: "absolute",
                                    top: -50000,
                                    left: -50000,
                                    width: "100000px",
                                    height: "100000px",
                                    pointerEvents: "none",
                                    zIndex: 9999,
                                    overflow: "visible",
                                }}
                            >
                                <g transform="translate(50000, 50000)">
                                    <path
                                        d={generatePathString(currentPoints)}
                                        stroke="#007AFF"
                                        strokeWidth={2 / scale}
                                        fill="none"
                                    />
                                    {currentPoints.map((p, i) => (
                                        <g key={i}>
                                            {(p.hx !== 0 || p.hy !== 0) && (
                                                <g opacity={0.6}>
                                                    <line
                                                        x1={p.x}
                                                        y1={p.y}
                                                        x2={p.x - p.hx}
                                                        y2={p.y - p.hy}
                                                        stroke="#007AFF"
                                                        strokeWidth={1 / scale}
                                                    />
                                                    <line
                                                        x1={p.x}
                                                        y1={p.y}
                                                        x2={p.x + p.hx}
                                                        y2={p.y + p.hy}
                                                        stroke="#007AFF"
                                                        strokeWidth={1 / scale}
                                                    />
                                                    <circle
                                                        cx={p.x - p.hx}
                                                        cy={p.y - p.hy}
                                                        r={3 / scale}
                                                        fill="#007AFF"
                                                    />
                                                    <circle
                                                        cx={p.x + p.hx}
                                                        cy={p.y + p.hy}
                                                        r={3 / scale}
                                                        fill="#007AFF"
                                                    />
                                                </g>
                                            )}
                                            <rect
                                                x={p.x - 4 / scale}
                                                y={p.y - 4 / scale}
                                                width={8 / scale}
                                                height={8 / scale}
                                                fill="white"
                                                stroke="#007AFF"
                                                strokeWidth={1 / scale}
                                            />
                                        </g>
                                    ))}
                                </g>
                            </svg>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- COMPONENTE DE CAPA ---
function LayerComponent({
    asset,
    imageUrl,
    isSelected,
    animData,
    isPlaying,
    generatePathString,
}: {
    asset: AssetData
    imageUrl: string
    isSelected: boolean
    animData?: LayerAnimData
    isPlaying: boolean
    generatePathString: any
}) {
    const ref = React.useRef(null)
    const tweenRef = React.useRef(null)

    React.useEffect(() => {
        if (!ref.current) return
        if (tweenRef.current) {
            tweenRef.current.kill()
            tweenRef.current = null
        }

        // Reset
        gsap.set(ref.current, { x: 0, y: 0, rotation: 0, clearProps: "all" })

        // Si hay datos de animación válidos
        if (animData && animData.points.length > 1) {
            const { points, config } = animData
            const pathD = generatePathString(points)

            tweenRef.current = gsap.to(ref.current, {
                motionPath: {
                    path: pathD,
                    align: ref.current,
                    alignOrigin: [0.5, 0.5],
                    autoRotate: config.autoRotate, // Configurable
                    start: 0,
                    end: 1,
                },
                duration: config.duration, // Configurable
                repeat: config.loop ? -1 : 0, // Configurable
                yoyo: config.yoyo, // Configurable
                ease: config.ease, // Configurable
                paused: !isPlaying,
            })
        }
    }, [animData]) // Se actualiza cuando cambian los puntos O la config

    React.useEffect(() => {
        if (tweenRef.current)
            isPlaying ? tweenRef.current.play() : tweenRef.current.pause()
    }, [isPlaying])

    return (
        <div
            style={{
                position: "absolute",
                left: asset.x,
                top: asset.y,
                width: asset.width,
                height: asset.height,
                zIndex: asset.zIndex,
                pointerEvents: "none",
                mixBlendMode: asset.blendMode as any,
            }}
        >
            {isSelected && (
                <div
                    style={{
                        position: "absolute",
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        border: "1px solid #007AFF",
                        zIndex: 100,
                    }}
                />
            )}
            <img
                ref={ref}
                src={imageUrl}
                alt={asset.name}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    opacity: asset.opacity,
                }}
            />

            {/* Visualización del Path guardado (Fantasma) */}
            {animData && !isSelected && (
                <svg
                    style={{
                        position: "absolute",
                        top: -asset.y - 50000,
                        left: -asset.x - 50000,
                        width: "100000px",
                        height: "100000px",
                        overflow: "visible",
                        opacity: 0.3,
                    }}
                >
                    <g transform="translate(50000, 50000)">
                        <path
                            d={generatePathString(animData.points)}
                            stroke="cyan"
                            fill="none"
                            strokeDasharray="5,5"
                        />
                    </g>
                </svg>
            )}
        </div>
    )
}

addPropertyControls(WebEngineProV4, {})
