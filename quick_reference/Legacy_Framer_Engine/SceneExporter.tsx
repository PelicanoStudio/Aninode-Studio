import React, {
    useState,
    useEffect,
    useRef,
    useLayoutEffect,
    memo,
} from "react"
import {
    addPropertyControls,
    ControlType,
    motion,
    useMotionValue,
    useTransform,
    animate,
    useMotionTemplate,
} from "framer"
// ¡NUEVO! Importamos useSnapshot para reaccionar a los cambios
import { useSnapshot } from "valtio"
import { aninodeStore } from "./export_store.ts"
import { useNodeRegistration } from "./useNodeRegistration.ts"
// ¡NUEVO! Importamos el cerebro de la jerarquía
import { resolveProperty, resolveItemProperty } from "./resolveProperty.ts"
import { getHtmlTemplate } from "./export_template.ts"

// --- (Tipos, Constantes y AnimatingItem no cambian) ---
// ... (El código de AnimatingItem va aquí, idéntico al anterior) ...
type PathData = {
    d: string
    viewBox: { x: number; y: number; width: number; height: number }
}

type Props = {
    width: number
    height: number
    nodeId: string
    name: string
    // (lightControllerNodeId eliminado)
    channelId: string
    linkColor: string
    showAnimationSettings: boolean
    duration: number
    easing: "linear" | "easeInOut" | "easeIn" | "easeOut"
    loop: boolean
    mirror: boolean
    rotateWithTrail: boolean
    showShadowSettings: boolean
    activateShadow: boolean
    lightSourceX: number
    lightSourceY: number
    shadowOpacity: number
    shadowHardness: number
    shadowBlendMode: "multiply" | "overlay" | "soft-light" | "normal"
    showLayoutSettings: boolean
    groupScale: number
    groupX: number
    groupY: number
    pathCount: number
    previewPaths: boolean
    pathColor: string
    previewLight: boolean
    imageCount: number
    [key: string]: any
}

// --- (El componente 'AnimatingItem' completo va aquí) ---
// ... (SIN CAMBIOS INTERNOS AL COMPONENTE 'AnimatingItem'...) ...
const isEditing =
    typeof window !== "undefined" && (window as any).Framer ? true : false

const AnimatingItem = memo(function AnimatingItem(props: any) {
    const {
        image,
        pathData,
        reverseDirection,
        activateShadow,
        lightSourceX, // Sigue recibiendo el valor RESUELTO
        lightSourceY, // Sigue recibiendo el valor RESUELTO
        shadowBlendMode,
    } = props

    if (!pathData || !image) return null

    const [renderParams, setRenderParams] = useState({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        actualWidth: 0,
        actualHeight: 0,
    })
    const [pathLength, setPathLength] = useState(0)
    const [imageAspectRatio, setImageAspectRatio] = useState(1)
    const [dominantColor, setDominantColor] = useState("#000000")

    const containerRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const progress = useMotionValue(reverseDirection ? 1 : 0)

    useEffect(() => {
        if (!image) return
        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.src = image
        img.onload = () => {
            setImageAspectRatio(img.width / img.height || 1)
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            const size = 20
            canvas.width = size
            canvas.height = size
            ctx.drawImage(img, 0, 0, size, size)
            try {
                const imageData = ctx.getImageData(0, 0, size, size).data
                let r = 0,
                    g = 0,
                    b = 0,
                    count = 0
                for (let i = 0; i < imageData.length; i += 4) {
                    if (imageData[i + 3] > 200) {
                        r += imageData[i]
                        g += imageData[i + 1]
                        b += imageData[i + 2]
                        count++
                    }
                }
                if (count > 0) {
                    r = Math.floor(r / count)
                    g = Math.floor(g / count)
                    b = Math.floor(b / count)
                    const avg = (r + g + b) / 3
                    r = Math.floor(r * 0.2 + avg * 0.1)
                    g = Math.floor(g * 0.2 + avg * 0.1)
                    b = Math.floor(b * 0.2 + avg * 0.1)
                    const toHex = (c: number) => c.toString(16).padStart(2, "0")
                    setDominantColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
                }
            } catch (e) {
                setDominantColor("#000000")
            }
        }
    }, [image])

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container || !pathData) return
        const { viewBox } = pathData
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width: cWidth, height: cHeight } =
                    entries[0].contentRect
                const scale = Math.min(
                    cWidth / viewBox.width,
                    cHeight / viewBox.height
                )
                const offsetX = (cWidth - viewBox.width * scale) / 2
                const offsetY = (cHeight - viewBox.height * scale) / 2
                setRenderParams({
                    scale,
                    offsetX,
                    offsetY,
                    actualWidth: cWidth,
                    actualHeight: cHeight,
                })
            }
        })
        observer.observe(container)
        return () => observer.disconnect()
    }, [pathData])

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength())
        }
    }, [pathData, renderParams])

    useEffect(() => {
        if (pathLength === 0) return
        progress.set(reverseDirection ? 1 : 0)
        let controls

        if (props.useKeyframes) {
            const keyframeValues = [reverseDirection ? 1 : 0]
            const keyframeTimes = [0]
            const easingArray: any[] = []
            let lastProgress = reverseDirection ? 1 : 0

            for (let i = 1; i <= props.keyframeCount; i++) {
                const startTime = props[`startTime${i}`] || 0
                const endTime = props[`endTime${i}`] || 0
                const targetProgress = (props[`endProgress${i}`] || 0) / 100
                const endProgress = reverseDirection
                    ? 1 - targetProgress
                    : targetProgress
                const useGlobalEasing = props[`useGlobalEasing${i}`]
                const keyframeEasing = props[`easing${i}`]

                if (
                    keyframeTimes[keyframeTimes.length - 1] <
                    startTime / props.totalDuration
                ) {
                    keyframeValues.push(lastProgress)
                    keyframeTimes.push(startTime / props.totalDuration)
                    easingArray.push("linear")
                }

                keyframeValues.push(endProgress)
                keyframeTimes.push(endTime / props.totalDuration)
                easingArray.push(
                    useGlobalEasing ? props.globalEasing : keyframeEasing
                )
                lastProgress = endProgress
            }

            if (keyframeTimes[keyframeTimes.length - 1] < 1) {
                keyframeValues.push(lastProgress)
                keyframeTimes.push(1)
                easingArray.push("linear")
            }

            controls = animate(progress, keyframeValues, {
                duration: props.totalDuration,
                ease: easingArray,
                times: keyframeTimes,
                repeat: props.loop ? Infinity : 0,
            })
        } else {
            const to = reverseDirection ? 0 : 1
            controls = animate(progress, to, {
                duration: props.globalDuration,
                ease: props.globalEasing,
                delay: isEditing ? 0 : props.delay,
                repeat: props.globalLoop ? Infinity : 0,
                repeatDelay: isEditing ? 0 : props.delay,
                repeatType: props.globalMirror ? "reverse" : "loop",
            })
        }
        return () => controls?.stop()
    }, [
        pathLength,
        reverseDirection,
        props.useKeyframes,
        props.globalDuration,
        props.globalEasing,
        props.delay,
        props.globalLoop,
        props.globalMirror,
        props.totalDuration,
        props.loop,
        props.keyframeCount,
        props.startTime1,
        props.endTime1,
        props.endProgress1,
        props.useGlobalEasing1,
        props.easing1,
        props.startTime2,
        props.endTime2,
        props.endProgress2,
        props.useGlobalEasing2,
        props.easing2,
        props.startTime3,
        props.endTime3,
        props.endProgress3,
        props.useGlobalEasing3,
        props.easing3,
        props.startTime4,
        props.endTime4,
        props.endProgress4,
        props.useGlobalEasing4,
        props.easing4,
        props.startTime5,
        props.endTime5,
        props.endProgress5,
        props.useGlobalEasing5,
        props.easing5,
    ])

    const x = useTransform(progress, (value: number) => {
        if (!pathRef.current || !pathData) return 0
        const point = pathRef.current.getPointAtLength(value * pathLength)
        return (
            (point.x - pathData.viewBox.x) * renderParams.scale +
            renderParams.offsetX
        )
    })

    const y = useTransform(progress, (value: number) => {
        if (!pathRef.current || !pathData) return 0
        const point = pathRef.current.getPointAtLength(value * pathLength)
        return (
            (point.y - pathData.viewBox.y) * renderParams.scale +
            renderParams.offsetY
        )
    })

    const rotate = useTransform(progress, (value: number) => {
        if (!pathRef.current || !props.rotateWithTrail) return 0
        const point = pathRef.current.getPointAtLength(value * pathLength)
        const nextPoint = pathRef.current.getPointAtLength(
            value * pathLength + 1
        )
        return (
            (Math.atan2(
                (nextPoint.y - point.y) * renderParams.scale,
                (nextPoint.x - point.x) * renderParams.scale
            ) *
                180) /
            Math.PI
        )
    })

    const mvShadowOpacity = useMotionValue(props.shadowOpacity)
    const mvShadowHardness = useMotionValue(props.shadowHardness)
    const mvShadowSpread = useMotionValue(props.shadowSpread)
    useEffect(() => {
        mvShadowOpacity.set(props.shadowOpacity)
        mvShadowHardness.set(props.shadowHardness)
        mvShadowSpread.set(props.shadowSpread)
    }, [props.shadowOpacity, props.shadowHardness, props.shadowSpread])

    const shadowOpacityHex = useTransform(mvShadowOpacity, (o: number) =>
        Math.round((o / 100) * 255)
            .toString(16)
            .padStart(2, "0")
    )
    const shadowColorWithOpacity = useMotionTemplate`${dominantColor}${shadowOpacityHex}`

    const shadowGradient = useMotionTemplate`radial-gradient(ellipse ${
        100 * imageAspectRatio
    }% 100% at ${useTransform(
        [x, y, rotate],
        ([latestX, latestY, latestRotate]: [number, number, number]) => {
            const lightPixelX = renderParams.actualWidth * (lightSourceX / 100)
            const lightPixelY = renderParams.actualHeight * (lightSourceY / 100)
            const dx = lightPixelX - latestX
            const dy = lightPixelY - latestY
            const lightAngle = Math.atan2(dy, dx)
            const objectAngleRad = props.rotateWithTrail
                ? latestRotate * (Math.PI / 180)
                : 0
            const finalAngle = lightAngle - objectAngleRad
            const offsetX = 50 + Math.cos(finalAngle) * 50
            const offsetY = 50 + Math.sin(finalAngle) * 50
            return `${offsetX}% ${offsetY}%`
        }
    )}, transparent ${useTransform(
        mvShadowSpread,
        (v: number) => v
    )}%, ${shadowColorWithOpacity} ${useTransform(
        [mvShadowSpread, mvShadowHardness],
        ([spread, hardness]: [number, number]) => spread + (100 - hardness)
    )}%)`

    return (
        <motion.div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
            }}
        >
            <svg
                width="100%"
                height="100%"
                style={{
                    overflow: "visible",
                    visibility:
                        props.previewPaths && isEditing ? "visible" : "hidden",
                }}
            >
                <g
                    style={{
                        transform: `translate(${renderParams.offsetX}px, ${renderParams.offsetY}px) scale(${renderParams.scale})`,
                    }}
                >
                    <path
                        ref={pathRef}
                        d={pathData.d}
                        fill="none"
                        stroke={props.pathColor}
                        strokeWidth={2 / renderParams.scale}
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
            </svg>

            {activateShadow && props.previewLight && isEditing && (
                <div
                    style={{
                        position: "absolute",
                        left: `${lightSourceX}%`,
                        top: `${lightSourceY}%`,
                        width: 15,
                        height: 15,
                        background: "red",
                        borderRadius: "50%",
                        border: "2px solid white",
                        transform: "translate(-50%, -50%)",
                        zIndex: 999,
                    }}
                />
            )}

            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    x,
                    y,
                    rotate,
                    translateX: "-50%",
                    translateY: "-50%",
                    willChange: "transform",
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: renderParams.scale
                            ? 50 * renderParams.scale * props.scale
                            : 0,
                        height: renderParams.scale
                            ? (50 * renderParams.scale * props.scale) /
                              imageAspectRatio
                            : 0,
                    }}
                >
                    <motion.img
                        src={image}
                        alt=""
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            position: "relative",
                            zIndex: 1,
                        }}
                    />
                    {activateShadow && (
                        <motion.div
                            style={{
                                position: "absolute",
                                top: "-1%",
                                left: "-1%",
                                width: "102%",
                                height: "102%",
                                background: shadowGradient,
                                mixBlendMode: shadowBlendMode,
                                maskImage: `url(${image})`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center",
                                zIndex: 2,
                            }}
                        />
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    )
})

// --- Componente Principal (con lógica de renderizado MODIFICADA) ---
export default function SceneExporter(props: Props) {
    const {
        pathCount,
        imageCount,
        // (groupScale, groupX, groupY se resolverán ahora)
        linkColor,
        nodeId,
    } = props

    // --- 1. REGISTRO DEL NODO (Como en Fase 0) ---
    useNodeRegistration(nodeId, "SceneAnimatorNode", props)

    // --- 2. SUSCRIPCIÓN A CAMBIOS (¡NUEVO!) ---
    // 'snap' es una copia reactiva del store.
    // Cada vez que un 'override' cambie, este componente
    // se volverá a renderizar.
    const snap = useSnapshot(aninodeStore)

    const [pathStore, setPathStore] = useState<Record<string, PathData>>({})
    const [exportStatus, setExportStatus] = useState("Exportar Proyecto")

    // --- (Lógica de carga de paths - sin cambios) ---
    useEffect(() => {
        const newStore: Record<string, PathData> = {}
        const svgFiles = Array.from(
            { length: pathCount },
            (_, i) => props[`svgFile${i + 1}`]
        ).filter(Boolean)
        if (svgFiles.length === 0 && pathCount > 0) {
            setPathStore({})
            return
        }
        let pathsLoaded = 0
        for (let i = 1; i <= pathCount; i++) {
            const svgFile = props[`svgFile${i}`]
            if (svgFile) {
                fetch(svgFile)
                    .then((res) => res.text())
                    .then((svgText) => {
                        const parser = new DOMParser()
                        const svgDoc = parser.parseFromString(
                            svgText,
                            "image/svg+xml"
                        )
                        const pathEl = svgDoc.querySelector("path")
                        const svgEl = svgDoc.querySelector("svg")
                        if (pathEl && svgEl) {
                            const vb = svgEl.getAttribute("viewBox")
                            let viewBox = {
                                x: 0,
                                y: 0,
                                width: 100,
                                height: 100,
                            }
                            if (vb) {
                                const [x, y, width, height] = vb
                                    .split(" ")
                                    .map(parseFloat)
                                viewBox = { x, y, width, height }
                            }
                            newStore[`${i}`] = {
                                d: pathEl.getAttribute("d") || "",
                                viewBox,
                            }
                        }
                    })
                    .finally(() => {
                        pathsLoaded++
                        if (pathsLoaded === svgFiles.length) {
                            setPathStore(newStore)
                        }
                    })
            }
        }
    }, [
        pathCount,
        ...Array.from(
            { length: pathCount },
            (_, i) => props[`svgFile${i + 1}`]
        ),
    ])

    // --- ¡FUNCIÓN DE EXPORTACIÓN MODIFICADA! ---
    const handleExport = async () => {
        if (isEditing) {
            alert("La exportación solo funciona en el sitio web publicado.")
            return
        }
        setExportStatus("Exportando...")

        try {
            const directoryHandle = await window.showDirectoryPicker()
            const assetUrls = new Set<string>()
            const pathsData: any[] = []
            const itemsData: any[] = []

            // Recolectar Paths de la Escena
            for (let i = 1; i <= props.pathCount; i++) {
                const url = props[`svgFile${i}`]
                if (url) {
                    assetUrls.add(url)
                    pathsData.push({ id: i, svgFileUrl: url })
                }
            }
            // Recolectar Items de la Escena
            for (let i = 1; i <= props.imageCount; i++) {
                // (Lógica de recolección de items - sin cambios)
                const imageUrl = props[`image${i}`]
                if (imageUrl) {
                    assetUrls.add(imageUrl)
                }
                const itemConfig: any = {}
                const keys = [
                    `image`,
                    `assignToPath`,
                    `scale`,
                    `reverseDirection`,
                    `shadowSpread`,
                    `useKeyframes`,
                    `delay`,
                    `totalDuration`,
                    `loop`,
                    `keyframeCount`,
                ]
                keys.forEach((key) => (itemConfig[key] = props[`${key}${i}`]))
                if (itemConfig.useKeyframes) {
                    itemConfig.keyframes = []
                    for (let j = 1; j <= itemConfig.keyframeCount; j++) {
                        const kfKeys = [
                            `startTime`,
                            `endTime`,
                            `endProgress`,
                            `easing`,
                            `useGlobalEasing`,
                        ]
                        const kfConfig: any = {}
                        kfKeys.forEach(
                            (key) => (kfConfig[key] = props[`${key}${i}_${j}`])
                        )
                        itemConfig.keyframes.push(kfConfig)
                    }
                }
                itemsData.push(itemConfig)
            }

            // --- ¡NUEVO! 3. Recolectar assets de Controladores ---
            // Buscamos en *todo* el store por nodos de tipo "LightControllerNode"
            // que estén apuntando a ESTE nodo.
            
            let controllerChannel: any = null
            
            const lightNodeId = Object.keys(aninodeStore.nodes).find(key => {
                const node = aninodeStore.nodes[key]
                return node.type === "LightControllerNode" && 
                       node.baseProps.targetNodeId === props.nodeId
            })
            
            const lightNode = lightNodeId ? aninodeStore.nodes[lightNodeId] : null

            if (lightNode) {
                // Encontramos un controlador de luz apuntando a nosotros
                controllerChannel = {
                    lightConfig: {
                        type: "LightController",
                        ...JSON.parse(JSON.stringify(lightNode.baseProps)),
                    },
                }
                
                if (
                    controllerChannel.lightConfig?.usePath &&
                    controllerChannel.lightConfig.svgFile
                ) {
                    assetUrls.add(controllerChannel.lightConfig.svgFile)
                }
            }

            // 4. Descargar assets (sin cambios)
            const assetsDir = await directoryHandle.getDirectoryHandle(
                "assets",
                { create: true }
            )
            const assetMap: Record<string, string> = {}
            let assetCounter = 0
            for (const url of Array.from(assetUrls)) {
                setExportStatus(`Descargando ${url.substring(0, 40)}...`)
                const response = await fetch(url)
                const blob = await response.blob()
                const extension = url.split(".").pop()?.split("?")[0] || "file"
                const localName = `asset_${assetCounter++}.${extension}`
                const localPath = `assets/${localName}`
                assetMap[url] = localPath
                const fileHandle = await assetsDir.getFileHandle(localName, {
                    create: true,
                })
                const writable = await fileHandle.createWritable()
                await writable.write(blob)
                await writable.close()
            }

            // 5. Preparar datos (sin cambios)
            setExportStatus("Generando archivos...")
            const settings = { ...props }

            // 6. Re-mapear URLs (sin cambios)
            pathsData.forEach((path) => {
                if (path.svgFileUrl && assetMap[path.svgFileUrl]) {
                    path.localPath = assetMap[path.svgFileUrl]
                }
            })
            itemsData.forEach((item) => {
                if (item.image && assetMap[item.image]) {
                    item.image = assetMap[item.image]
                }
            })
            if (
                controllerChannel?.lightConfig?.svgFile &&
                assetMap[controllerChannel.lightConfig.svgFile]
            ) {
                controllerChannel.lightConfig.localPath =
                    assetMap[controllerChannel.lightConfig.svgFile]
            }

            const finalAnimationData = {
                settings,
                controllerData: controllerChannel,
                paths: pathsData,
                items: itemsData,
            }

            // 7. Generar HTML (sin cambios)
            const htmlContent = getHtmlTemplate(finalAnimationData, assetMap)
            const htmlFileHandle = await directoryHandle.getFileHandle(
                "index.html",
                { create: true }
            )
            const writableHtml = await htmlFileHandle.createWritable()
            await writableHtml.write(htmlContent)
            await writableHtml.close()

            // 8. Guardar JSON (sin cambios)
            const jsonFileHandle = await directoryHandle.getFileHandle(
                "animationData.json",
                { create: true }
            )
            const writableJson = await jsonFileHandle.createWritable()
            await writableJson.write(
                JSON.stringify(finalAnimationData, null, 2)
            )
            await writableJson.close()

            setExportStatus("¡Exportación Completada!")
        } catch (error) {
            console.error("Error durante la exportación:", error)
            setExportStatus("Error al exportar")
        } finally {
            setTimeout(() => setExportStatus("Exportar Proyecto"), 3000)
        }
    }

    // --- 3. LÓGICA DE RENDERIZADO (¡CRÍTICO!) ---
    // Usamos 'snap' (el snapshot reactivo) para leer el estado actual
    // y el 'resolver' para aplicar la jerarquía.
    
    // Verificamos que nuestro nodo exista en el snapshot
    if (!snap.nodes[nodeId]) {
        // Aún no se ha registrado, mostramos un 'cargando' o nada
        return null 
    }

    // ¡AQUÍ ESTÁ LA MAGIA!
    // Resolvemos las propiedades. El 'resolver' buscará en:
    // 1. Nivel 3: snap.nodes[nodeId].overrides.lightSourceX
    // 2. Nivel 1: props.lightSourceX (el valor del slider)
    const lightSourceX = resolveProperty(
        nodeId,
        "lightSourceX",
        props.lightSourceX
    )
    const lightSourceY = resolveProperty(
        nodeId,
        "lightSourceY",
        props.lightSourceY
    )
    const groupScale = resolveProperty(nodeId, "groupScale", props.groupScale)
    const groupX = resolveProperty(nodeId, "groupX", props.groupX)
    const groupY = resolveProperty(nodeId, "groupY", props.groupY)
    
    // Resolvemos una prop que aplica a todos los items
    const activateShadow = resolveProperty(
        nodeId,
        "activateShadow",
        props.activateShadow
    )

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: isEditing ? "visible" : "hidden",
                outline:
                    isEditing && nodeId ? `10px solid ${linkColor}` : "none",
                outlineOffset: "3px",
                borderRadius: "8px",
            }}
        >
            {/* Botón de exportar (sin cambios) */}
            {!isEditing && (
                <button
                    onClick={handleExport}
                    style={{
                        position: "fixed",
                        top: "20px",
                        left: "20px",
                        zIndex: 1000,
                        // ... (otros estilos)
                        padding: "10px 20px",
                        background: "#007AFF",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                >
                    {exportStatus}
                </button>
            )}

            <motion.div
                style={{
                    position: "absolute",
                    top: groupY, // ¡Usa el valor resuelto!
                    left: groupX, // ¡Usa el valor resuelto!
                    scale: groupScale, // ¡Usa el valor resuelto!
                    width: "100%",
                    height: "100%",
                    transformOrigin: "top left",
                }}
            >
                {Array.from({ length: imageCount }, (_, i) => {
                    const itemIndex = (i + 1).toString() // (ej: "1", "2")
                    const assignedPathIndex = props[`assignToPath${itemIndex}`]
                    const pathData = pathStore[assignedPathIndex]
                    
                    // --- Resolvemos props por-item ---
                    // Pasamos el ID del item ("1", "2", etc.) al resolver
                    const itemProps: any = {
                        key: itemIndex,
                        pathData: pathData,
                        
                        // --- Propiedades Resueltas ---
                        image: resolveItemProperty(nodeId, itemIndex, "image", props[`image${itemIndex}`]),
                        scale: resolveItemProperty(nodeId, itemIndex, "scale", props[`scale${itemIndex}`]),
                        reverseDirection: resolveItemProperty(nodeId, itemIndex, "reverseDirection", props[`reverseDirection${itemIndex}`]),
                        shadowSpread: resolveItemProperty(nodeId, itemIndex, "shadowSpread", props[`shadowSpread${itemIndex}`]),
                        delay: resolveItemProperty(nodeId, itemIndex, "delay", props[`delay${itemIndex}`]),
                        useKeyframes: resolveItemProperty(nodeId, itemIndex, "useKeyframes", props[`useKeyframes${itemIndex}`]),
                        totalDuration: resolveItemProperty(nodeId, itemIndex, "totalDuration", props[`totalDuration${itemIndex}`]),
                        loop: resolveItemProperty(nodeId, itemIndex, "loop", props[`loop${itemIndex}`]),
                        keyframeCount: resolveItemProperty(nodeId, itemIndex, "keyframeCount", props[`keyframeCount${itemIndex}`]),
                        
                        // --- Propiedades Globales Resueltas ---
                        // (Estas vienen del 'resolver' global de arriba)
                        globalDuration: resolveProperty(nodeId, "duration", props.duration),
                        globalEasing: resolveProperty(nodeId, "easing", props.easing),
                        globalLoop: resolveProperty(nodeId, "loop", props.loop),
                        globalMirror: resolveProperty(nodeId, "mirror", props.mirror),
                        rotateWithTrail: resolveProperty(nodeId, "rotateWithTrail", props.rotateWithTrail),
                        previewPaths: resolveProperty(nodeId, "previewPaths", props.previewPaths),
                        pathColor: resolveProperty(nodeId, "pathColor", props.pathColor),
                        previewLight: resolveProperty(nodeId, "previewLight", props.previewLight),
                        activateShadow: activateShadow, // ¡Usa el valor resuelto!
                        lightSourceX: lightSourceX, // ¡Usa el valor resuelto!
                        lightSourceY: lightSourceY, // ¡Usa el valor resuelto!
                        shadowOpacity: resolveProperty(nodeId, "shadowOpacity", props.shadowOpacity),
                        shadowHardness: resolveProperty(nodeId, "shadowHardness", props.shadowHardness),
                        shadowBlendMode: resolveProperty(nodeId, "shadowBlendMode", props.shadowBlendMode),
                    }
                    
                    // --- Resolvemos Keyframes (Nivel 1 por ahora) ---
                    // (La resolución de Nivel 3 para keyframes es más compleja,
                    // por ahora leemos Nivel 1)
                    if (itemProps.useKeyframes) {
                        for (let j = 1; j <= 5; j++) {
                            itemProps[`startTime${j}`] =
                                props[`startTime${itemIndex}_${j}`]
                            itemProps[`endTime${j}`] =
                                props[`endTime${itemIndex}_${j}`]
                            itemProps[`endProgress${j}`] =
                                props[`endProgress${itemIndex}_${j}`]
                            itemProps[`useGlobalEasing${j}`] =
                                props[`useGlobalEasing${itemIndex}_${j}`]
                            itemProps[`easing${j}`] =
                                props[`easing${itemIndex}_${j}`]
                        }
                    }

                    return <AnimatingItem {...itemProps} />
                })}
            </motion.div>
        </motion.div>
    )
}

// --- ¡CONTROLES DE PROPIEDADES MODIFICADOS! ---
const controls: any = {
    nodeId: {
        type: ControlType.String,
        title: "▶ Node ID (Único)",
        defaultValue: "sceneAnimator1",
    },
    name: {
        type: ControlType.String,
        title: "Nombre",
        defaultValue: "Scene Animator",
    },
    // (lightControllerNodeId eliminado)
    channelId: {
        type: ControlType.String,
        title: "ID de Canal (Obsoleto)",
        defaultValue: "escenaPrincipal",
        hidden: () => true,
    },
    linkColor: {
        type: ControlType.Color,
        title: "Color de Vínculo (Editor)",
        defaultValue: "#0099FF",
    },
    // ... (El resto de controles 'showAnimationSettings', 'duration', etc. 
    // siguen igual, actuando como Nivel 1 'baseProps') ...
    showAnimationSettings: {
        type: ControlType.Boolean,
        title: "▶ Globales y Animación Simple",
        defaultValue: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duración (Modo Simple)",
        min: 0.1,
        max: 60,
        step: 0.1,
        defaultValue: 5,
        hidden: (props) => !props.showAnimationSettings,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing Global",
        options: ["linear", "easeInOut", "easeIn", "easeOut"],
        defaultValue: "linear",
        hidden: (props) => !props.showAnimationSettings,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop (Modo Simple)",
        defaultValue: true,
        hidden: (props) => !props.showAnimationSettings,
    },
    mirror: {
        type: ControlType.Boolean,
        title: "Mirror (Modo Simple)",
        defaultValue: false,
        hidden: (props) => !props.showAnimationSettings,
    },
    rotateWithTrail: {
        type: ControlType.Boolean,
        title: "Rotar con Trayectoria",
        defaultValue: true,
        hidden: (props) => !props.showAnimationSettings,
    },

    showShadowSettings: {
        type: ControlType.Boolean,
        title: "▶ Sombreado Dinámico",
        defaultValue: true,
    },
    activateShadow: {
        type: ControlType.Boolean,
        title: "Activar Sombras (Global)",
        defaultValue: true,
        hidden: (props) => !props.showShadowSettings,
    },
    lightSourceX: {
        title: "Luz: Posición X (%)",
        type: ControlType.Number,
        min: -50,
        max: 150,
        defaultValue: 110,
        display: "slider",
        hidden: (props) => !props.showShadowSettings || !props.activateShadow,
    },
    lightSourceY: {
        title: "Luz: Posición Y (%)",
        type: ControlType.Number,
        min: -50,
        max: 150,
        defaultValue: 50,
        display: "slider",
        hidden: (props) => !props.showShadowSettings || !props.activateShadow,
    },
    shadowOpacity: {
        title: "Opacidad Sombra",
        type: ControlType.Number,
        min: 0,
        max: 100,
        defaultValue: 50,
        display: "slider",
        hidden: (props) => !props.showShadowSettings || !props.activateShadow,
    },
    shadowHardness: {
        title: "Dureza Sombra",
        type: ControlType.Number,
        min: 1,
        max: 99,
        defaultValue: 50,
        display: "slider",
        hidden: (props) => !props.showShadowSettings || !props.activateShadow,
    },
    shadowBlendMode: {
        title: "Modo de Fusión",
        type: ControlType.Enum,
        options: ["multiply", "overlay", "soft-light", "normal"],
        defaultValue: "multiply",
        hidden: (props) => !props.showShadowSettings || !props.activateShadow,
    },

    showLayoutSettings: {
        type: ControlType.Boolean,
        title: "▶ Layout y Guías",
        defaultValue: true,
    },
    groupScale: {
        type: ControlType.Number,
        title: "Escala del Grupo",
        min: 0.1,
        max: 10,
        display: "slider",
        defaultValue: 1,
        hidden: (props) => !props.showLayoutSettings,
    },
    groupX: {
        title: "Posición X del Grupo",
        type: ControlType.Number,
        min: -1000,
        max: 1000,
        display: "slider",
        defaultValue: 0,
        hidden: (props) => !props.showLayoutSettings,
    },
    groupY: {
        title: "Posición Y del Grupo",
        type: ControlType.Number,
        min: -1000,
        max: 1000,
        display: "slider",
        defaultValue: 0,
        hidden: (props) => !props.showLayoutSettings,
    },
    previewPaths: {
        type: ControlType.Boolean,
        title: "Mostrar Guías de Trazado",
        defaultValue: true,
        hidden: (props) => !props.showLayoutSettings,
    },
    pathColor: {
        type: ControlType.Color,
        title: "Color de Guías",
        defaultValue: "#0099FF",
        hidden: (props) => !props.showLayoutSettings || !props.previewPaths,
    },
    previewLight: {
        type: ControlType.Boolean,
        title: "Mostrar Guía de Luz",
        defaultValue: true,
        hidden: (props) => !props.showLayoutSettings || !props.activateShadow,
    },

    separatorPaths: {
        type: ControlType.String,
        title: "───────────",
        readOnly: true,
    },
    pathCount: {
        type: ControlType.Number,
        title: "4. Cantidad de Trazados",
        min: 1,
        max: 30,
        step: 1,
        display: "slider",
        defaultValue: 1,
    },
}

for (let i = 1; i <= 30; i++) {
    controls[`svgFile${i}`] = {
        type: ControlType.File,
        title: `Path SVG ${i}`,
        allowedFileTypes: ["svg"],
        hidden: (props: { pathCount: number }) => props.pathCount < i,
    }
}

controls.separatorItems = {
    type: ControlType.String,
    title: "───────────",
    readOnly: true,
}
controls.imageCount = {
    type: ControlType.Number,
    title: "5. Cantidad de Items",
    min: 1,
    max: 10,
    step: 1,
    display: "slider",
    defaultValue: 1,
}

for (let i = 1; i <= 10; i++) {
    const isItemHidden = (props: { imageCount: number }) => props.imageCount < i
    const isKeyframeMode = (props: { [key: string]: boolean }) =>
        props[`useKeyframes${i}`]

    controls[`itemSeparator${i}`] = {
        type: ControlType.String,
        title: `─────────── ITEM ${i} ───────────`,
        readOnly: true,
        hidden: isItemHidden,
    }
    controls[`image${i}`] = {
        type: ControlType.Image,
        title: "Imagen",
        hidden: isItemHidden,
    }
    controls[`assignToPath${i}`] = {
        type: ControlType.Number,
        title: "Asignar a Trazado",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 1,
        hidden: isItemHidden,
    }
    controls[`scale${i}`] = {
        type: ControlType.Number,
        title: "Escala de Imagen",
        min: 0.1,
        max: 10,
        step: 0.1,
        display: "slider",
        defaultValue: 1,
        hidden: isItemHidden,
    }
    controls[`reverseDirection${i}`] = {
        type: ControlType.Boolean,
        title: "Invertir Origen",
        defaultValue: false,
        hidden: isItemHidden,
    }
    controls[`shadowSpread${i}`] = {
        title: "Extensión Sombra",
        type: ControlType.Number,
        min: 0,
        max: 100,
        defaultValue: 40,
        display: "slider",
        hidden: (props: { activateShadow: boolean }) =>
            isItemHidden(props) || !props.activateShadow,
    }
    controls[`useKeyframes${i}`] = {
        type: ControlType.Boolean,
        title: "Usar Keyframes",
        defaultValue: false,
        hidden: isItemHidden,
    }

    controls[`delay${i}`] = {
        type: ControlType.Number,
        title: "Delay (Modo Simple)",
        min: 0,
        max: 60,
        step: 0.1,
        defaultValue: (i - 1) * 0.5,
        hidden: (props: any) => isItemHidden(props) || isKeyframeMode(props),
    }

    controls[`totalDuration${i}`] = {
        type: ControlType.Number,
        title: "Duración Total (Keyframes)",
        min: 1,
        max: 300,
        step: 0.1,
        defaultValue: 10,
        hidden: (props: any) => isItemHidden(props) || !isKeyframeMode(props),
    }
    controls[`loop${i}`] = {
        type: ControlType.Boolean,
        title: "Loop (Keyframes)",
        defaultValue: false,
        hidden: (props: any) => isItemHidden(props) || !isKeyframeMode(props),
    }
    controls[`keyframeCount${i}`] = {
        title: "Cantidad de Keyframes",
        type: ControlType.Number,
        min: 1,
        max: 5,
        step: 1,
        display: "slider",
        defaultValue: 1,
        hidden: (props: any) => isItemHidden(props) || !isKeyframeMode(props),
    }

    for (let j = 1; j <= 5; j++) {
        const isKeyframeHidden = (props: any) =>
            isItemHidden(props) ||
            !isKeyframeMode(props) ||
            props[`keyframeCount${i}`] < j
        controls[`keyframeSeparator${i}_${j}`] = {
            type: ControlType.String,
            title: `--- Keyframe ${j} ---`,
            readOnly: true,
            hidden: isKeyframeHidden,
        }
        controls[`startTime${i}_${j}`] = {
            type: ControlType.Number,
            title: "Inicio (seg)",
            min: 0,
            max: 300,
            step: 0.1,
            defaultValue: j > 1 ? (j - 1) * 2 : 0,
            hidden: isKeyframeHidden,
        }
        controls[`endTime${i}_${j}`] = {
            type: ControlType.Number,
            title: "Fin (seg)",
            min: 0,
            max: 300,
            step: 0.1,
            defaultValue: j * 2,
            hidden: isKeyframeHidden,
        }
        controls[`endProgress${i}_${j}`] = {
            type: ControlType.Number,
            title: "Avance del Trazo (%)",
            min: 0,
            max: 100,
            step: 1,
            display: "slider",
            defaultValue: j * (100 / 5),
            hidden: isKeyframeHidden,
        }
        controls[`useGlobalEasing${i}_${j}`] = {
            type: ControlType.Boolean,
            title: "Usar Easing Global",
            defaultValue: true,
            hidden: isKeyframeHidden,
        }
        controls[`easing${i}_${j}`] = {
            type: ControlType.Enum,
            title: "Easing Individual",
            options: ["linear", "easeInOut", "easeIn", "easeOut"],
            defaultValue: "linear",
            hidden: (props: any) =>
                isKeyframeHidden(props) || props[`useGlobalEasing${i}_${j}`],
        }
    }
}

addPropertyControls(SceneExporter, controls)