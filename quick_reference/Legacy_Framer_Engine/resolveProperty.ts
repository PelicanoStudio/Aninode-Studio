import { aninodeStore } from "./export_store"
import { subscribe } from "valtio"

/**
 * Resuelve el valor final de una propiedad para un nodo,
 * siguiendo la Jerarquía de 3 Niveles.
 * * @param nodeId El ID del nodo que posee la propiedad.
 * @param propName El nombre de la propiedad a resolver (ej: "groupScale").
 * @param defaultVal Un valor por defecto si no se encuentra nada.
 * @returns El valor final resuelto.
 */
export function resolveProperty(
    nodeId: string,
    propName: string,
    defaultVal: any
) {
    const node = aninodeStore.nodes[nodeId]
    if (!node) return defaultVal

    // 1. Prioridad 1 (Nivel 3 - Override)
    // ¿Existe un override para esta propiedad?
    if (node.overrides[propName] !== undefined) {
        return node.overrides[propName]
    }

    // 2. Prioridad 2 (Nivel 2 - Preset)
    // (Aún no implementado, pero aquí iría la lógica)
    const basePropValue = node.baseProps[propName]
    if (typeof basePropValue === "string" && basePropValue.startsWith("preset:")) {
        // ...lógica para buscar en aninodeStore.presets...
        // Por ahora, solo devolvemos el valor base
    }
    
    // 3. Prioridad 3 (Nivel 1 - Base Prop)
    // Si no hay override, usamos el valor de las props base
    if (basePropValue !== undefined) {
        return basePropValue
    }

    // 4. Valor por defecto
    return defaultVal
}

/**
 * Resuelve el valor final de una propiedad para un ITEM dentro de un nodo,
 * (ej: "item_3" dentro de "sceneAnimator1").
 * * @param nodeId El ID del nodo contenedor (ej: "sceneAnimator1").
 * @param itemId El ID del item interno (ej: "item_3").
 * @param propName El nombre de la propiedad (ej: "scale").
 * @param defaultVal Valor por defecto.
 * @returns El valor final resuelto.
 */
export function resolveItemProperty(
    nodeId: string,
    itemId: string,
    propName: string,
    defaultVal: any
) {
    const node = aninodeStore.nodes[nodeId]
    if (!node) return defaultVal

    // 1. Prioridad 1 (Nivel 3 - Override de Item)
    // ¿Existe un override específico para este item?
    if (node.overrides[itemId]?.[propName] !== undefined) {
        return node.overrides[itemId][propName]
    }

    // 2. Prioridad 1.5 (Nivel 3 - Override Global del Nodo)
    // ¿Existe un override global en el nodo que aplique a todos?
    // (Ej: "activateShadow" global aplica a todos los items)
    if (node.overrides[propName] !== undefined) {
        return node.overrides[propName]
    }

    // 3. Prioridad 2 (Nivel 2 - Preset)
    // (Aún no implementado)
    const basePropKey = `${propName}${itemId}` // (ej: "scale3")
    const basePropValue = node.baseProps[basePropKey] ?? node.baseProps[propName]
    
    // 4. Prioridad 3 (Nivel 1 - Base Prop)
    if (basePropValue !== undefined) {
        return basePropValue
    }

    // 5. Valor por defecto
    return defaultVal
}