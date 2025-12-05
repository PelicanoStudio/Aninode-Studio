import { PhysicsTestObject } from '@components/PhysicsTestObject'
import { aninodeStore } from '@core/store'
import { CollisionNode, CollisionNodeProps } from '@nodes/CollisionNode'
import { LFONode, LFONodeProps } from '@nodes/LFONode'
import { OpacityNode, OpacityNodeProps } from '@nodes/OpacityNode'
import { PhysicsNodeFallback, PhysicsNodeProps } from '@nodes/PhysicsNode'
import { RotationNode, RotationNodeProps } from '@nodes/RotationNode'
import { ScaleNode, ScaleNodeProps } from '@nodes/ScaleNode'
import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import styles from './NodeTester.module.css'

type NodeTypeKey = 'rotation' | 'scale' | 'opacity' | 'lfo' | 'physics' | 'collision'

type ActiveNode = {
  type: NodeTypeKey
  id: string
  targetId?: string // The test object this node affects
  config: any
}

// Default configurations for each node type
const DEFAULT_CONFIGS: Record<NodeTypeKey, any> = {
  rotation: {
    name: 'Rotation',
    mode: 'Animated',
    staticAngle: 0,
    animationEnabled: true,
    startAngle: 0,
    endAngle: 360,
    speed: 1,
    direction: 'CW',
    continuous: true,
    duration: 2,
    loop: false,
    yoyo: false,
    anchorX: 50,
    anchorY: 50,
  },
  scale: {
    name: 'Scale',
    mode: 'Animated',
    uniform: true,
    staticScaleX: 1,
    staticScaleY: 1,
    animationEnabled: true,
    startScaleX: 1,
    startScaleY: 1,
    endScaleX: 1.3,
    endScaleY: 1.3,
    duration: 1,
    loop: true,
    yoyo: true,
    easing: 'easeInOut',
    anchorX: 50,
    anchorY: 50,
  },
  opacity: {
    name: 'Opacity',
    mode: 'Animated',
    staticOpacity: 1,
    animationEnabled: true,
    startOpacity: 0.3,
    endOpacity: 1,
    duration: 1,
    loop: true,
    yoyo: true,
    easing: 'easeInOut',
    effect: 'none',
    blinkSpeed: 2,
    clamp: true,
  },
  lfo: {
    name: 'LFO',
    waveform: 'sine',
    frequency: 1,
    phase: 0,
    min: 0,
    max: 1,
    enabled: true,
  },
  physics: {
    name: 'Physics',
    mode: 'Dynamic',
    colliderShape: 'Cuboid',
    mass: 1,
    friction: 0.5,
    restitution: 0.5,
    linearDamping: 0.1,
    angularDamping: 0.1,
    initialPositionX: 0,
    initialPositionY: 0,
    initialPositionZ: 0,
    initialVelocityX: 50,
    initialVelocityY: -100,
    initialVelocityZ: 0,
    initialRotation: 0,
    colliderWidth: 1,
    colliderHeight: 1,
    colliderDepth: 1,
    colliderRadius: 0.5,
    is2DMode: true,
    lockRotationX: true,
    lockRotationY: true,
    lockRotationZ: false,
    lockTranslationX: false,
    lockTranslationY: false,
    lockTranslationZ: true,
    forceMode: 'Gravity',
    gravityScale: 1,
    forceStrength: 10,
    forceDirectionX: 0,
    forceDirectionY: -1,
    forceDirectionZ: 0,
    attractorTargetX: 0,
    attractorTargetY: 0,
    attractorTargetZ: 0,
    attractorRadius: 10,
    attractorFalloff: 'Quadratic',
    collisionGroup: 0,
    collisionMask: 0xFFFF,
    isSensor: false,
    ccdEnabled: false,
    outputPosition: true,
    outputVelocity: true,
    outputRotation: true,
    outputCollisions: false,
    pixelScale: 1,
  },
  collision: {
    name: 'Collision',
    shape: 'Box',
    shapeWidth: 100,
    shapeHeight: 100,
    shapeOffsetX: 0,
    shapeOffsetY: 0,
    autoShape: true,
    surfaceType: 'Solid',
    platformDirection: 'Up',
    collisionGroup: 1,
    collisionMask: 0xFFFF,
    friction: 0.5,
    bounciness: 0.3,
    adhesion: 0,
    onCollisionResponse: 'Bounce',
    outputCollisions: true,
    outputOverlaps: false,
  },
}

export function NodeTester() {
  const [activeNodes, setActiveNodes] = useState<ActiveNode[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const [resetKey, setResetKey] = useState(0)
  const rafRef = useRef<number>()

  // Test objects for physics testing
  type TestObject = {
    id: string
    type: 'floor' | 'ball' | 'box'
    // Position
    x: number
    y: number
    // Velocity
    vx: number
    vy: number
    // Transforms
    rotation: number
    scaleX: number
    scaleY: number
    opacity: number
    // Dimensions
    width: number
    height: number
    // Visual
    color: string
    // State
    isDragging: boolean
    isStatic: boolean
  }

  const createInitialObjects = (): TestObject[] => [
    // Floor (static)
    { id: 'floor', type: 'floor', x: 0, y: 120, width: 300, height: 20, color: '#444', vx: 0, vy: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, isDragging: false, isStatic: true },
    // Dynamic ball
    { id: 'ball1', type: 'ball', x: -50, y: -80, width: 40, height: 40, color: '#4a9eff', vx: 0, vy: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, isDragging: false, isStatic: false },
    // Dynamic box
    { id: 'box1', type: 'box', x: 50, y: -60, width: 50, height: 50, color: '#ff6b6b', vx: 0, vy: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, isDragging: false, isStatic: false },
  ]

  const [testObjects, setTestObjects] = useState<TestObject[]>(createInitialObjects)


  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('ball1')

  // Get selected node
  const selectedNode = activeNodes.find(n => n.id === selectedNodeId)

  // Add a new node with auto-numbered name
  const addNode = (type: NodeTypeKey) => {
    const id = `${type}_${Date.now()}`
    // Count existing nodes of this type for auto-numbering
    const existingCount = activeNodes.filter(n => n.type === type).length
    const baseName = DEFAULT_CONFIGS[type].name
    const displayName = existingCount === 0 ? baseName : `${baseName} ${existingCount + 1}`

    const newNode: ActiveNode = {
      type,
      id,
      targetId: selectedObjectId || 'ball1', // Default to selected object or ball1
      config: { ...DEFAULT_CONFIGS[type], name: displayName },
    }
    setActiveNodes(prev => [...prev, newNode])
    setSelectedNodeId(id)
    setIsPlaying(true)
  }

  // Reset simulation
  const resetSimulation = () => {
    setTestObjects(createInitialObjects())
    setResetKey(prev => prev + 1)
  }

  // Update node config
  const updateConfig = (key: string, value: any) => {
    if (!selectedNodeId) return
    setActiveNodes(prev =>
      prev.map(node =>
        node.id === selectedNodeId
          ? { ...node, config: { ...node.config, [key]: value } }
          : node
      )
    )
  }

  // Update node target
  const updateTarget = (targetId: string) => {
    if (!selectedNodeId) return
    setActiveNodes(prev =>
      prev.map(node =>
        node.id === selectedNodeId
          ? { ...node, targetId }
          : node
      )
    )
  }

  // Remove node
  const removeNode = (id: string) => {
    setActiveNodes(prev => prev.filter(n => n.id !== id))
    if (selectedNodeId === id) {
      setSelectedNodeId(null)
    }
  }

  // ============================================================================
  // OUTPUT POLLING (Rapier handles physics now)
  // ============================================================================

  // Poll node outputs from aninodeStore (for visual nodes like LFO, Rotation, etc.)
  useEffect(() => {
    if (!isPlaying) return

    const poll = () => {
      const newOutputs: Record<string, any> = {}
      activeNodes.forEach(node => {
        const storeNode = aninodeStore.nodes[node.id]
        if (storeNode?.outputs) {
          newOutputs[node.id] = { ...storeNode.outputs }
        }
      })
      setOutputs(newOutputs)
      rafRef.current = requestAnimationFrame(poll)
    }

    rafRef.current = requestAnimationFrame(poll)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, activeNodes])

  // Get active effects for display
  const getActiveEffects = () => {
    const effects: string[] = []
    activeNodes.forEach(node => {
      if (node.type === 'lfo') return
      const out = outputs[node.id]
      if (!out) return

      if (out.rotation !== undefined) {
        effects.push(`Rotation: ${out.rotation.toFixed(1)}°`)
      }
      if (out.scaleX !== undefined) {
        effects.push(`Scale: ${out.scaleX.toFixed(2)}`)
      }
      if (out.opacity !== undefined) {
        effects.push(`Opacity: ${Math.round(out.opacity * 100)}%`)
      }
    })
    return effects
  }

  // Render node components (headless)
  const nodeElements = useMemo(() => {
    if (!isPlaying) return null

    return activeNodes.map(node => {
      const props = { id: node.id, ...node.config }

      switch (node.type) {
        case 'rotation':
          return <RotationNode key={node.id} {...props as RotationNodeProps} />
        case 'scale':
          return <ScaleNode key={node.id} {...props as ScaleNodeProps} />
        case 'opacity':
          return <OpacityNode key={node.id} {...props as OpacityNodeProps} />
        case 'lfo':
          return <LFONode key={node.id} {...props as LFONodeProps} />
        case 'physics':
          return <PhysicsNodeFallback key={`${node.id}-${resetKey}`} {...props as PhysicsNodeProps} />
        case 'collision':
          return <CollisionNode key={`${node.id}-${resetKey}`} {...props as CollisionNodeProps} />
        default:
          return null
      }
    })
  }, [isPlaying, activeNodes])

  return (
    <div className={styles.container}>
      {/* Headless nodes */}
      {nodeElements}

      {/* Top Bar */}
      <div className={styles.topBar}>
        <h1>Node Tester</h1>

        {/* Active Nodes List */}
        {activeNodes.length > 0 && (
          <div className={styles.nodesList}>
            {activeNodes.map(node => (
              <div
                key={node.id}
                className={`${styles.nodeChip} ${node.id === selectedNodeId ? styles.selected : ''} ${node.type === 'lfo' ? styles.isLfo : ''}`}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <span className={styles.nodeChipIcon}>
                  {node.type === 'rotation' && '↻'}
                  {node.type === 'scale' && '⤢'}
                  {node.type === 'opacity' && '◐'}
                  {node.type === 'lfo' && '∿'}
                  {node.type === 'physics' && '⚡'}
                  {node.type === 'collision' && '▣'}
                </span>
                {node.config.name || node.type}
                <span
                  className={styles.nodeChipClose}
                  onClick={e => {
                    e.stopPropagation()
                    removeNode(node.id)
                  }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.nodeSelector}>
          <button className={styles.nodeBtn} onClick={() => addNode('rotation')}>
            + Rotation
          </button>
          <button className={styles.nodeBtn} onClick={() => addNode('scale')}>
            + Scale
          </button>
          <button className={styles.nodeBtn} onClick={() => addNode('opacity')}>
            + Opacity
          </button>
          <button className={styles.nodeBtn} onClick={() => addNode('lfo')}>
            + LFO
          </button>
          <button className={styles.nodeBtn} onClick={() => addNode('physics')}>
            + Physics
          </button>
          <button className={styles.nodeBtn} onClick={() => addNode('collision')}>
            + Collision
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.main}>
        {/* Canvas Area */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasToolbar}>
            <button
              className={`${styles.toolBtn} ${isPlaying ? styles.playing : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
            <button
              className={styles.toolBtn}
              onClick={resetSimulation}
            >
              ↺ Reset
            </button>
            {selectedNode && (
              <button
                className={styles.toolBtn}
                onClick={() => removeNode(selectedNode.id)}
              >
                Delete
              </button>
            )}
          </div>

          <div className={styles.canvas}>
            {/* React Three Fiber Canvas with Rapier Physics */}
            <Canvas 
              orthographic 
              camera={{ zoom: 2, position: [0, 0, 10] }}
              style={{ background: '#1a1a2e' }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />
                
                {/* Grid visualization */}
                <gridHelper 
                  args={[6, 20, '#333', '#222']} 
                  rotation={[Math.PI / 2, 0, 0]} 
                  position={[0, 0, -0.1]} 
                />

                {/* Physics World */}
                <Physics 
                  gravity={[0, -9.81, 0]} 
                  paused={!isPlaying}
                  key={resetKey} // Force remount on reset
                >
                  {testObjects.map(obj => {
                    // Find attached physics and collision nodes
                    const physicsNode = activeNodes.find(n => n.targetId === obj.id && n.type === 'physics')
                    const collisionNode = activeNodes.find(n => n.targetId === obj.id && n.type === 'collision')
                    
                    return (
                      <PhysicsTestObject
                        key={`${obj.id}-${resetKey}`}
                        id={obj.id}
                        type={obj.type}
                        initialPosition={[obj.x / 100, -obj.y / 100, 0]}
                        size={[obj.width, obj.height]}
                        color={obj.color}
                        isStatic={obj.isStatic}
                        isSelected={selectedObjectId === obj.id}
                        physicsConfig={physicsNode?.config}
                        collisionConfig={collisionNode?.config}
                        physicsNodeId={physicsNode?.id}
                        onPositionUpdate={(x, y) => {
                          setTestObjects(prev => prev.map(o => 
                            o.id === obj.id ? { ...o, x, y } : o
                          ))
                        }}
                        onSelect={() => setSelectedObjectId(obj.id)}
                      />
                    )
                  })}
                </Physics>

                {/* Orthographic camera for 2D view */}
                <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={100} />
              </Suspense>
            </Canvas>

            {/* Overlay info */}
            {activeNodes.length === 0 ? (
              <div className={styles.canvasOverlay}>
                <p>Add a node to start testing</p>
              </div>
            ) : (
              <div className={styles.canvasOverlay} style={{ pointerEvents: 'none' }}>
                {getActiveEffects().map((effect, i) => (
                  <span key={i} className={styles.previewBadge}>{effect}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          {selectedNode ? (
            <>
              <div className={styles.sidePanelHeader}>
                <div>
                  <h2>{selectedNode.config.name || selectedNode.type}</h2>
                  <span className={styles.nodeTypeTag}>{selectedNode.type}</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <select
                    className={styles.propSelect}
                    style={{ width: 100, fontSize: 10, padding: '2px 4px' }}
                    value={selectedNode.targetId || ''}
                    onChange={e => updateTarget(e.target.value)}
                  >
                    {testObjects.map(obj => (
                      <option key={obj.id} value={obj.id}>{obj.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.sidePanelContent}>
                {/* Render properties based on node type */}
                {selectedNode.type === 'rotation' && (
                  <RotationProperties
                    config={selectedNode.config}
                    onChange={updateConfig}
                    availableLfos={activeNodes.filter(n => n.type === 'lfo')}
                  />
                )}
                {selectedNode.type === 'scale' && (
                  <ScaleProperties
                    config={selectedNode.config}
                    onChange={updateConfig}
                    availableLfos={activeNodes.filter(n => n.type === 'lfo')}
                  />
                )}
                {selectedNode.type === 'opacity' && (
                  <OpacityProperties
                    config={selectedNode.config}
                    onChange={updateConfig}
                    availableLfos={activeNodes.filter(n => n.type === 'lfo')}
                  />
                )}
                {selectedNode.type === 'lfo' && (
                  <LFOProperties config={selectedNode.config} onChange={updateConfig} outputs={outputs[selectedNode.id]} />
                )}
                {selectedNode.type === 'physics' && (
                  <PhysicsProperties config={selectedNode.config} onChange={updateConfig} />
                )}
                {selectedNode.type === 'collision' && (
                  <CollisionProperties config={selectedNode.config} onChange={updateConfig} />
                )}
              </div>

              {/* Outputs */}
              <div className={styles.outputPanel}>
                <h3>Outputs</h3>
                <pre className={styles.outputValues}>
                  {outputs[selectedNode.id]
                    ? JSON.stringify(outputs[selectedNode.id], null, 2)
                    : 'No outputs yet'}
                </pre>
              </div>
            </>
          ) : (
            <div className={styles.sidePanelContent}>
              <div className={styles.propGroupTitle}>Objects &amp; Nodes</div>
              {testObjects.map(obj => {
                const objIcon = obj.type === 'ball' ? '🔵' : obj.type === 'box' ? '🔴' : '⬛'
                const objNodes = activeNodes.filter(n => n.targetId === obj.id)
                return (
                  <div 
                    key={obj.id} 
                    className={`${styles.objectStack} ${selectedObjectId === obj.id ? styles.selectedStack : ''}`}
                    onClick={() => setSelectedObjectId(obj.id)}
                  >
                    <div className={styles.objectStackHeader}>
                      <span>{objIcon} {obj.id}</span>
                      {obj.isStatic && <span className={styles.staticTag}>static</span>}
                    </div>
                    {objNodes.length > 0 ? (
                      <div className={styles.objectStackNodes}>
                        {objNodes.map(node => {
                          const nodeIcon = 
                            node.type === 'physics' ? '⚡' : 
                            node.type === 'collision' ? '▣' : 
                            node.type === 'rotation' ? '🔄' :
                            node.type === 'scale' ? '📐' :
                            node.type === 'opacity' ? '👁' :
                            node.type === 'lfo' ? '〰' : '•'
                          return (
                            <div 
                              key={node.id} 
                              className={`${styles.stackNode} ${selectedNodeId === node.id ? styles.selectedStackNode : ''}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id) }}
                            >
                              <span>{nodeIcon} {node.config.name || node.type}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className={styles.noNodes}>No nodes attached</div>
                    )}
                  </div>
                )
              })}
              <div className={styles.stackHint}>
                Click an object to select it, then add nodes from the top bar.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Property Editors for each node type
function RotationProperties({ config, onChange, availableLfos }: { config: any; onChange: (k: string, v: any) => void; availableLfos: ActiveNode[] }) {
  return (
    <>
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Mode</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Mode</span>
          <select
            className={styles.propSelect}
            value={config.mode}
            onChange={e => onChange('mode', e.target.value)}
          >
            <option value="Static">Static</option>
            <option value="Animated">Animated</option>
            <option value="Controlled">Controlled</option>
          </select>
        </div>
      </div>

      {config.mode === 'Static' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Static</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Angle</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="360"
                value={config.staticAngle}
                onChange={e => onChange('staticAngle', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.staticAngle}°</span>
            </div>
          </div>
        </div>
      )}

      {config.mode === 'Animated' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Animation</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.continuous}
                onChange={e => onChange('continuous', e.target.checked)}
              />
              Continuous
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Speed</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.speed}
                onChange={e => onChange('speed', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.speed}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Direction</span>
            <select
              className={styles.propSelect}
              value={config.direction}
              onChange={e => onChange('direction', e.target.value)}
            >
              <option value="CW">Clockwise</option>
              <option value="CCW">Counter-CW</option>
            </select>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Start Angle</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="360"
                value={config.startAngle}
                onChange={e => onChange('startAngle', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.startAngle}°</span>
            </div>
          </div>
        </div>
      )}

      {config.mode === 'Controlled' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Input Source</div>
          {availableLfos.length === 0 ? (
            <p style={{ fontSize: 12, color: '#888' }}>Add an LFO node to use as input source</p>
          ) : (
            <>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Source</span>
                <select
                  className={styles.propSelect}
                  value={config.inputNodeId || ''}
                  onChange={e => {
                    onChange('inputNodeId', e.target.value)
                    onChange('inputProperty', 'value')
                  }}
                >
                  <option value="">Select LFO...</option>
                  {availableLfos.map(lfo => (
                    <option key={lfo.id} value={lfo.id}>{lfo.config.name || lfo.id}</option>
                  ))}
                </select>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Multiplier</span>
                <input
                  type="number"
                  className={styles.propInput}
                  value={config.multiplier ?? 360}
                  onChange={e => onChange('multiplier', Number(e.target.value))}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Offset</span>
                <input
                  type="number"
                  className={styles.propInput}
                  value={config.offset ?? 0}
                  onChange={e => onChange('offset', Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Anchor Point</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>X</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="100"
              value={config.anchorX}
              onChange={e => onChange('anchorX', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.anchorX}%</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Y</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="100"
              value={config.anchorY}
              onChange={e => onChange('anchorY', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.anchorY}%</span>
          </div>
        </div>
      </div>
    </>
  )
}

function ScaleProperties({ config, onChange, availableLfos }: { config: any; onChange: (k: string, v: any) => void; availableLfos: ActiveNode[] }) {
  return (
    <>
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Mode</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Mode</span>
          <select
            className={styles.propSelect}
            value={config.mode}
            onChange={e => onChange('mode', e.target.value)}
          >
            <option value="Static">Static</option>
            <option value="Animated">Animated</option>
            <option value="Controlled">Controlled</option>
          </select>
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.uniform}
              onChange={e => onChange('uniform', e.target.checked)}
            />
            Uniform Scale
          </label>
        </div>
      </div>

      {config.mode === 'Static' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Scale</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Scale X</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={config.staticScaleX}
                onChange={e => onChange('staticScaleX', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.staticScaleX}</span>
            </div>
          </div>
        </div>
      )}

      {config.mode === 'Animated' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Animation</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Start Scale</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={config.startScaleX}
                onChange={e => onChange('startScaleX', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.startScaleX}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>End Scale</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={config.endScaleX}
                onChange={e => onChange('endScaleX', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.endScaleX}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Duration</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.duration}
                onChange={e => onChange('duration', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.duration}s</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.loop}
                onChange={e => onChange('loop', e.target.checked)}
              />
              Loop
            </label>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.yoyo}
                onChange={e => onChange('yoyo', e.target.checked)}
              />
              Yoyo
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Easing</span>
            <select
              className={styles.propSelect}
              value={config.easing}
              onChange={e => onChange('easing', e.target.value)}
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In-Out</option>
              <option value="spring">Spring</option>
            </select>
          </div>
        </div>
      )}

      {config.mode === 'Controlled' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Input Source</div>
          {availableLfos.length === 0 ? (
            <p style={{ fontSize: 12, color: '#888' }}>Add an LFO node to use as input source</p>
          ) : (
            <>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Source</span>
                <select
                  className={styles.propSelect}
                  value={config.inputNodeId || ''}
                  onChange={e => {
                    onChange('inputNodeId', e.target.value)
                    onChange('inputProperty', 'value')
                  }}
                >
                  <option value="">Select LFO...</option>
                  {availableLfos.map(lfo => (
                    <option key={lfo.id} value={lfo.id}>{lfo.config.name || lfo.id}</option>
                  ))}
                </select>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Base Scale</span>
                <input
                  type="number"
                  className={styles.propInput}
                  step="0.1"
                  value={config.baseScale ?? 1}
                  onChange={e => onChange('baseScale', Number(e.target.value))}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Multiplier</span>
                <input
                  type="number"
                  className={styles.propInput}
                  step="0.1"
                  value={config.multiplier ?? 0.5}
                  onChange={e => onChange('multiplier', Number(e.target.value))}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Offset</span>
                <input
                  type="number"
                  className={styles.propInput}
                  step="0.1"
                  value={config.offset ?? 0}
                  onChange={e => onChange('offset', Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Anchor Point</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>X</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="100"
              value={config.anchorX}
              onChange={e => onChange('anchorX', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.anchorX}%</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Y</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="100"
              value={config.anchorY}
              onChange={e => onChange('anchorY', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.anchorY}%</span>
          </div>
        </div>
      </div>
    </>
  )
}

function OpacityProperties({ config, onChange, availableLfos }: { config: any; onChange: (k: string, v: any) => void; availableLfos: ActiveNode[] }) {
  return (
    <>
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Mode</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Mode</span>
          <select
            className={styles.propSelect}
            value={config.mode}
            onChange={e => onChange('mode', e.target.value)}
          >
            <option value="Static">Static</option>
            <option value="Animated">Animated</option>
            <option value="Controlled">Controlled</option>
          </select>
        </div>
      </div>

      {config.mode === 'Static' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Opacity</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Opacity</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.staticOpacity}
                onChange={e => onChange('staticOpacity', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{Math.round(config.staticOpacity * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {config.mode === 'Animated' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Animation</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Effect</span>
            <select
              className={styles.propSelect}
              value={config.effect}
              onChange={e => onChange('effect', e.target.value)}
            >
              <option value="none">None (Custom)</option>
              <option value="fadeIn">Fade In</option>
              <option value="fadeOut">Fade Out</option>
              <option value="pulse">Pulse</option>
              <option value="blink">Blink</option>
            </select>
          </div>
          {config.effect === 'none' && (
            <>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Start</span>
                <div className={styles.propSlider}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.startOpacity}
                    onChange={e => onChange('startOpacity', Number(e.target.value))}
                  />
                  <span className={styles.propSliderValue}>{Math.round(config.startOpacity * 100)}%</span>
                </div>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>End</span>
                <div className={styles.propSlider}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.endOpacity}
                    onChange={e => onChange('endOpacity', Number(e.target.value))}
                  />
                  <span className={styles.propSliderValue}>{Math.round(config.endOpacity * 100)}%</span>
                </div>
              </div>
            </>
          )}
          {config.effect === 'blink' && (
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Blink Speed</span>
              <div className={styles.propSlider}>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={config.blinkSpeed}
                  onChange={e => onChange('blinkSpeed', Number(e.target.value))}
                />
                <span className={styles.propSliderValue}>{config.blinkSpeed}/s</span>
              </div>
            </div>
          )}
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Duration</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.duration}
                onChange={e => onChange('duration', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.duration}s</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.loop}
                onChange={e => onChange('loop', e.target.checked)}
              />
              Loop
            </label>
          </div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.yoyo}
                onChange={e => onChange('yoyo', e.target.checked)}
              />
              Yoyo
            </label>
          </div>
        </div>
      )}

      {config.mode === 'Controlled' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Input Source</div>
          {availableLfos.length === 0 ? (
            <p style={{ fontSize: 12, color: '#888' }}>Add an LFO node to use as input source</p>
          ) : (
            <>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Source</span>
                <select
                  className={styles.propSelect}
                  value={config.inputNodeId || ''}
                  onChange={e => {
                    onChange('inputNodeId', e.target.value)
                    onChange('inputProperty', 'value')
                  }}
                >
                  <option value="">Select LFO...</option>
                  {availableLfos.map(lfo => (
                    <option key={lfo.id} value={lfo.id}>{lfo.config.name || lfo.id}</option>
                  ))}
                </select>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Base Opacity</span>
                <div className={styles.propSlider}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.baseOpacity ?? 0.5}
                    onChange={e => onChange('baseOpacity', Number(e.target.value))}
                  />
                  <span className={styles.propSliderValue}>{Math.round((config.baseOpacity ?? 0.5) * 100)}%</span>
                </div>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Multiplier</span>
                <div className={styles.propSlider}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.multiplier ?? 0.5}
                    onChange={e => onChange('multiplier', Number(e.target.value))}
                  />
                  <span className={styles.propSliderValue}>{config.multiplier ?? 0.5}</span>
                </div>
              </div>
              <div className={styles.propRow}>
                <label className={styles.propCheckbox} title="Limita el valor de opacidad entre 0% y 100%. Sin esto, valores como 130% o -20% serian posibles.">
                  <input
                    type="checkbox"
                    checked={config.clamp ?? true}
                    onChange={e => onChange('clamp', e.target.checked)}
                  />
                  Limitar a 0-100%
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

function LFOProperties({ config, onChange, outputs }: { config: any; onChange: (k: string, v: any) => void; outputs?: any }) {
  const normalizedValue = outputs?.normalized ?? 0

  return (
    <>
      {/* LFO Visualizer */}
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Output</div>
        <div className={styles.lfoVisualizer}>
          <div className={styles.lfoWave}>
            <div className={styles.lfoBar} style={{ height: `${normalizedValue * 100}%` }} />
          </div>
          <span className={styles.lfoValue}>
            {outputs?.value?.toFixed(2) ?? '0.00'}
          </span>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Waveform</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Type</span>
          <select
            className={styles.propSelect}
            value={config.waveform}
            onChange={e => onChange('waveform', e.target.value)}
          >
            <option value="sine">Sine</option>
            <option value="triangle">Triangle</option>
            <option value="square">Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="noise">Noise</option>
          </select>
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => onChange('enabled', e.target.checked)}
            />
            Enabled
          </label>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Timing</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Frequency</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={config.frequency}
              onChange={e => onChange('frequency', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.frequency} Hz</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Phase</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="360"
              value={config.phase}
              onChange={e => onChange('phase', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.phase}°</span>
          </div>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Output Range</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Min</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.min}
            onChange={e => onChange('min', Number(e.target.value))}
          />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Max</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.max}
            onChange={e => onChange('max', Number(e.target.value))}
          />
        </div>
      </div>
    </>
  )
}

// Physics Properties
function PhysicsProperties({ config, onChange }: { config: any; onChange: (k: string, v: any) => void }) {
  return (
    <>
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Physics Mode</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Mode</span>
          <select
            className={styles.propSelect}
            value={config.mode}
            onChange={e => onChange('mode', e.target.value)}
          >
            <option value="Dynamic">Dynamic</option>
            <option value="Static">Static</option>
            <option value="Kinematic">Kinematic</option>
          </select>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Mass</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={config.mass}
              onChange={e => onChange('mass', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.mass}</span>
          </div>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Forces</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Gravity</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.gravityScale}
              onChange={e => onChange('gravityScale', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.gravityScale}</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Damping</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.linearDamping}
              onChange={e => onChange('linearDamping', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.linearDamping}</span>
          </div>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Initial State</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Velocity X</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.initialVelocityX}
            onChange={e => onChange('initialVelocityX', Number(e.target.value))}
          />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Velocity Y</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.initialVelocityY}
            onChange={e => onChange('initialVelocityY', Number(e.target.value))}
          />
        </div>
      </div>
    </>
  )
}

// Collision Properties
function CollisionProperties({ config, onChange }: { config: any; onChange: (k: string, v: any) => void }) {
  return (
    <>
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Collision Shape</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Shape</span>
          <select
            className={styles.propSelect}
            value={config.shape}
            onChange={e => onChange('shape', e.target.value)}
          >
            <option value="Box">Box</option>
            <option value="Circle">Circle</option>
            <option value="Capsule">Capsule</option>
            <option value="Polygon">Polygon</option>
          </select>
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.autoShape}
              onChange={e => onChange('autoShape', e.target.checked)}
            />
            Auto Shape
          </label>
        </div>
        {!config.autoShape && (
          <>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Width</span>
              <input
                type="number"
                className={styles.propInput}
                value={config.shapeWidth}
                onChange={e => onChange('shapeWidth', Number(e.target.value))}
              />
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Height</span>
              <input
                type="number"
                className={styles.propInput}
                value={config.shapeHeight}
                onChange={e => onChange('shapeHeight', Number(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Surface Type</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Type</span>
          <select
            className={styles.propSelect}
            value={config.surfaceType}
            onChange={e => onChange('surfaceType', e.target.value)}
          >
            <option value="Solid">Solid</option>
            <option value="Trigger">Trigger (detect only)</option>
            <option value="Platform">Platform (one-way)</option>
          </select>
        </div>
        {config.surfaceType === 'Platform' && (
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Direction</span>
            <select
              className={styles.propSelect}
              value={config.platformDirection}
              onChange={e => onChange('platformDirection', e.target.value)}
            >
              <option value="Up">Up</option>
              <option value="Down">Down</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
            </select>
          </div>
        )}
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Surface Properties</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Friction</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.friction}
              onChange={e => onChange('friction', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.friction}</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Bounciness</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.bounciness}
              onChange={e => onChange('bounciness', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.bounciness}</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Adhesion</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.adhesion}
              onChange={e => onChange('adhesion', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.adhesion}</span>
          </div>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Collision Response</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>On Collision</span>
          <select
            className={styles.propSelect}
            value={config.onCollisionResponse}
            onChange={e => onChange('onCollisionResponse', e.target.value)}
          >
            <option value="Bounce">Bounce</option>
            <option value="Stick">Stick</option>
            <option value="Stop">Stop</option>
            <option value="Pass">Pass Through</option>
          </select>
        </div>
      </div>

      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Collision Groups</div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Group</span>
          <input
            type="number"
            className={styles.propInput}
            min="0"
            max="15"
            value={config.collisionGroup}
            onChange={e => onChange('collisionGroup', Number(e.target.value))}
          />
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.outputCollisions}
              onChange={e => onChange('outputCollisions', e.target.checked)}
            />
            Output Collisions
          </label>
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.outputOverlaps}
              onChange={e => onChange('outputOverlaps', e.target.checked)}
            />
            Output Overlaps
          </label>
        </div>
      </div>
    </>
  )
}
