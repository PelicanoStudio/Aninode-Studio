import { proxy } from "valtio"

// --- TIPOS DE LA ARQUITECTURA NODAL ---

/**
 * El estado base de cualquier nodo en el grafo.
 */
export type NodeState = {
    // Tipo de nodo (ej: "SceneAnimatorNode", "LightControllerNode")
    type: string
    // Nombre dado por el usuario (ej: "Mi Animador Principal")
    name: string
    // Nivel 1: Props estáticas leídas del panel de Framer
    baseProps: { [key: string]: any }
    // Nivel 3: Valores dinámicos recibidos desde cables/pickers
    // (Ej: { scale: 2.5 } o { "item_01": { scale: 2.5 } })
    overrides: { [key: string]: any }
    // Valores calculados que este nodo expone a otros
    // (Ej: { time: 10.5, progress: 0.35, x: 50, y: 30 })
    outputs: { [key: string]: any }
    // Metadatos de conexión (para la UI de cables futura)
    connectedInputs: {
        [socketName: string]: {
            sourceNodeId: string
            sourceOutputName: string
        } | null
    }
}

/**
 * Estado de una línea de tiempo global
 */
export type TimelineState = {
    id: string
    isPlaying: boolean
    currentTime: number
    duration: number
}

/**
 * Estado de un preset reutilizable
 */
export type PresetData = {
    id: string
    type: "color" | "easing" | "gradient" | "transform"
    value: any
}

// --- EL STORE CENTRAL DE ANINODE ---

export const aninodeStore = proxy<{
    /**
     * El registro central de cada nodo en el grafo.
     * La clave es el `nodeId`.
     */
    nodes: { [nodeId: string]: NodeState }
    
    /**
     * Registro de líneas de tiempo globales (ej: "default").
     */
    timeline: { [id: string]: TimelineState }
    
    /**
     * Librería de valores reutilizables (ej: easings, colores).
     */
    presets: { 
        [type: string]: { [id: string]: PresetData } 
    }
}>({
    nodes: {},
    timeline: {
        default: {
            id: "default",
            isPlaying: true,
            currentTime: 0,
            duration: 30,
        },
    },
    presets: {},
})