/**
 * Playground - The main node testing environment
 * 
 * Following MASTER_ARCHITECTURE.md Three Laws:
 * 1. NODES are Config Providers → publish config to store
 * 2. ENGINES Compute → read config, write computed values to store  
 * 3. RENDERERS Draw → read computed values, apply to visuals
 * 
 * Architecture:
 * - Uses aninodeStore (Valtio) as single source of truth
 * - Animation loop via gsap.ticker (decoupled from React)
 * - Renderer via useSnapshot (reactive to store changes)
 * - Property resolution via resolveProperty (3-level hierarchy)
 */

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { resolveProperty } from '../core/resolveProperty'
import { aninodeStore, storeActions } from '../core/store'
import type { NodeState } from '../types'
import styles from './Playground.module.css'

// =============================================================================
// TYPES
// =============================================================================

type TestObject = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  isCircle?: boolean
}

type PlaygroundNodeType = 'RotationNode' | 'ScaleNode' | 'OpacityNode' | 'LFONode' | 'PositionNode'

// =============================================================================
// TEST OBJECTS (Base data - static)
// =============================================================================

const TEST_OBJECTS: TestObject[] = [
  { id: 'obj1', name: 'Blue Box', x: 200, y: 200, width: 80, height: 80, color: '#4a9eff' },
  { id: 'obj2', name: 'Red Circle', x: 400, y: 200, width: 60, height: 60, color: '#ff6b6b', isCircle: true },
  { id: 'obj3', name: 'Green Box', x: 300, y: 350, width: 100, height: 50, color: '#4ade80' },
]

// =============================================================================
// DEFAULT NODE BASE PROPS
// =============================================================================

const DEFAULT_BASE_PROPS: Record<PlaygroundNodeType, Record<string, any>> = {
  RotationNode: {
    mode: 'animated',
    staticAngle: 0,
    // Timing mode: 'speed' = rotations/sec, 'duration' = seconds/rotation
    timingMode: 'speed',
    speed: 1,
    duration: 2, // for duration mode: complete 1 rotation in X seconds
    direction: 'cw',
    easing: 'none',
  },
  ScaleNode: {
    mode: 'animated',
    uniform: true,
    startScale: 1,
    endScale: 1.5,
    duration: 1,
    yoyo: true,
    easing: 'power1.inOut',
  },
  OpacityNode: {
    mode: 'animated',
    startOpacity: 0.3,
    endOpacity: 1,
    duration: 1,
    yoyo: true,
    easing: 'power1.inOut',
  },
  LFONode: {
    waveform: 'sine',
    frequency: 1,
    min: 0,
    max: 1,
    phase: 0,
    // LFO targets other NODE properties, not objects
    targetNodeId: null as string | null,
    targetProperty: 'speed', // e.g., 'speed', 'startScale', 'duration'
  },
  PositionNode: {
    mode: 'static', // 'static' | 'animated'
    // Static mode: offset from object's base position
    offsetX: 0,
    offsetY: 0,
    // Animated mode: oscillate between start and end offsets
    startX: 0,
    startY: 0,
    endX: 50,
    endY: 0,
    duration: 1,
    yoyo: true,
    easing: 'power1.inOut',
  },
}

// =============================================================================
// PLAYGROUND COMPONENT
// =============================================================================

export function Playground() {
  // Subscribe to store for reactive updates
  const snap = useSnapshot(aninodeStore)
  
  // Local UI state only
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('obj1')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    objectId: string | null
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  }>({ isDragging: false, objectId: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })

  // Track object positions separately (for dragging)
  const [objectPositions, setObjectPositions] = useState<Record<string, { x: number, y: number }>>(
    Object.fromEntries(TEST_OBJECTS.map(o => [o.id, { x: o.x, y: o.y }]))
  )

  // Counter for unique node IDs
  const nodeCounter = useRef(0)

  // ---------------------------------------------------------------------------
  // ANIMATION ENGINE (gsap.ticker - decoupled from React)
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!snap.ui.isPlaying) return

    const tick = () => {
      const time = gsap.ticker.time
      
      // STEP 1: Process LFO nodes first and write to target node overrides
      Object.entries(aninodeStore.nodes).forEach(([nodeId, node]) => {
        if (node.type === 'LFONode') {
          const frequency = resolveProperty(nodeId, 'frequency', 1)
          const min = resolveProperty(nodeId, 'min', 0)
          const max = resolveProperty(nodeId, 'max', 1)
          const phase = resolveProperty(nodeId, 'phase', 0)
          const waveform = resolveProperty(nodeId, 'waveform', 'sine')
          
          const t = time * frequency + phase
          let value = 0
          
          switch (waveform) {
            case 'sine':
              value = (Math.sin(t * Math.PI * 2) + 1) / 2
              break
            case 'square':
              value = Math.sin(t * Math.PI * 2) > 0 ? 1 : 0
              break
            case 'triangle':
              value = Math.abs((t % 1) * 2 - 1)
              break
            case 'sawtooth':
              value = t % 1
              break
          }
          
          const outputValue = min + value * (max - min)
          aninodeStore.nodes[nodeId].outputs.value = outputValue
          
          // Write to target node's overrides
          const targetNodeId = node.baseProps.targetNodeId
          const targetProperty = node.baseProps.targetProperty
          if (targetNodeId && targetProperty && aninodeStore.nodes[targetNodeId]) {
            aninodeStore.nodes[targetNodeId].overrides[targetProperty] = outputValue
          }
        }
      })
      
      // STEP 2: Process other nodes (they read from overrides via resolveProperty)
      Object.entries(aninodeStore.nodes).forEach(([nodeId, node]) => {
        if (node.type === 'LFONode') return // Already processed
        const targetId = node.baseProps.targetId
        if (!targetId) return

        switch (node.type) {
          case 'RotationNode': {
            const mode = resolveProperty(nodeId, 'mode', 'animated')
            if (mode === 'animated') {
              const timingMode = resolveProperty(nodeId, 'timingMode', 'speed')
              const direction = resolveProperty(nodeId, 'direction', 'cw') === 'cw' ? 1 : -1
              
              let angle: number
              if (timingMode === 'speed') {
                // Speed mode: rotations per second
                const speed = resolveProperty(nodeId, 'speed', 1)
                angle = (time * speed * 360 * direction) % 360
              } else {
                // Duration mode: seconds per full rotation
                const duration = resolveProperty(nodeId, 'duration', 2)
                const progress = (time % duration) / duration
                angle = progress * 360 * direction
              }
              
              aninodeStore.nodes[nodeId].outputs.rotation = angle
            } else {
              aninodeStore.nodes[nodeId].outputs.rotation = resolveProperty(nodeId, 'staticAngle', 0)
            }
            break
          }

          case 'ScaleNode': {
            const mode = resolveProperty(nodeId, 'mode', 'animated')
            if (mode === 'animated') {
              const duration = resolveProperty(nodeId, 'duration', 1)
              const startScale = resolveProperty(nodeId, 'startScale', 1)
              const endScale = resolveProperty(nodeId, 'endScale', 1.5)
              const yoyo = resolveProperty(nodeId, 'yoyo', true)
              
              let t = (time % (duration * 2)) / duration
              if (yoyo && t > 1) t = 2 - t
              
              const scale = startScale + (endScale - startScale) * t
              aninodeStore.nodes[nodeId].outputs.scaleX = scale
              aninodeStore.nodes[nodeId].outputs.scaleY = scale
            }
            break
          }

          case 'OpacityNode': {
            const mode = resolveProperty(nodeId, 'mode', 'animated')
            if (mode === 'animated') {
              const duration = resolveProperty(nodeId, 'duration', 1)
              const startOpacity = resolveProperty(nodeId, 'startOpacity', 0.3)
              const endOpacity = resolveProperty(nodeId, 'endOpacity', 1)
              const yoyo = resolveProperty(nodeId, 'yoyo', true)
              
              let t = (time % (duration * 2)) / duration
              if (yoyo && t > 1) t = 2 - t
              
              aninodeStore.nodes[nodeId].outputs.opacity = startOpacity + (endOpacity - startOpacity) * t
            }
            break
          }

          case 'PositionNode': {
            const mode = resolveProperty(nodeId, 'mode', 'static')
            if (mode === 'animated') {
              const duration = resolveProperty(nodeId, 'duration', 1)
              const startX = resolveProperty(nodeId, 'startX', 0)
              const startY = resolveProperty(nodeId, 'startY', 0)
              const endX = resolveProperty(nodeId, 'endX', 50)
              const endY = resolveProperty(nodeId, 'endY', 0)
              const yoyo = resolveProperty(nodeId, 'yoyo', true)
              
              let t = (time % (duration * 2)) / duration
              if (yoyo && t > 1) t = 2 - t
              
              aninodeStore.nodes[nodeId].outputs.offsetX = startX + (endX - startX) * t
              aninodeStore.nodes[nodeId].outputs.offsetY = startY + (endY - startY) * t
            } else {
              aninodeStore.nodes[nodeId].outputs.offsetX = resolveProperty(nodeId, 'offsetX', 0)
              aninodeStore.nodes[nodeId].outputs.offsetY = resolveProperty(nodeId, 'offsetY', 0)
            }
            break
          }
        }
      })
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [snap.ui.isPlaying])

  // ---------------------------------------------------------------------------
  // COMPUTE OBJECT TRANSFORMS (from node outputs)
  // ---------------------------------------------------------------------------
  
  const getObjectTransforms = (objectId: string) => {
    let rotation = 0
    let scaleX = 1
    let scaleY = 1
    let opacity = 1
    let offsetX = 0
    let offsetY = 0

    // Accumulate contributions from all nodes targeting this object
    Object.entries(snap.nodes).forEach(([_, node]) => {
      if (node.baseProps.targetId !== objectId) return

      if (node.outputs.rotation !== undefined) {
        rotation += node.outputs.rotation
      }
      if (node.outputs.scaleX !== undefined) {
        scaleX *= node.outputs.scaleX
      }
      if (node.outputs.scaleY !== undefined) {
        scaleY *= node.outputs.scaleY
      }
      if (node.outputs.opacity !== undefined) {
        opacity *= node.outputs.opacity
      }
      if (node.outputs.offsetX !== undefined) {
        offsetX += node.outputs.offsetX
      }
      if (node.outputs.offsetY !== undefined) {
        offsetY += node.outputs.offsetY
      }
    })

    return { rotation, scaleX, scaleY, opacity, offsetX, offsetY }
  }

  // ---------------------------------------------------------------------------
  // NODE ACTIONS
  // ---------------------------------------------------------------------------

  const addNode = (type: PlaygroundNodeType) => {
    nodeCounter.current++
    const id = `${type.toLowerCase()}_${nodeCounter.current}`
    const name = type.replace('Node', '') + (nodeCounter.current > 1 ? ` ${nodeCounter.current}` : '')

    const newNode: NodeState = {
      id,
      type,
      name,
      position: { x: 0, y: 0 },
      baseProps: {
        ...DEFAULT_BASE_PROPS[type],
        targetId: selectedObjectId,
      },
      overrides: {},
      outputs: {},
      connectedInputs: {},
    }

    storeActions.addNode(newNode)
    setSelectedNodeId(id)
  }

  const removeNode = (nodeId: string) => {
    storeActions.removeNode(nodeId)
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }

  const updateNodeProp = (nodeId: string, key: string, value: any) => {
    storeActions.updateNodeProps(nodeId, { [key]: value })
  }

  // ---------------------------------------------------------------------------
  // DRAG HANDLING
  // ---------------------------------------------------------------------------

  const handleObjectMouseDown = (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation()
    const pos = objectPositions[objectId]
    if (!pos) return

    setSelectedObjectId(objectId)
    setDragState({
      isDragging: true,
      objectId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: pos.x,
      offsetY: pos.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.objectId) return
    
    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY
    
    setObjectPositions(prev => ({
      ...prev,
      [dragState.objectId!]: {
        x: dragState.offsetX + dx,
        y: dragState.offsetY + dy,
      }
    }))
  }

  const handleMouseUp = () => {
    setDragState({ isDragging: false, objectId: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const nodeList = Object.values(snap.nodes).filter(n => 
    ['RotationNode', 'ScaleNode', 'OpacityNode', 'LFONode'].includes(n.type)
  )
  const selectedNode = selectedNodeId ? snap.nodes[selectedNodeId] : null

  return (
    <div className={styles.container}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <h1 className={styles.title}>Aninode Playground</h1>
        
        {/* Node buttons */}
        <div className={styles.nodeButtons}>
          <button className={styles.nodeBtn} onClick={() => addNode('RotationNode')}>+ Rotation</button>
          <button className={styles.nodeBtn} onClick={() => addNode('ScaleNode')}>+ Scale</button>
          <button className={styles.nodeBtn} onClick={() => addNode('OpacityNode')}>+ Opacity</button>
          <button className={styles.nodeBtn} onClick={() => addNode('LFONode')}>+ LFO</button>
        </div>
        
        {/* Playback controls */}
        <div className={styles.playbackControls}>
          <button 
            className={`${styles.playBtn} ${snap.ui.isPlaying ? styles.playing : ''}`}
            onClick={() => storeActions.setPlaying(!snap.ui.isPlaying)}
          >
            {snap.ui.isPlaying ? '■ Stop' : '▶ Play'}
          </button>
        </div>
      </div>
      
      {/* ACTIVE NODES CHIPS */}
      {nodeList.length > 0 && (
        <div className={styles.nodesChips}>
          {nodeList.map(node => (
            <div 
              key={node.id}
              className={`${styles.nodeChip} ${node.id === selectedNodeId ? styles.selected : ''}`}
              onClick={() => setSelectedNodeId(node.id)}
            >
              <span className={styles.nodeChipIcon}>
                {node.type === 'RotationNode' && '↻'}
                {node.type === 'ScaleNode' && '⤢'}
                {node.type === 'OpacityNode' && '◐'}
                {node.type === 'LFONode' && '∿'}
              </span>
              {node.name}
              <span 
                className={styles.nodeChipClose}
                onClick={(e) => { e.stopPropagation(); removeNode(node.id) }}
              >
                ×
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* MAIN LAYOUT */}
      <div className={styles.main}>
        {/* CANVAS AREA */}
        <div 
          className={styles.canvas}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid background */}
          <div className={styles.grid} />
          
          {/* Render objects */}
          {TEST_OBJECTS.map(obj => {
            const pos = objectPositions[obj.id] || { x: obj.x, y: obj.y }
            const transforms = getObjectTransforms(obj.id)
            
            return (
              <div
                key={obj.id}
                className={`${styles.object} ${obj.id === selectedObjectId ? styles.selected : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: obj.width,
                  height: obj.height,
                  backgroundColor: obj.color,
                  transform: `translate(-50%, -50%) rotate(${transforms.rotation}deg) scale(${transforms.scaleX}, ${transforms.scaleY})`,
                  opacity: transforms.opacity,
                  borderRadius: obj.isCircle ? '50%' : '8px',
                  cursor: dragState.isDragging && dragState.objectId === obj.id ? 'grabbing' : 'grab',
                }}
                onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
              >
                <span className={styles.objectLabel}>{obj.name}</span>
              </div>
            )
          })}
        </div>
        
        {/* SIDE PANEL */}
        <div className={styles.sidePanel}>
          {selectedNode ? (
            <>
              <div className={styles.panelHeader}>
                <h2>{selectedNode.name}</h2>
                <span className={styles.nodeType}>{selectedNode.type}</span>
              </div>
              
              {/* Target selector */}
              <div className={styles.propGroup}>
                <label className={styles.propLabel}>Target Object</label>
                <select 
                  className={styles.propSelect}
                  value={selectedNode.baseProps.targetId || ''}
                  onChange={(e) => updateNodeProp(selectedNode.id, 'targetId', e.target.value || null)}
                >
                  <option value="">None</option>
                  {TEST_OBJECTS.map(obj => (
                    <option key={obj.id} value={obj.id}>{obj.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Node-specific properties */}
              {selectedNode.type === 'RotationNode' && (
                <RotationProps 
                  node={selectedNode} 
                  onChange={(k, v) => updateNodeProp(selectedNode.id, k, v)} 
                />
              )}
              {selectedNode.type === 'ScaleNode' && (
                <ScaleProps 
                  node={selectedNode} 
                  onChange={(k, v) => updateNodeProp(selectedNode.id, k, v)} 
                />
              )}
              {selectedNode.type === 'OpacityNode' && (
                <OpacityProps 
                  node={selectedNode} 
                  onChange={(k, v) => updateNodeProp(selectedNode.id, k, v)} 
                />
              )}
              {selectedNode.type === 'LFONode' && (
                <LFOProps 
                  node={selectedNode}
                  onChange={(k, v) => updateNodeProp(selectedNode.id, k, v)} 
                />
              )}
              
              {/* Outputs */}
              <div className={styles.outputsPanel}>
                <h3>Outputs</h3>
                <pre className={styles.outputsCode}>
                  {JSON.stringify(selectedNode.outputs, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className={styles.panelEmpty}>
              <p>Select a node to edit its properties</p>
              <div className={styles.objectsList}>
                <h3>Objects</h3>
                {TEST_OBJECTS.map(obj => (
                  <div 
                    key={obj.id}
                    className={`${styles.objectItem} ${obj.id === selectedObjectId ? styles.selected : ''}`}
                    onClick={() => setSelectedObjectId(obj.id)}
                  >
                    <span 
                      className={styles.objectColor}
                      style={{ backgroundColor: obj.color }}
                    />
                    {obj.name}
                    <span className={styles.objectNodeCount}>
                      {Object.values(snap.nodes).filter(n => n.baseProps.targetId === obj.id).length} nodes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PROPERTY EDITORS
// =============================================================================

function RotationProps({ node, onChange }: { node: NodeState, onChange: (k: string, v: any) => void }) {
  const props = node.baseProps
  return (
    <div className={styles.propGroup}>
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Mode</label>
        <select 
          className={styles.propSelect}
          value={props.mode}
          onChange={(e) => onChange('mode', e.target.value)}
        >
          <option value="static">Static</option>
          <option value="animated">Animated</option>
        </select>
      </div>
      
      {props.mode === 'animated' && (
        <>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>Timing</label>
            <select 
              className={styles.propSelect}
              value={props.timingMode}
              onChange={(e) => onChange('timingMode', e.target.value)}
            >
              <option value="speed">Speed (rot/s)</option>
              <option value="duration">Duration (s/rot)</option>
            </select>
          </div>
          
          {props.timingMode === 'speed' ? (
            <div className={styles.propRow}>
              <label className={styles.propLabel}>Speed</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={props.speed}
                onChange={(e) => onChange('speed', parseFloat(e.target.value))}
              />
              <span className={styles.propValue}>{props.speed} rot/s</span>
            </div>
          ) : (
            <div className={styles.propRow}>
              <label className={styles.propLabel}>Duration</label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={props.duration}
                onChange={(e) => onChange('duration', parseFloat(e.target.value))}
              />
              <span className={styles.propValue}>{props.duration}s</span>
            </div>
          )}
          
          <div className={styles.propRow}>
            <label className={styles.propLabel}>Direction</label>
            <select 
              className={styles.propSelect}
              value={props.direction}
              onChange={(e) => onChange('direction', e.target.value)}
            >
              <option value="cw">Clockwise</option>
              <option value="ccw">Counter-CW</option>
            </select>
          </div>
        </>
      )}
      
      {props.mode === 'static' && (
        <div className={styles.propRow}>
          <label className={styles.propLabel}>Angle</label>
          <input
            type="range"
            min="0"
            max="360"
            value={props.staticAngle}
            onChange={(e) => onChange('staticAngle', parseFloat(e.target.value))}
          />
          <span className={styles.propValue}>{props.staticAngle}°</span>
        </div>
      )}
    </div>
  )
}

function ScaleProps({ node, onChange }: { node: NodeState, onChange: (k: string, v: any) => void }) {
  const props = node.baseProps
  return (
    <div className={styles.propGroup}>
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Mode</label>
        <select 
          className={styles.propSelect}
          value={props.mode}
          onChange={(e) => onChange('mode', e.target.value)}
        >
          <option value="static">Static</option>
          <option value="animated">Animated</option>
        </select>
      </div>
      
      {props.mode === 'animated' && (
        <>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>Start Scale</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={props.startScale}
              onChange={(e) => onChange('startScale', parseFloat(e.target.value))}
            />
            <span className={styles.propValue}>{props.startScale}</span>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>End Scale</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={props.endScale}
              onChange={(e) => onChange('endScale', parseFloat(e.target.value))}
            />
            <span className={styles.propValue}>{props.endScale}</span>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>Duration</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={props.duration}
              onChange={(e) => onChange('duration', parseFloat(e.target.value))}
            />
            <span className={styles.propValue}>{props.duration}s</span>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={props.yoyo}
                onChange={(e) => onChange('yoyo', e.target.checked)}
              />
              Yoyo
            </label>
          </div>
        </>
      )}
    </div>
  )
}

function OpacityProps({ node, onChange }: { node: NodeState, onChange: (k: string, v: any) => void }) {
  const props = node.baseProps
  return (
    <div className={styles.propGroup}>
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Mode</label>
        <select 
          className={styles.propSelect}
          value={props.mode}
          onChange={(e) => onChange('mode', e.target.value)}
        >
          <option value="static">Static</option>
          <option value="animated">Animated</option>
        </select>
      </div>
      
      {props.mode === 'animated' && (
        <>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>Start Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={props.startOpacity}
              onChange={(e) => onChange('startOpacity', parseFloat(e.target.value))}
            />
            <span className={styles.propValue}>{Math.round(props.startOpacity * 100)}%</span>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>End Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={props.endOpacity}
              onChange={(e) => onChange('endOpacity', parseFloat(e.target.value))}
            />
            <span className={styles.propValue}>{Math.round(props.endOpacity * 100)}%</span>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propLabel}>Duration</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={props.duration}
              onChange={(e) => onChange('duration', parseFloat(e.target.value))}
            />
            <span className={styles.propValue}>{props.duration}s</span>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={props.yoyo}
                onChange={(e) => onChange('yoyo', e.target.checked)}
              />
              Yoyo
            </label>
          </div>
        </>
      )}
    </div>
  )
}

function LFOProps({ node, onChange }: { node: NodeState, onChange: (k: string, v: any) => void }) {
  const props = node.baseProps
  const snap = useSnapshot(aninodeStore)
  const lfoOutput = snap.nodes[node.id]?.outputs?.value as number | undefined
  
  // Get other nodes that LFO can target (exclude LFO nodes)
  const targetableNodes = Object.values(snap.nodes).filter(
    n => n.id !== node.id && n.type !== 'LFONode'
  )
  
  // Get properties that can be modulated based on target node type
  const getModulatableProps = (nodeType: string) => {
    switch (nodeType) {
      case 'RotationNode':
        return ['speed', 'staticAngle']
      case 'ScaleNode':
        return ['startScale', 'endScale', 'duration']
      case 'OpacityNode':
        return ['startOpacity', 'endOpacity', 'duration']
      default:
        return []
    }
  }
  
  const selectedTargetNode = props.targetNodeId ? snap.nodes[props.targetNodeId] : null
  const availableProps = selectedTargetNode ? getModulatableProps(selectedTargetNode.type) : []
  
  return (
    <div className={styles.propGroup}>
      {/* TARGET CONNECTION */}
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Target Node</label>
        <select 
          className={styles.propSelect}
          value={props.targetNodeId || ''}
          onChange={(e) => onChange('targetNodeId', e.target.value || null)}
        >
          <option value="">None</option>
          {targetableNodes.map(n => (
            <option key={n.id} value={n.id}>{n.name} ({n.type.replace('Node', '')})</option>
          ))}
        </select>
      </div>
      
      {props.targetNodeId && (
        <div className={styles.propRow}>
          <label className={styles.propLabel}>Target Property</label>
          <select 
            className={styles.propSelect}
            value={props.targetProperty || ''}
            onChange={(e) => onChange('targetProperty', e.target.value)}
          >
            {availableProps.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}
      
      <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0' }} />
      
      {/* WAVEFORM SETTINGS */}
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Waveform</label>
        <select 
          className={styles.propSelect}
          value={props.waveform}
          onChange={(e) => onChange('waveform', e.target.value)}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>
      </div>
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Frequency</label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={props.frequency}
          onChange={(e) => onChange('frequency', parseFloat(e.target.value))}
        />
        <span className={styles.propValue}>{props.frequency} Hz</span>
      </div>
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Min</label>
        <input
          type="number"
          className={styles.propInput}
          value={props.min}
          onChange={(e) => onChange('min', parseFloat(e.target.value))}
        />
      </div>
      <div className={styles.propRow}>
        <label className={styles.propLabel}>Max</label>
        <input
          type="number"
          className={styles.propInput}
          value={props.max}
          onChange={(e) => onChange('max', parseFloat(e.target.value))}
        />
      </div>
      
      {/* LFO Visual feedback */}
      <div className={styles.lfoOutput}>
        <span>Output: </span>
        <span className={styles.lfoValue}>{lfoOutput?.toFixed(2) ?? '0.00'}</span>
      </div>
    </div>
  )
}

export default Playground

