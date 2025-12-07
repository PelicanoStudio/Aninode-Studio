import React, { useEffect } from "react"
import { addPropertyControls, ControlType, animate } from "framer"
// Asegurándonos de que las importaciones tengan .ts
import { aninodeStore } from "./export_store.ts"
import { useNodeRegistration } from "./useNodeRegistration.ts"
import { useMotionValue } from "framer-motion"

type Props = {
    nodeId: string
    name: string
    isEnabled: boolean
    waveform: "sin" | "cos" | "saw" | "triangle"
    frequency: number
    min: number
    max: number
}

// --- El preset que ESTE nodo comunica ---
const AUTO_MAPPING_PRESET = {
    value: "value", // Mapea mi 'value' a 'value' (genérico)
}

export default function LFO_Node(props: Props) {
    const { nodeId, name, isEnabled, waveform, frequency, min, max } = props

    // 1. Registrarse a sí mismo
    useNodeRegistration(nodeId, "LFO_Node", props)

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // El Hook 'useMotionValue' se mueve al nivel superior del componente.
    const progress = useMotionValue(0)
    // ---------------------------------

    // 2. Publicar el Preset de Mapeo
    useEffect(() => {
        if (!nodeId) return
        const registerPreset = () => {
            if (aninodeStore.nodes[nodeId]) {
                aninodeStore.nodes[nodeId].outputs.__autoMappingPreset = AUTO_MAPPING_PRESET
            } else {
                setTimeout(registerPreset, 10)
            }
        }
        registerPreset()
        return () => {
            if (aninodeStore.nodes[nodeId]?.outputs) {
                delete aninodeStore.nodes[nodeId].outputs.__autoMappingPreset
            }
        }
    }, [nodeId])

    // 3. Lógica de Oscilación
    useEffect(() => {
        if (!isEnabled || !nodeId) {
            // Si está deshabilitado, detenemos todo y reseteamos
            if (aninodeStore.nodes[nodeId]) {
                 aninodeStore.nodes[nodeId].outputs.value = min
            }
            return
        }

        // 'progress' ya existe en este scope (viene de arriba)
        
        // Escuchamos los cambios en 'progress'
        const unsubscribe = progress.onChange((latest) => {
            let v = 0
            switch (waveform) {
                case "cos":
                    v = (Math.cos(latest * Math.PI * 2) + 1) / 2
                    break
                case "saw":
                    v = latest
                    break
                case "triangle":
                    v = latest < 0.5 ? latest * 2 : (1 - latest) * 2
                    break
                case "sin":
                default:
                    v = (Math.sin(latest * Math.PI * 2) + 1) / 2
                    break
            }

            const result = v * (max - min) + min
            
            if (aninodeStore.nodes[nodeId]) {
                aninodeStore.nodes[nodeId].outputs.value = result
            }
        })

        const duration = 1 / frequency
        
        // Reiniciamos 'progress' a 0 antes de animar
        progress.set(0)
        
        const controls = animate(progress, 1, {
            duration: duration,
            ease: "linear",
            repeat: Infinity,
        })

        // 4. Limpieza
        return () => {
            controls.stop()
            unsubscribe()
        }
    }, [
        nodeId, 
        isEnabled, 
        waveform, 
        frequency, 
        min, 
        max, 
        progress // <--- Añadimos 'progress' a las dependencias
    ])

    // Devolvemos un div invisible
    return <div style={{ display: "none" }} />
}

// --- (Default Props y Controles sin cambios) ---

LFO_Node.defaultProps = {
    nodeId: "lfo1",
    name: "LFO",
    isEnabled: true,
    waveform: "sin",
    frequency: 0.5,
    min: 0,
    max: 1,
}

addPropertyControls(LFO_Node, {
    nodeId: {
        type: ControlType.String,
        title: "Node ID (Propio)",
        defaultValue: "lfo1",
    },
    name: {
        type: ControlType.String,
        title: "Nombre",
        defaultValue: "LFO",
    },
    isEnabled: {
        type: ControlType.Boolean,
        title: "Habilitar",
        defaultValue: true,
    },
    waveform: {
        type: ControlType.Enum,
        title: "Forma de Onda",
        options: ["sin", "cos", "saw", "triangle"],
        defaultValue: "sin",
    },
    frequency: {
        type: ControlType.Number,
        title: "Frecuencia (Hz)",
        defaultValue: 0.5,
        min: 0.01, // Evitar división por cero
        max: 50,
        step: 0.1,
    },
    min: {
        type: ControlType.Number,
        title: "Mínimo",
        defaultValue: 0,
    },
    max: {
        type: ControlType.Number,
        title: "Máximo",
        defaultValue: 1,
    },
})