# Arquitectura de Aninode Design System

## 📋 Visión General

**Aninode** es una librería de UI de **flujo nodal** diseñada para crear interfaces de control basadas en nodos. Simula un motor de animación procedural con un canvas infinito, sistema de conexiones inteligentes y soporte completo para dispositivos móviles y táctiles.

### Características Principales
- 🎨 **Estética OLED Black**: Tema oscuro de alto contraste con acentos neón
- ♾️ **Canvas Infinito**: Navegación fluida con zoom y paneo
- 🔗 **Sistema de Conexiones**: Wiring inteligente con múltiples tipos de cables
- 📡 **Teleportación de Propiedades**: Binding inalámbrico de valores entre nodos
- 📱 **Soporte Touch/Mobile**: Gestos táctiles, pinch-zoom y detección automática de dispositivos
- ⏱️ **Flujo de Señales**: Visualización dinámica de cadenas upstream/downstream
- 📋 **Historial**: Sistema robusto de Undo/Redo
- 🔄 **Multi-Selección y Clipboard**: Copiar/Pegar nodos preservando configuración

---

## 🏗️ Estructura de Carpetas

```
aninode-design-system/
├── components/
│   ├── canvas/
│   │   ├── CanvasBackground.tsx          # Grid (Dots/Lines/Cross) con tema adaptativo
│   │   └── ConnectionLine.tsx             # Renderizado de cables entre puertos
│   ├── nodes/
│   │   ├── BaseNode.tsx                   # Componente base con puertos (Input/Output)
│   │   ├── NodeContent.tsx                # Contenido específico por tipo de nodo
│   │   └── Visualizer.tsx                 # Vista previa/debugging de nodos
│   ├── ui/
│   │   ├── Header.tsx                     # Barra superior con controles globales
│   │   ├── NodePicker.tsx                 # Modal para crear nuevos nodos (Shift+Tab)
│   │   ├── ShortcutsPanel.tsx             # Panel colapsable con atajos de teclado
│   │   └── Input.tsx                      # Componente input reutilizable
│   └── SidePanel.tsx                      # Inspector de propiedades (derecha)
├── hooks/
│   ├── usePinchZoom.ts                    # Gestos táctiles (pinch-to-zoom)
│   └── useLongPress.ts                    # Detección de long-press (hold)
├── utils/
│   ├── deviceDetection.ts                 # Detección de móvil/tablet
│   ├── geometry.ts                        # Cálculos (intersecciones, rayos)
│   └── menuPosition.ts                    # Posicionamiento inteligente de menús
├── App.tsx                                # Orquestador principal
├── types.ts                               # Tipos TypeScript
├── constants.ts                           # Colores, tamaños, paletas
├── index.tsx                              # Punto de entrada
├── vite.config.ts                         # Configuración de Vite
└── package.json                           # Dependencias
```

---

## 🔌 Tipos y Interfaces Clave

### Enums

#### `NodeType`
Define los 9 tipos de nodos disponibles:
```typescript
- PICKER: Selector de imagen/entrada visual
- OSCILLATOR: LFO (Low Frequency Oscillator)
- TRANSFORM: Modificador (escala, rotación, etc.)
- OUTPUT: Visualizador de salida
- LOGIC: Operaciones lógicas (AND, OR, etc.)
- SLIDER: Control deslizante
- NUMBER: Campo numérico
- BOOLEAN: Switch/Toggle
- CLONE: Instancia clonada (generada con Ctrl+Alt+Drag)
```

#### `ConnectionType`
5 estilos de cables para diferentes usos:
```typescript
- BEZIER: Curva suave (señales continuas)
- STRAIGHT: Línea recta (propiedades teleportadas)
- STEP: Enrutamiento ortogonal (lógica)
- DOUBLE: Doble línea con gap (datos complejos)
- DOTTED: Punteada (señales auxiliares)
```

#### `GridType`
Estilos visuales del canvas:
```typescript
- DOTS: Puntos dispersos
- LINES: Cuadrícula de líneas
- CROSS: Cruces (por defecto)
```

### Interfaces Principales

#### `NodeData`
```typescript
interface NodeData {
  id: string;                              // Identificador único
  type: NodeType;                          // Tipo de nodo
  label: string;                           // Nombre personalizado
  position: { x: number; y: number };     // Coordenadas en canvas
  collapsed?: boolean;                     // Si está colapsado
  value?: any;                             // Valor actual
  config: Record<string, any>;             // Configuración específica por tipo
  boundProps?: Record<string, {            // Bindings de propiedades
    targetNodeId: string;
    targetProp: string;
  }>;
}
```

#### `Connection`
```typescript
interface Connection {
  id: string;              // Identificador único
  source: string;          // ID del nodo origen
  target: string;          // ID del nodo destino
  type: ConnectionType;    // Estilo de cable
}
```

#### `Position`
```typescript
interface Position {
  x: number;
  y: number;
}
```

---

## 🎯 Flujo de Estado Principal (App.tsx)

### Estado Gestado
```typescript
// Canvas & Nodes
nodes: NodeData[]
connections: Connection[]
selectedIds: Set<string>

// Navigation
viewport: { x: number; y: number; zoom: number }

// History
history: HistoryState[]
historyIndex: number

// UI State
isDarkMode: boolean
gridType: GridType
activeMenu: 'MAIN' | 'CONNECTION' | 'DISCONNECT' | 'PORT' | null
isNodePickerOpen: boolean
clipboard: NodeData[]

// Context Menu Data
menuData: { x: number; y: number; ... }
```

### Operaciones Principales

#### Gestión de Nodos
- **Crear**: `addNode(type, label)` → Añade a state y actualiza history
- **Eliminar**: `deleteNode(id)` → Remueve nodo y sus conexiones
- **Actualizar**: `updateNode(id, data)` → Modifica configuración
- **Duplicar**: Con clipboard (Ctrl+C / Ctrl+V)
- **Clonar Rápido**: Ctrl+Alt+Drag desde output port

#### Gestión de Conexiones
- **Crear**: Click en port → drag → click en otro port
- **Validar**: One-to-One restriction + type checking
- **Visualizar**: Resalte dinámico de cadenas (upstream/downstream)
- **Conversión Automática**: Boolean (0/1) → Percentage (0-100%)

#### Navigation
- **Pan**: Click derecho + drag / Touch drag
- **Zoom**: Mouse wheel / Pinch gesture
- **Focus**: F (selección) / Shift+F (todo)
- **Bounds**: Mantiene viewport dentro de límites lógicos

#### History
- **Undo**: Ctrl+Z → `historyIndex--`
- **Redo**: Ctrl+Y → `historyIndex++`
- **Save State**: Después de cualquier mutación
- **Max History**: 50 estados (FIFO ring buffer)

---

## 📱 Componentes Principales

### 1. **BaseNode.tsx**
Componente base para todos los nodos.

**Props Clave:**
```typescript
data: NodeData                           // Datos del nodo
isSelected: boolean                      // Si está seleccionado
isActiveChain: boolean                   // Si está en cadena visible
accentColor: string                      // Color neón (de paleta)
zoom: number                             // Escala del viewport
isDarkMode: boolean                      // Tema

// Handlers
onSelect: (id: string) => void          // Click en nodo
onToggleCollapse: (id: string) => void  // Expandir/Colapsar
onPortDown/Up: (id, type, e) => void    // Drag desde puerto
onNodeDown: (e) => void                 // Drag del nodo
```

**Features:**
- ✨ Border + glow dinámicos según selección/estado
- 📌 Puertos Input (izq) y Output (der) con animaciones
- 🎨 Escalado inverso de bordes para zoom (evita pixelación)
- 🎯 Hover states y transiciones suaves
- ⚙️ Collapse/expand con animación

### 2. **NodeContent.tsx**
Renderiza el contenido específico según tipo de nodo.

**Tipos Soportados:**
```
PICKER     → Input file + preview
OSCILLATOR → Frequency + Amplitude sliders
TRANSFORM  → Position (X, Y) + Scale (X, Y, Z) + Rotation
OUTPUT     → Display panel + stats
LOGIC      → Operador (AND, OR, XOR) + inputs
SLIDER     → Min/Max/Value con knob visual
NUMBER     → Input numérico con validación
BOOLEAN    → Toggle switch
CLONE      → Mirror del original + badge
```

### 3. **ConnectionLine.tsx**
Renderiza cables entre puertos usando SVG.

**Lógica:**
```typescript
// Calcula puntos de inicio/fin (puertos)
const sourcePort = getPortPosition(source)
const targetPort = getPortPosition(target)

// Elige renderizador según tipo
switch(connectionType) {
  case 'BEZIER':   → curva suave
  case 'STRAIGHT': → línea recta
  case 'STEP':     → L-shape ortogonal
  case 'DOUBLE':   → doble línea con gap
  case 'DOTTED':   → punteada
}

// Anima en hover/active chain
stroke-dasharray si está en cadena
opacity += 0.3 en hover
```

### 4. **SidePanel.tsx**
Inspector de propiedades (panel derecho).

**Secciones:**
```
┌─────────────────────────┐
│ Header                  │ ← Nombre + icono + close
├─────────────────────────┤
│ Property Fields         │ ← Inputs específicos por tipo
│ • Label                 │
│ • Config fields...      │ 
│ • Bound Props (link🔗)  │
├─────────────────────────┤
│ Actions                 │ ← Botones contextuales
│ • Teleport (RClick)     │
│ • Duplicate             │
│ • Delete                │
└─────────────────────────┘
```

### 5. **Header.tsx**
Barra superior con controles globales.

**Elementos:**
```
[🏠 Home] [🔍 Fit] [🌙/☀️ Theme] [📋 Shortcuts] [+] [Zoom: 1.0x]
```

- Dark/Light theme toggle
- Zoom indicator + controls
- Shortcuts panel toggle
- Nueva rápida de nodos

### 6. **NodePicker.tsx**
Modal para crear nodos (Shift+Tab).

**Interfaz:**
```
┌──────────────────────────┐
│ Add Node (Type: )        │
├──────────────────────────┤
│ [Seach...]               │
├──────────────────────────┤
│ ○ OSCILLATOR  (1)        │ ← Contador de instancias
│ ○ TRANSFORM   (0)        │
│ ○ SLIDER      (2)        │
│ ○ OUTPUT      (0)        │
│ ...                      │
└──────────────────────────┘
```

### 7. **CanvasBackground.tsx**
Grid dinámico detrás del canvas.

**Lógica:**
- Adapta grid según zoom (dense/sparse)
- Tema: White/Gray en light, Dark/Subtle en dark
- Pattern: DOTS (pequeños) / LINES (cuadrícula) / CROSS (cruces)
- SVG pattern para performance

### 8. **ShortcutsPanel.tsx**
Panel colapsable con atajos.

**Atajos Principales:**
```
[GENERAL]
Shift+Tab    → Node Picker
Ctrl+C/V     → Copy/Paste
Ctrl+Z/Y     → Undo/Redo
Delete       → Delete selected
F            → Focus selection
Shift+F      → Focus all

[CANVAS]
Right+Drag   → Pan
Scroll       → Zoom
Shift+Click  → Multi-select
Ctrl+Alt+Drag→ Quick Clone

[CONNECTIONS]
Click Port   → Start wire
Shift+Click  → Hot wire mode
Right+Port   → Connection menu

[MOBILE]
Long-press   → Context menu
Pinch        → Zoom
Two-finger   → Pan
```

---

## 🔧 Hooks Personalizados

### `usePinchZoom.ts`
Detecta gesto de pinch (dos dedos) en móvil.

```typescript
// Calcula distancia entre dos dedos
const dist = hypot(touch[0].x - touch[1].x, touch[0].y - touch[1].y)

// En touchmove: calcula delta
const delta = newDist - prevDist
const zoomChange = delta * sensitivity (0.005)

// Aplica zoom con punto central
const centerX = (touch[0].x + touch[1].x) / 2
const centerY = (touch[0].y + touch[1].y) / 2
// ... adjust viewport to center
```

### `useLongPress.ts`
Detección de presión prolongada (hold).

```typescript
// En touchstart: setTimeout(action, 500ms)
// En touchend: clearTimeout()
// En touchmove > threshold: cancelar
```

---

## 🛠️ Utilidades

### `deviceDetection.ts`
```typescript
isMobileOrTablet(): boolean
  → UA checks para iOS, Android, tablet patterns
  → NO se basa en screen size
```

### `geometry.ts`
```typescript
getRayBoxIntersection(ray, box): Point | null
  → Para selection box
  → Ray casting para ports

getConnectionPath(from, to, type): Path
  → Calcula puntos para cada tipo de cable
```

### `menuPosition.ts`
```typescript
getMenuPosition(mousePos, menuSize, viewport)
  → Evita que menús salgan del viewport
  → Flipping automático (arriba/abajo, izq/der)
```

---

## 🎨 Sistema de Colores

### Paleta Neón
```typescript
NEON_PALETTE = [
  '#00FFFF',  // Cyan
  '#FF00FF',  // Magenta
  '#00FF00',  // Lime
  '#FFFF00',  // Yellow
  '#FF3333',  // Red
  '#FFA500',  // Orange
  '#8A2BE2'   // Violet
]
```

### Asignación de Colores
- Cada tipo de nodo: color fijo (ej: OSCILLATOR → Cyan)
- O rotación de paleta por instancia
- Glow en selección/active chain

### Tema
```
DARK MODE (Default)
  Background:    #000000 / #0A0A0A
  Text:          #FFFFFF
  Borders:       rgba(255,255,255,0.1)
  Grid:          rgba(255,255,255,0.05)
  Accent:        NEON_PALETTE[index]

LIGHT MODE
  Background:    #FFFFFF / #F5F5F5
  Text:          #000000
  Borders:       rgba(0,0,0,0.1)
  Grid:          rgba(0,0,0,0.05)
  Accent:        NEON_PALETTE[index] (más opaco)
```

---

## 📊 Flujos de Interacción

### Crear Conexión
```
User: Click en puerto OUTPUT
  └─> onPortDown()
      └─> State: wiring = true
          └─> Renderiza línea de "rubber-band" en cursor

User: Mueve mouse sobre canvas
  └─> SVG line sigue cursor

User: Click en puerto INPUT (válido)
  └─> onPortUp()
      └─> Valida: no duplicadas, tipo compatible
          └─> addConnection()
          └─> updateHistory()
          └─> State: wiring = false

User: Click fuera de puerto válido
  └─> Cancela (wiring = false)
```

### Teleportación de Propiedades
```
User: Right-click (o long-press) propiedad en SidePanel
  └─> showContextMenu()
      └─> Opciones: [SEND] [RECEIVE] [UNBIND]

User: Selecciona SEND
  └─> Property en "broadcast mode"
  └─> Ícono 🔗 rojo visible

User: Right-click otra propiedad (diferente nodo)
  └─> Selecciona RECEIVE
      └─> Crea binding: target.prop → source.prop
      └─> Ícono 🔗 verde visible
      └─> Ahora: target.prop = source.prop (live)

User: Selecciona UNBIND
  └─> Rompe binding
  └─> Ícono desaparece
```

### Multi-Selección
```
User: Click en nodo
  └─> selectedIds = Set([nodeId])

User: Shift+Click en otro nodo
  └─> selectedIds = Set([...prev, newNodeId])

User: Ctrl+C
  └─> clipboard = filtrarNodesSeleccionados()

User: Ctrl+V
  └─> Genera nuevos nodos con offset (50px)
  └─> Mantiene config pero NO connections
```

### Undo/Redo
```
User: Cualquier mutación (add/delete/update node o connection)
  └─> saveToHistory()
      └─> history[++historyIndex] = snapshot
          (nodes, connections, selection, viewport)

User: Ctrl+Z
  └─> historyIndex--
  └─> restoreState(history[historyIndex])
  └─> Re-render

User: Ctrl+Y
  └─> historyIndex++
  └─> restoreState(history[historyIndex])
```

---

## 🚀 Flujo de Datos & Señales

### Cadena de Señales Upstream/Downstream
```
Input Node
  ↓ connection
[Transform A] ← VISUALIZE CHAIN
  ↓ connection
[Transform B]
  ↓ connection
Output Node

User: Click en [Transform A]
  └─> isActiveChain = true para:
      • [Transform A] y todos sus upstream
      • [Transform B] (downstream)
      • [Output Node] (downstream)
      
  └─> Visual: Borders + Glows se encienden
      • Nodos en cadena: borderColor = accentColor
      • Cables en cadena: stroke = accentColor, opacity += 0.3
      • Ports en cadena: animate-ping
```

### Conversión Automática de Tipos
```
Source: Boolean (0 o 1)
Target: Slider (Min: 0, Max: 100)

Connection: BEZIER
  └─> Value normalization
      0 → 0
      1 → 100
      
      Dentro de Slider, 0-100 es el rango de UI
      Pero internamente se guarda como Boolean (0 | 1)
```

---

## 🔄 Ciclo de Renderizado

### App.tsx (Main Render Loop)
```tsx
<div ref={containerRef} onMouseMove={...} onMouseUp={...} onWheel={...}>
  
  {/* Canvas */}
  <svg transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
    
    {/* Background Grid */}
    <CanvasBackground gridType={gridType} isDarkMode={isDarkMode} />
    
    {/* Conexiones (primero, para que vayan atrás) */}
    {connections.map(conn => (
      <ConnectionLine key={conn.id} {...} />
    ))}
    
    {/* Nodos (encima) */}
    {nodes.map(node => (
      <BaseNode key={node.id} {...} >
        <NodeContent data={node} {...} />
      </BaseNode>
    ))}
    
  </svg>
  
  {/* UI Overlays */}
  <Header {...} />
  <SidePanel selectedNode={...} {...} />
  <ShortcutsPanel {...} />
  <NodePicker isOpen={...} {...} />
  
  {/* Context Menus */}
  {activeMenu && <ContextMenu {...} />}
  
</div>
```

### Performance Optimizations
- **Memoización**: NodeContent, ConnectionLine
- **Viewport Culling**: Solo renderizar nodos visibles (opcional)
- **Canvas SVG**: Mejor que divs para miles de conexiones
- **Transform 3D**: Usar `transform: translate3d()` para GPU accel

---

## 📦 Dependencias

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "lucide-react": "^0.555.0"
}
```

**DevDependencies:**
- TypeScript 5.8.2
- Vite 6.2.0
- @vitejs/plugin-react

---

## 🎯 Casos de Uso

### 1. Editor de Animaciones
```
LFO → Transform → Output
      ↓
      Slider (manual override)
```

### 2. Síntesis de Audio
```
Oscillator → ADSR → Filter → Output
     ↑
     └─ Keyboard input
```

### 3. Generador Procedural
```
Noise → Transform → Picker → Output
                      ↓
                    Display
```

### 4. Control de Parámetros
```
Multiple LFOs → Mixers → Transform → Property Teleport → External App
```

---

## 🔮 Futuros Mejoras (Roadmap)

- [ ] Subnodos / Grupos colapsables
- [ ] Presets guardables
- [ ] Exportación JSON + código generado
- [ ] Plugin system para tipos custom
- [ ] Animación de valores en tiempo real
- [ ] Minimap para navegación
- [ ] Búsqueda global (Cmd+K)
- [ ] Collaborative editing (WebSockets)

---

## 📝 Notas Técnicas

### Por qué SVG para conexiones?
- Escalable sin pixelación
- Eficiente para transformaciones (pan/zoom)
- Fácil de animar (stroke-dasharray)
- Mejor performance que canvas 2D para muchas líneas

### Por qué Tailwind CSS?
- Desarrollo rápido
- Tema dark/light automático con `isDarkMode`
- Responsive utilities (aunque canvas es responsivo por su naturaleza)

### Limitaciones Actuales
- No hay serialización (guardar/cargar)
- No hay validación de tipos en bindings
- Canvas limitado a 2D (pero escalable a WebGL)

---

**Última actualización**: Diciembre 2025  
**Versión**: 0.0.0 (pre-release)  
**Estado**: Desarrollo activo
