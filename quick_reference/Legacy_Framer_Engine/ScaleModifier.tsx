import React, { useEffect, useMemo } from "react"
import { addPropertyControls, ControlType } from "framer"
import { aninodeStore } from "./export_store.ts"
import { useNodeRegistration } from "./useNodeRegistration.ts"
import { useSnapshot }from "valtio"

type Props = {
    nodeId: string
    name: string
    // --- NUEVAS PROPS DE MODIFICADOR ---
    sourceNodeId: string     // El SceneExporter (para leer la escala base)
    sourceObjectId: string   // El item (ej: "1", "2")
    sourcePropertyName: string // La prop (ej: "scale")
    // ---
    inputMode: "Value" | "Picker"
    inputValue: number // Un slider simple
    inputPickerNodeId: string // Un LFO, etc.
    // ---
    operation: "Multiply" | "Add" | "Subtract" | "Set"
}

// --- ¡El preset que ESTE nodo comunica! ---
const AUTO_MAPPING_PRESET = {
    value: "scale", // Mapea mi 'value' a la prop 'scale' del objetivo
    // (Podríamos añadir 'valueX' -> 'scaleX' en el futuro)
}

export default function ScaleModifierNode(props: Props) {
    const {
        nodeId,
        name,
        sourceNodeId,
        sourceObjectId,
        sourcePropertyName,
        inputMode,
        inputValue,
        inputPickerNodeId,
        operation,
    } = props

    // 1. Registrarse a sí mismo
    useNodeRegistration(nodeId, "ScaleModifierNode", props)
    
    // 2. Suscribirse al store para leer valores
    const snap = useSnapshot(aninodeStore)

    // 3. Publicar el Preset de Mapeo (igual que LightController)
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

    // 4. Lógica de Modificación
    useEffect(() => {
        if (!nodeId) return

        // --- A. Determinar el valor de entrada (Input) ---
        let input = inputValue // Por defecto, el slider (Nivel 1)
        if (inputMode === "Picker") {
            // "Sustraer" el valor de un Picker (Nivel 3 override)
            const overrideValue = snap.nodes[nodeId]?.overrides.value
            if (overrideValue !== undefined) {
                input = overrideValue
            } else {
                // Si no hay override, buscar el picker conectado
                const pickerNode = snap.nodes[inputPickerNodeId]
                input = pickerNode?.outputs.value || 0
            }
        }

        // --- B. "Sustraer" el valor Original (Base) ---
        let baseValue = 1 // Default
        const sourceNode = snap.nodes[sourceNodeId]
        if (sourceNode) {
            if (sourceObjectId) {
                // Leer del Nivel 1 (baseProps) del item
                baseValue = sourceNode.baseProps[`${sourcePropertyName}${sourceObjectId}`] || 1
            } else {
                // Leer del Nivel 1 (baseProps) del nodo global
                baseValue = sourceNode.baseProps[sourcePropertyName] || 1
            }
        }

        // --- C. Realizar la Operación ---
        let result = 0
        switch (operation) {
            case "Multiply":
                result = baseValue * input
                break
            case "Add":
                result = baseValue + input
                break
            case "Subtract":
                result = baseValue - input
                break
            case "Set":
                result = input
                break
        }

        // --- D. Publicar el resultado ---
        aninodeStore.nodes[nodeId].outputs.value = result

    }, [
        nodeId,
        snap, // Reacciona a cualquier cambio en el store
        sourceNodeId,
        sourceObjectId,
        sourcePropertyName,
        inputMode,
        inputValue,
        inputPickerNodeId,
        operation,
    ])
    
    // Devolvemos un div invisible
    return <div style={{ display: "none" }} />
}

ScaleModifierNode.defaultProps = {
    nodeId: "scaleMod1",
    name: "Scale Modifier",
    sourcePropertyName: "scale",
    inputMode: "Value",
    inputValue: 1,
    operation: "Multiply",
}

addPropertyControls(ScaleModifierNode, {
    nodeId: {
        type: ControlType.String,
        title: "Node ID (Propio)",
        defaultValue: "scaleMod1",
    },
    name: {
        type: ControlType.String,
        title: "Nombre",
        defaultValue: "Scale Modifier",
    },
    sourceNodeId: {
        type: ControlType.String,
        title: "Source Node",
        description: "El nodo del cual 'sustraer' el valor base (ej: sceneAnimator1)",
    },
    sourceObjectId: {
        type: ControlType.String,
        title: "Source Object ID",
        description: "El item a leer (ej: '1', '2', '3')",
    },
    sourcePropertyName: {
        type: ControlType.String,
        title: "Source Property",
        description: "La propiedad a leer (ej: 'scale')",
        defaultValue: "scale",
    },
    operation: {
        type: ControlType.Enum,
        title: "Operación",
        options: ["Multiply", "Add", "Subtract", "Set"],
        defaultValue: "Multiply",
    },
    inputMode: {
        type: ControlType.Enum,
        title: "Input Mode",
        options: ["Value", "Picker"],
        defaultValue: "Value",
    },
    inputValue: {
        type: ControlType.Number,
        title: "Input Value",
        defaultValue: 1,
        hidden: (props) => props.inputMode !== "Value",
    },
    inputPickerNodeId: {
        type: ControlType.String,
        title: "Input Picker ID",
        description: "ID de un Picker que trae un valor (ej: de un LFO)",
        hidden: (props) => props.inputMode !== "Picker",
    },
})