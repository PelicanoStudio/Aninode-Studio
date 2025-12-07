import React, { useEffect, useMemo, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { aninodeStore } from "./export_store.ts"
import { useNodeRegistration } from "./useNodeRegistration.ts"
import { subscribe } from "valtio"

type Props = {
    nodeId: string
    name: string
    sourceNodeId: string
    targetNodeId: string
    targetObjectId: string
    mappingMode: "Auto" | "Custom"
    customSourceProps: string 
    customTargetProps: string 
}

/**
 * Componente Headless (solo lógica) que actúa como un "cable" inteligente.
 * Lee un 'preset' comunicado por el nodo fuente (PULL)
 * y escribe en 'overrides' de un nodo objetivo (PUSH).
 * ESTA VERSIÓN CORRIGE EL BUG DE COLISIÓN DE MÚLTIPLES PICKERS.
 */
export default function ObjectPickerNode(props: Props) {
    const {
        nodeId,
        sourceNodeId,
        targetNodeId,
        targetObjectId,
        mappingMode,
        customSourceProps,
        customTargetProps,
    } = props

    // 1. Registrarse a sí mismo
    useNodeRegistration(nodeId, "ObjectPickerNode", props)

    // 2. Lógica de PULL (preset) y PUSH (valores)
    useEffect(() => {
        // Todas las dependencias de props están en este array.
        // Si CUALQUIERA de ellas cambia, el efecto se re-ejecuta
        // limpiando el anterior y creando uno nuevo.
        
        if (!sourceNodeId || !targetNodeId) {
            return
        }

        let isValueSubscribed = false
        let unsubscribeValues = () => {}
        let unsubscribeSourceNode = () => {}
        
        // --- ¡LÓGICA MOVIDA DENTRO DEL EFFECT! ---
        // 'propertyMap' se calcula aquí y es "congelado"
        // para la vida de este efecto y su limpieza.
        let propertyMap: Record<string, string> = {}
        
        // --- Funciones de Limpieza y Actualización ---
        // Estas funciones usarán el 'propertyMap' de su "cierre" (closure)
        
        const updateTargets = (sourceOutputs: { [key: string]: any }) => {
            const targetNode = aninodeStore.nodes[targetNodeId]
            if (!targetNode || Object.keys(propertyMap).length === 0) return

            for (const [sourceKey, targetKey] of Object.entries(propertyMap)) {
                const newValue = sourceOutputs[sourceKey]
                if (newValue !== undefined) {
                    if (targetObjectId) {
                        if (!targetNode.overrides[targetObjectId]) {
                            targetNode.overrides[targetObjectId] = {}
                        }
                        targetNode.overrides[targetObjectId][targetKey] = newValue
                    } else {
                        targetNode.overrides[targetKey] = newValue
                    }
                }
            }
        }

        const clearTargets = () => {
            const targetNode = aninodeStore.nodes[targetNodeId]
            if (!targetNode || Object.keys(propertyMap).length === 0) return

            for (const targetKey of Object.values(propertyMap)) {
                const key = targetKey as string
                if (targetObjectId) {
                    if (targetNode.overrides[targetObjectId]) {
                        delete targetNode.overrides[targetObjectId][key]
                    }
                } else {
                    delete targetNode.overrides[key]
                }
            }
        }

        // --- Suscripción reactiva ---
        const trySubscribe = () => {
            const sourceNode = aninodeStore.nodes[sourceNodeId]
            if (sourceNode) {
                // El nodo fuente existe, ¡configuremos el mapeo!
                if (mappingMode === "Custom") {
                    const sourceProps = customSourceProps ? customSourceProps.split(",").map(p => p.trim()) : []
                    const targetProps = customTargetProps ? customTargetProps.split(",").map(p => p.trim()) : []
                    sourceProps.forEach((sourceKey, index) => {
                        const targetKey = targetProps[index]
                        if (sourceKey && targetKey) propertyMap[sourceKey] = targetKey
                    })
                } else { // Modo "Auto"
                    const preset = sourceNode.outputs.__autoMappingPreset
                    if (preset) {
                        propertyMap = preset
                    } else {
                        // Si el preset no está listo, espiamos hasta que aparezca
                        unsubscribeSourceNode = subscribe(sourceNode.outputs, () => {
                            const newPreset = sourceNode.outputs.__autoMappingPreset
                            if (newPreset) {
                                propertyMap = newPreset // Actualizamos el mapa
                                unsubscribeSourceNode() // Dejamos de espiar
                                updateTargets(sourceNode.outputs) // Hacemos un update
                            }
                        })
                    }
                }

                // Ahora que tenemos el mapa (o esperamos por él), nos suscribimos a los valores
                isValueSubscribed = true
                unsubscribeValues = subscribe(sourceNode.outputs, () => {
                    updateTargets(sourceNode.outputs)
                })
                
                updateTargets(sourceNode.outputs) // Update inicial
                return true 
            }
            return false // El nodo fuente no existe, reintentar
        }
        
        const masterSub = subscribe(aninodeStore.nodes, () => {
            if (!isValueSubscribed) {
                const success = trySubscribe()
                if (success) masterSub() 
            }
        })

        const success = trySubscribe()
        if (success) masterSub()
        
        // 4. Limpieza
        // Esta función se llamará CADA VEZ que una prop cambie
        // (ej: si el usuario cambia 'targetObjectId')
        return () => {
            masterSub() 
            unsubscribeSourceNode()
            if (isValueSubscribed) unsubscribeValues() 
            // Limpiamos los overrides ANTES de que el nuevo efecto se aplique
            clearTargets() 
        }
    }, [
        // ¡DEPENDENCIAS ESTABLES! (Solo props)
        nodeId,
        sourceNodeId,
        targetNodeId,
        targetObjectId,
        mappingMode,
        customSourceProps,
        customTargetProps,
    ])

    return <div style={{ display: "none" }} />
}

// --- (Default Props y Controles sin cambios) ---
ObjectPickerNode.defaultProps = {
    nodeId: "picker1",
    name: "Object Picker",
    mappingMode: "Auto",
}

addPropertyControls(ObjectPickerNode, {
    nodeId: {
        type: ControlType.String,
        title: "Node ID (Propio)",
        defaultValue: "picker1",
    },
    name: {
        type: ControlType.String,
        title: "Nombre",
        defaultValue: "Object Picker",
    },
    sourceNodeId: {
        type: ControlType.String,
        title: "Source Node ID",
        description: "ID del nodo del cual 'sustraer' los valores.",
    },
    targetNodeId: {
        type: ControlType.String,
        title: "Target Node ID",
        description: "ID del nodo al que queremos 'apuntar'.",
    },
    targetObjectId: {
        type: ControlType.String,
        title: "Target Object ID (Opc)",
        description: "ID del item *dentro* del nodo (ej: 'item_3', '1', '2'). Dejar vacío para apuntar al nodo global.",
    },
    mappingMode: {
        type: ControlType.Enum,
        title: "Modo de Mapeo",
        options: ["Auto", "Custom"],
        defaultValue: "Auto",
        description: "Auto: Detecta el tipo de fuente. Custom: Mapeo manual."
    },
    customSourceProps: {
        type: ControlType.String,
        title: "Source Props (Custom)",
        description: "Nombres de outputs a leer, separados por coma (ej: 'x, y, value').",
        hidden: (props) => props.mappingMode !== "Custom",
    },
    customTargetProps: {
        type: ControlType.String,
        title: "Target Props (Custom)",
        description: "Nombres de overrides a escribir, separados por coma (ej: 'lightSourceX, lightSourceY, scale').",
        hidden: (props) => props.mappingMode !== "Custom",
    },
})