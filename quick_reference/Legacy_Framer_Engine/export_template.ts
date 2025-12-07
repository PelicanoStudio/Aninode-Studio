// Este archivo exporta una función que genera el HTML standalone completo

export function getHtmlTemplate(
    animationData: any,
    assetMap: Record<string, string> // assetMap ya no se usa aquí, los datos vienen procesados
): string {
    // 1. Los datos ya vienen procesados desde SceneExporter.tsx
    //    No necesitamos re-mapear assets aquí.
    const finalData = animationData

    // 2. Inyectamos los datos procesados en la plantilla HTML
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Animación Exportada</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #000; }
        #root { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="importmap">
        {
            "imports": {
                "react": "https://esm.sh/react@18.2.0",
                "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
                "framer-motion": "https://esm.sh/framer-motion@10.16.4?external=react,react-dom"
            }
        }
    </script>

    <script type="application/json" id="animationData">
        ${JSON.stringify(finalData, null, 2)}
    </script>

    <script type="module">
        import React, {
            useState,
            useEffect,
            useRef,
            useLayoutEffect,
            memo,
        } from "react"
        import ReactDOM from "react-dom/client"
        import {
            motion,
            useMotionValue,
            useTransform,
            animate,
            useMotionTemplate,
        } from "framer-motion"

        // --- MOTOR DE ANIMATING ITEM (ACTUALIZADO) ---
        // Ahora acepta lightSourceX y lightSourceY como MotionValues
        const AnimatingItem = memo(function AnimatingItem(props) {
            const {
                image,
                pathData,
                reverseDirection,
                activateShadow,
                lightSourceX, // <-- ¡NUEVO! Es un MotionValue
                lightSourceY, // <-- ¡NUEVO! Es un MotionValue
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

            const containerRef = useRef(null)
            const pathRef = useRef(null)
            const progress = useMotionValue(reverseDirection ? 1 : 0)

            // ... (useEffect para dominantColor - sin cambios) ...
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
                        let r = 0, g = 0, b = 0, count = 0
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
                            const toHex = (c) => c.toString(16).padStart(2, "0")
                            setDominantColor(\`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`)
                        }
                    } catch (e) {
                        setDominantColor("#000000")
                    }
                }
            }, [image])
            
            // ... (useLayoutEffect para renderParams - sin cambios) ...
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

            // ... (useEffect para pathLength - sin cambios) ...
            useEffect(() => {
                if (pathRef.current) {
                    setPathLength(pathRef.current.getTotalLength())
                }
            }, [pathData, renderParams])
            
            // ... (useEffect para animación de 'progress' - sin cambios) ...
            useEffect(() => {
                if (pathLength === 0) return
                progress.set(reverseDirection ? 1 : 0)
                let controls
                
                if (props.useKeyframes) {
                    const keyframeValues = [reverseDirection ? 1 : 0]
                    const keyframeTimes = [0]
                    const easingArray = []
                    let lastProgress = reverseDirection ? 1 : 0

                    for (let i = 1; i <= props.keyframeCount; i++) {
                        const kf = props.keyframes[i-1]
                        const startTime = kf.startTime || 0
                        const endTime = kf.endTime || 0
                        const targetProgress = (kf.endProgress || 0) / 100
                        const endProgress = reverseDirection
                            ? 1 - targetProgress
                            : targetProgress
                        const useGlobalEasing = kf.useGlobalEasing
                        const keyframeEasing = kf.easing

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
                        delay: props.delay, 
                        repeat: props.globalLoop ? Infinity : 0,
                        repeatDelay: props.delay,
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
                props.keyframes
            ])

            // ... (useTransform para x, y, rotate - sin cambios) ...
            const x = useTransform(progress, (value) => {
                if (!pathRef.current || !pathData) return 0
                const point = pathRef.current.getPointAtLength(value * pathLength)
                return (
                    (point.x - pathData.viewBox.x) * renderParams.scale +
                    renderParams.offsetX
                )
            })
            const y = useTransform(progress, (value) => {
                if (!pathRef.current || !pathData) return 0
                const point = pathRef.current.getPointAtLength(value * pathLength)
                return (
                    (point.y - pathData.viewBox.y) * renderParams.scale +
                    renderParams.offsetY
                )
            })
            const rotate = useTransform(progress, (value) => {
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

            // --- Lógica de Sombreado (ACTUALIZADA) ---
            const mvShadowOpacity = useMotionValue(props.shadowOpacity)
            const mvShadowHardness = useMotionValue(props.shadowHardness)
            const mvShadowSpread = useMotionValue(props.shadowSpread)
            useEffect(() => {
                mvShadowOpacity.set(props.shadowOpacity)
                mvShadowHardness.set(props.shadowHardness)
                mvShadowSpread.set(props.shadowSpread)
            }, [props.shadowOpacity, props.shadowHardness, props.shadowSpread])

            const shadowOpacityHex = useTransform(mvShadowOpacity, (o) =>
                Math.round((o / 100) * 255)
                    .toString(16)
                    .padStart(2, "0")
            )
            const shadowColorWithOpacity = useMotionTemplate\`\${dominantColor}\${shadowOpacityHex}\`

            // ¡CAMBIO CLAVE!
            // Ya no usamos una función de transformación anidada.
            // Usamos los motion values 'lightSourceX' y 'lightSourceY' directamente.
            const shadowGradient = useMotionTemplate\`radial-gradient(ellipse \${
                100 * imageAspectRatio
            }% 100% at \${useTransform(
                [x, y, rotate, lightSourceX, lightSourceY], // <-- ¡NUEVO! Escucha la luz
                ([latestX, latestY, latestRotate, lightX, lightY]) => {
                    const lightPixelX = renderParams.actualWidth * (lightX / 100)
                    const lightPixelY = renderParams.actualHeight * (lightY / 100)
                    const dx = lightPixelX - latestX
                    const dy = lightPixelY - latestY
                    const lightAngle = Math.atan2(dy, dx)
                    const objectAngleRad = props.rotateWithTrail
                        ? latestRotate * (Math.PI / 180)
                        : 0
                    const finalAngle = lightAngle - objectAngleRad
                    const offsetX = 50 + Math.cos(finalAngle) * 50
                    const offsetY = 50 + Math.sin(finalAngle) * 50
                    return \`\${offsetX}% \${offsetY}%\`
                }
            )}, transparent \${useTransform(
                mvShadowSpread,
                (v) => v
            )}%, \${shadowColorWithOpacity} \${useTransform(
                [mvShadowSpread, mvShadowHardness],
                ([spread, hardness]) => spread + (100 - hardness)
            )}%)\`

            // ... (JSX de AnimatingItem - sin cambios) ...
             return React.createElement(motion.div, {
                ref: containerRef,
                style: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }
            },
                React.createElement("svg", {
                    width: "100%", height: "100%",
                    style: { overflow: "visible", visibility: "hidden" }
                },
                    React.createElement("g", {
                        style: { transform: \`translate(\${renderParams.offsetX}px, \${renderParams.offsetY}px) scale(\${renderParams.scale})\` }
                    },
                        React.createElement("path", {
                            ref: pathRef,
                            d: pathData.d,
                            fill: "none",
                            stroke: "none",
                            vectorEffect: "non-scaling-stroke"
                        })
                    )
                ),
                React.createElement(motion.div, {
                    style: { 
                        position: "absolute", top: 0, left: 0, 
                        x, y, rotate, 
                        translateX: "-50%", translateY: "-50%",
                        willChange: "transform"
                    }
                },
                    React.createElement(motion.div, {
                         style: {
                            position: "relative",
                            width: renderParams.scale ? 50 * renderParams.scale * props.scale : 0,
                            height: renderParams.scale ? (50 * renderParams.scale * props.scale) / imageAspectRatio : 0,
                        }
                    },
                        React.createElement(motion.img, {
                            src: image,
                            alt: "",
                            style: { 
                                display: "block",
                                width: "100%", 
                                height: "100%", 
                                objectFit: "contain", 
                                position: "relative",
                                zIndex: 1 
                            }
                        }),
                        activateShadow && React.createElement(motion.div, {
                            style: {
                                position: "absolute",
                                top: "-1%",
                                left: "-1%",
                                width: "102%",
                                height: "102%",
                                background: shadowGradient,
                                mixBlendMode: shadowBlendMode,
                                maskImage: \`url(\${image})\`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center",
                                zIndex: 2,
                            }
                        })
                    )
                )
            )
        })

        // --- MOTOR DE SCENE ANIMATOR (ACTUALIZADO) ---
        // Ahora acepta lightX y lightY como MotionValues
        function StandaloneAnimator(props) {
            const { settings, paths, items, lightX, lightY } = props // <-- ¡NUEVO!
            const [pathStore, setPathStore] = useState({})

            // ... (useEffect para cargar paths - sin cambios) ...
             useEffect(() => {
                async function loadPaths() {
                    const newStore = {}
                    for (const path of paths) {
                        try {
                            const response = await fetch(path.localPath)
                            const svgText = await response.text()
                            const parser = new DOMParser()
                            const svgDoc = parser.parseFromString(svgText, "image/svg+xml")
                            const pathEl = svgDoc.querySelector("path")
                            const svgEl = svgDoc.querySelector("svg")
                            if (pathEl && svgEl) {
                                const vb = svgEl.getAttribute("viewBox")
                                const [x, y, width, height] = vb ? vb.split(" ").map(parseFloat) : [0, 0, 100, 100]
                                newStore[path.id] = {
                                    d: pathEl.getAttribute("d") || "",
                                    viewBox: { x, y, width, height },
                                }
                            }
                        } catch (e) {
                            console.error("Error loading path:", path.localPath, e)
                        }
                    }
                    setPathStore(newStore)
                }
                loadPaths()
            }, [paths])
            
            // ¡ELIMINADO! La lógica de la luz ahora vive en el componente 'App'
            // const lightSourceX = ...
            // const lightSourceY = ...

            return React.createElement(motion.div, {
                style: { width: "100%", height: "100%", position: "relative", overflow: "hidden" }
            },
                React.createElement(motion.div, {
                    style: {
                        position: "absolute",
                        top: settings.groupY,
                        left: settings.groupX,
                        scale: settings.groupScale,
                        width: "100%",
                        height: "100%",
                        transformOrigin: "top left",
                    }
                },
                    items.map((item, index) => {
                        const pathData = pathStore[item.assignToPath]
                        if (!pathData) return null

                        const itemProps = {
                            ...settings, // Globales
                            ...item,        // Individuales
                            key: index,
                            pathData: pathData,
                            lightSourceX: lightX, // <-- ¡NUEVO! Pasa el MotionValue
                            lightSourceY: lightY, // <-- ¡NUEVO! Pasa el MotionValue
                            globalDuration: settings.duration,
                            globalEasing: settings.easing,
                            globalLoop: settings.loop,
                            globalMirror: settings.mirror,
                        }
                        return React.createElement(AnimatingItem, itemProps)
                    })
                )
            )
        }
        
        // --- ¡NUEVO! MOTOR DEL LIGHT CONTROLLER (HEADLESS) ---
        // Este componente no renderiza UI, solo ejecuta la lógica de animación
        function StandaloneLightController(props) {
            const { config, lightX, lightY } = props;
            
            const [pathData, setPathData] = useState(null);
            const pathRef = useRef(null);
            const [pathLength, setPathLength] = useState(0);
            const progress = useMotionValue(0);

            // 1. Cargar el SVG del trazado de la luz
            useEffect(() => {
                if (!config.usePath || !config.localPath) {
                    setPathData(null)
                    return
                }
                fetch(config.localPath)
                    .then((res) => res.text())
                    .then((svgText) => {
                        const parser = new DOMParser()
                        const svgDoc = parser.parseFromString(svgText, "image/svg+xml")
                        const pathEl = svgDoc.querySelector("path")
                        const svgEl = svgDoc.querySelector("svg")
                        if (pathEl && svgEl) {
                            const vb = svgEl.getAttribute("viewBox")
                            const vbParts = vb
                                ? vb.split(" ").map(Number)
                                : [0, 0, 100, 100]
                            setPathData({
                                d: pathEl.getAttribute("d") || "",
                                viewBox: {
                                    x: vbParts[0],
                                    y: vbParts[1],
                                    width: vbParts[2],
                                    height: vbParts[3],
                                },
                            })
                        }
                    })
                    .catch(() => setPathData(null))
            }, [config.usePath, config.localPath])

            // 2. Obtener la longitud del trazado
            useEffect(() => {
                if (pathRef.current && pathData) {
                    setPathLength(pathRef.current.getTotalLength())
                }
            }, [pathData])

            // 3. Ejecutar la lógica de animación (copiada de LightController.tsx)
            useEffect(() => {
                let controls = []
        
                if (config.usePath && pathData && pathLength > 0) {
                    if (config.useKeyframes) {
                        const keyframeValues = [0],
                            keyframeTimes = [0],
                            easingArray = []
                        let lastProgress = 0
                        for (let i = 1; i <= config.keyframeCount; i++) {
                            const kf = config.keyframes[i-1]
                            const startTime = kf.startTime || 0
                            const endTime = kf.endTime || 0
                            const endProgress = (kf.endProgress || 0) / 100
                            if (
                                keyframeTimes[keyframeTimes.length - 1] <
                                startTime / config.totalDuration
                            ) {
                                keyframeValues.push(lastProgress)
                                keyframeTimes.push(startTime / config.totalDuration)
                                easingArray.push("linear")
                            }
                            keyframeValues.push(endProgress)
                            keyframeTimes.push(endTime / config.totalDuration)
                            easingArray.push(kf.easing)
                            lastProgress = endProgress
                        }
                        controls.push(
                            animate(progress, keyframeValues, {
                                duration: config.totalDuration,
                                ease: easingArray,
                                times: keyframeTimes,
                                repeat: config.loop ? Infinity : 0,
                                repeatDelay: 0,
                            })
                        )
                    } else {
                        controls.push(
                            animate(progress, [0, 1], {
                                duration: config.pathDuration,
                                ease: config.pathEasing,
                                repeat: config.pathLoop ? Infinity : 0,
                                repeatType: config.pathMirror ? "reverse" : "loop",
                                repeatDelay: 0,
                            })
                        )
                    }
                } else if (!config.usePath) {
                    lightX.set(config.startX)
                    lightY.set(config.startY)
        
                    controls.push(
                        animate(lightX, [config.startX, config.endX], {
                            duration: config.simpleDuration,
                            ease: config.simpleEasing,
                            repeat: Infinity,
                            repeatType: "mirror",
                            repeatDelay: config.simpleDuration / 10,
                        })
                    )
                    controls.push(
                        animate(lightY, [config.startY, config.endY], {
                            duration: config.simpleDuration,
                            ease: config.simpleEasing,
                            repeat: Infinity,
                            repeatType: "mirror",
                            repeatDelay: config.simpleDuration / 10,
                        })
                    )
                }
        
                return () => {
                    controls.forEach((c) => c.stop())
                }
            }, [config, pathData, pathLength, lightX, lightY, progress])
        
            // 4. Transformar el progreso del trazado en X/Y
            useTransform(progress, (p) => {
                if (config.usePath && pathRef.current && pathData && pathLength > 0) {
                    const point = pathRef.current.getPointAtLength(p * pathLength)
                    const { viewBox } = pathData
                    const normX = ((point.x - viewBox.x) / viewBox.width) * 100
                    const normY = ((point.y - viewBox.y) / viewBox.height) * 100
                    lightX.set(normX)
                    lightY.set(normY)
                }
                return p
            })

            // 5. Renderizar un SVG oculto solo para medir el path
            return React.createElement("svg", { width: 0, height: 0, style: { display: "none" } },
                React.createElement("path", {
                    ref: pathRef,
                    d: pathData?.d || "",
                })
            )
        }
        
        // --- ¡NUEVO! COMPONENTE RAÍZ 'App' ---
        function App(props) {
            const { settings, controllerData, paths, items } = props
            
            // 1. Crear el estado compartido (MotionValues) para la luz
            const lightX = useMotionValue(settings.lightSourceX)
            const lightY = useMotionValue(settings.lightSourceY)
            
            let lightControllerElement = null
            
            // 2. Comprobar si hay un controlador de luz y crearlo
            if (controllerData?.lightConfig) {
                lightControllerElement = React.createElement(StandaloneLightController, {
                    config: controllerData.lightConfig,
                    lightX: lightX,
                    lightY: lightY,
                })
            }
            
            // 3. Renderizar la escena Y el controlador (si existe)
            return React.createElement(React.Fragment, null,
                React.createElement(StandaloneAnimator, {
                    settings: settings,
                    paths: paths,
                    items: items,
                    lightX: lightX, // Pasa el MotionValue
                    lightY: lightY, // Pasa el MotionValue
                }),
                lightControllerElement
            )
        }

        // --- 4. Montamos la aplicación ---
        const rootElement = document.getElementById("root")
        const root = ReactDOM.createRoot(rootElement)
        const data = JSON.parse(document.getElementById("animationData").textContent)
        // Renderizamos 'App' en lugar de 'StandaloneAnimator'
        root.render(React.createElement(App, data))
    </script>
</body>
</html>
`
}
