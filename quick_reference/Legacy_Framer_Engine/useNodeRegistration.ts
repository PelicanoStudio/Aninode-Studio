import { useEffect, useRef } from "react"
import { aninodeStore, NodeState } from "./export_store" // Importamos el nuevo store

/**
 * Hook personalizado para registrar y desregistrar un nodo en el store central.
 * @param nodeId ID único para este nodo. Si es nulo o vacío, el hook no hace nada.
 * @param nodeType Tipo de nodo (ej: "SceneAnimatorNode")
 * @param props Las props completas del componente (serán las baseProps)
 */
export function useNodeRegistration(
    nodeId: string | null | undefined,
    nodeType: string,
    props: any
) {
    const propsRef = useRef(props)
    propsRef.current = props

    useEffect(() => {
        // Si no hay nodeId, simplemente no hacemos nada.
        // Esto permite que el mismo hook se use en "obreros"
        // (que pueden no tener ID) y "receptores" (que sí lo tienen).
        if (!nodeId) {
            return
        }

        // 1. REGISTRO AL MONTAR
        const newNodeState: NodeState = {
            type: nodeType,
            name: props.name || nodeId,
            baseProps: { ...propsRef.current },
            overrides: {},
            outputs: {}, // Importante: Inicializamos los outputs
            connectedInputs: {},
        }
        
        aninodeStore.nodes[nodeId] = newNodeState
        console.log(`[Aninode] Nodo registrado: ${nodeId} (Tipo: ${nodeType})`)

        // 2. LIMPIEZA AL DESMONTAR
        return () => {
            delete aninodeStore.nodes[nodeId]
            console.log(`[Aninode] Nodo des-registrado: ${nodeId}`)
        }
    }, [nodeId, nodeType])

    // Actualizar baseProps si las props cambian
    useEffect(() => {
        if (nodeId && aninodeStore.nodes[nodeId]) {
            aninodeStore.nodes[nodeId].baseProps = { ...propsRef.current }
        }
    }, [nodeId, props])
}