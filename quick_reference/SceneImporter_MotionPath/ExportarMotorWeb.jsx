#target photoshop

// ============================================================================
// EXPORTADOR WEB v6.0 (Fix: Merge Recursivo + Crash Recovery)
// ============================================================================

// Polyfill JSON
if (typeof JSON !== "object") { JSON = {}; }
(function () { "use strict"; function quote(string) { var rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; var meta = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", "\"": "\\\"", "\\": "\\\\" }; rx_escapable.lastIndex = 0; return rx_escapable.test(string) ? "\"" + string.replace(rx_escapable, function (a) { var c = meta[a]; return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4); }) + "\"" : "\"" + string + "\""; } if (typeof JSON.stringify !== "function") { JSON.stringify = function (value, replacer, space) { var i; gap = ""; indent = ""; if (typeof space === "number") { for (i = 0; i < space; i += 1) { indent += " "; } } else if (typeof space === "string") { indent = space; } rep = replacer; if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) { throw new Error("JSON.stringify"); } return str("", { "": value }); }; } function str(key, holder) { var i, k, v, length, mind = gap, partial, value = holder[key]; if (value && typeof value === "object" && typeof value.toJSON === "function") { value = value.toJSON(key); } if (typeof rep === "function") { value = rep.call(holder, key, value); } switch (typeof value) { case "string": return quote(value); case "number": return isFinite(value) ? String(value) : "null"; case "boolean": case "null": return String(value); case "object": if (!value) { return "null"; } gap += indent; partial = []; if (Object.prototype.toString.apply(value) === "[object Array]") { length = value.length; for (i = 0; i < length; i += 1) { partial[i] = str(i, value) || "null"; } v = partial.length === 0 ? "[]" : "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"; gap = mind; return v; } if (rep && typeof rep === "object") { length = rep.length; for (i = 0; i < length; i += 1) { k = rep[i]; if (typeof k === "string") { v = str(k, value); if (v) { partial.push(quote(k) + (gap ? ": " : ":") + v); } } } } else { for (k in value) { if (Object.prototype.hasOwnProperty.call(value, k)) { v = str(k, value); if (v) { partial.push(quote(k) + (gap ? ": " : ":") + v); } } } } v = partial.length === 0 ? "{}" : "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"; gap = mind; return v; } } var gap, indent, rep; }());

// --- CONFIGURACIÓN ---
var originalUnit = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.PIXELS;
var doc = app.activeDocument;
var exportFolder = Folder.selectDialog("Selecciona carpeta de destino");
var globalID = 0;
var assetList = [];
// Snapshot inicial para restauración garantizada
var initialSnapshot = null;

if (exportFolder) {
    try {
        main();
    } catch (e) {
        alert("ERROR CRÍTICO: " + e.message + "\nLínea: " + e.line);
    } finally {
        // RESTAURACIÓN DE SEGURIDAD (Se ejecuta SIEMPRE, incluso si falla)
        if (initialSnapshot) {
            doc.activeHistoryState = initialSnapshot;
        }
        // Asegurar que todo quede visible al final
        makeAllVisible(doc);
        app.preferences.rulerUnits = originalUnit;
    }
}

function main() {
    // 1. Guardar estado inicial
    initialSnapshot = doc.activeHistoryState;

    var jsonOutput = {
        "project": doc.name.replace(/\.[^\.]+$/, ''),
        "canvas": { "width": parseInt(doc.width.value), "height": parseInt(doc.height.value) },
        "assets": []
    };

    // 2. Ocultar todo para empezar
    hideAllLayers(doc);

    // 3. Procesar (El núcleo del script)
    scanGroup(doc.layers);

    // 4. JSON Final
    for(var k=0; k<assetList.length; k++){ assetList[k].zIndex = assetList.length - k; }
    jsonOutput.assets = assetList;

    var jsonFile = new File(exportFolder + "/data.json");
    jsonFile.encoding = "UTF-8";
    jsonFile.open("w");
    jsonFile.write(JSON.stringify(jsonOutput, null, 4));
    jsonFile.close();

    alert("¡Exportación Exitosa!\nSe exportaron " + assetList.length + " assets.");
}

// --- FUNCIONES DE RECORRIDO ---

function scanGroup(layerCollection) {
    for (var i = 0; i < layerCollection.length; i++) {
        var layer = layerCollection[i];

        // Lógica de decisión
        if (layer.typename == "LayerSet") {
            if (layer.name.indexOf("@Merge") !== -1) {
                // Es un Grupo Merge: PROCESAR COMO UNO SOLO
                processMergedGroup(layer);
            } else {
                // Es un Grupo Normal: ENTRAR
                scanGroup(layer.layers);
            }
        } 
        else if (layer.typename == "ArtLayer") {
            // Es una capa normal
            if (layer.isBackgroundLayer && !layer.visible) continue;
            processSingleLayer(layer);
        }
    }
}

// --- PROCESADORES ---

function processMergedGroup(groupLayer) {
    // 1. Preparar visibilidad: Encender padres
    showParents(groupLayer);
    
    // 2. CRÍTICO: Duplicar el grupo ANTES de hacer nada destructivo
    var tempGroup = groupLayer.duplicate();
    
    // 3. Encender el grupo temporal y TODOS sus hijos (Fix Capa Negra)
    // Al duplicar un grupo oculto, los hijos vienen ocultos. Hay que prenderlos.
    tempGroup.visible = true;
    makeAllVisible(tempGroup); 

    // 4. Fusionar (Merge)
    // Esto convierte el grupo y sus efectos en una sola capa Raster
    var mergedLayer = tempGroup.merge();
    mergedLayer.name = groupLayer.name; // Restaurar nombre original

    // 5. Exportar esa capa resultante
    exportOperations(mergedLayer, true);

    // 6. Limpieza: La capa merged se elimina al restaurar el historial en exportOperations
    // Pero como exportOperations hace un "undo" local, debemos asegurarnos de que
    // nuestra capa temporal desaparezca.
    // En este flujo, la capa temporal 'mergedLayer' vive en el documento activo.
    mergedLayer.remove();
    
    // Re-ocultar padres para no contaminar
    hideParents(groupLayer);
}

function processSingleLayer(layer) {
    showParents(layer);
    layer.visible = true;
    
    exportOperations(layer, false);
    
    layer.visible = false;
    hideParents(layer);
}

// --- OPERACIONES DE EXPORTACIÓN (COMUNES) ---

function exportOperations(targetLayer, isMerged) {
    globalID++;
    
    // Metadatos
    var layerName = targetLayer.name;
    var blendMode = "normal";
    if (layerName.indexOf("@Add") !== -1) blendMode = "add";
    if (layerName.indexOf("@Multiply") !== -1) blendMode = "multiply";
    var cleanName = layerName.replace(/\s*@\w+(\(.*\))?/g, "").replace(/[^a-z0-9_]/gi, '_');

    // Snapshot local para deshacer el Trim
    var localState = doc.activeHistoryState;

    // Geometría Original (Antes de Trim)
    // Si es merged, el bounds es el del contenido visible del grupo
    var b_orig = targetLayer.bounds;
    var x_orig = b_orig[0].value;
    var y_orig = b_orig[1].value;

    // --- REVEAL ALL & TRIM ---
    try {
        doc.revealAll();
        doc.trim(TrimType.TRANSPARENT, true, true, true, true);
    } catch(e) {
        // Si trim falla (capa vacía), abortamos esta capa pero no el script
        doc.activeHistoryState = localState;
        return;
    }

    // Datos finales
    var w_final = doc.width.value;
    var h_final = doc.height.value;

    // Guardar
    var fileName = cleanName + "_" + globalID + ".png";
    var fullPath = exportFolder + "/" + fileName;
    savePNG(doc, fullPath);

    // Restaurar estado (Deshacer trim)
    doc.activeHistoryState = localState;

    // Guardar en lista
    assetList.push({
        "id": globalID, "name": cleanName, "file": fileName,
        "x": Math.round(x_orig), "y": Math.round(y_orig),
        "width": Math.round(w_final), "height": Math.round(h_final),
        "opacity": Math.round((targetLayer.opacity / 100.0) * 100) / 100,
        "blendMode": blendMode, "zIndex": 0
    });
}


// --- UTILIDADES VISIBILIDAD ---

function hideAllLayers(obj) {
    for (var i = 0; i < obj.layers.length; i++) {
        var l = obj.layers[i];
        if (!l.isBackgroundLayer) l.visible = false;
        if (l.typename == "LayerSet") hideAllLayers(l);
    }
}

function makeAllVisible(obj) {
    // Enciende recursivamente todo dentro de un objeto (útil para grupos duplicados)
    if(obj.layers){
        for (var i = 0; i < obj.layers.length; i++) {
            var l = obj.layers[i];
            l.visible = true;
            if (l.typename == "LayerSet") makeAllVisible(l);
        }
    }
}

function showParents(layer) {
    var p = layer.parent;
    while (p != doc) { p.visible = true; p = p.parent; }
}

function hideParents(layer) {
    var p = layer.parent;
    while (p != doc) { p.visible = false; p = p.parent; }
}

function savePNG(doc, path) {
    var pngOpts = new ExportOptionsSaveForWeb();
    pngOpts.format = SaveDocumentType.PNG;
    pngOpts.PNG8 = false; 
    pngOpts.transparency = true;
    pngOpts.quality = 100;
    doc.exportDocument(new File(path), ExportType.SAVEFORWEB, pngOpts);
}