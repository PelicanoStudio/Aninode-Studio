import { useState, useEffect, useRef, useMemo } from 'react'
import { RotationNode, RotationNodeProps } from '@nodes/RotationNode'
import { ScaleNode, ScaleNodeProps } from '@nodes/ScaleNode'
import { OpacityNode, OpacityNodeProps } from '@nodes/OpacityNode'
import { LFONode, LFONodeProps } from '@nodes/LFONode'
import { PhysicsNode, PhysicsNodeProps } from '@nodes/PhysicsNode'
import { aninodeStore } from '@core/store'
import styles from './NodeTester.module.css'

type NodeTypeKey = 'rotation' | 'scale' | 'opacity' | 'lfo' | 'physics'

type ActiveNode = {
  type: NodeTypeKey
  id: string
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
    mode: 'Gravity',
    gravityEnabled: true,
    gravityStrength: 9.8,
    gravityDirection: 'Down',
    customGravityX: 0,
    customGravityY: 0,
    bounceEnabled: false,
    bounceStrength: 0.8,
    bounceDecay: 0.95,
    elasticity: 0.7,
    parabolaEnabled: false,
    initialVelocityX: 0,
    initialVelocityY: 0,
    airResistance: 0.01,
    collisionEnabled: false,
    collisionObjects: [],
    repulsionStrength: 1,
    attractionStrength: 1,
    attractorEnabled: false,
    attractorObjects: [],
    attractorStrength: 1,
    attractorRadius: 100,
    randomPathEnabled: false,
    randomness: 0.5,
    pathComplexity: 5,
    movementSpeed: 1,
    mass: 1,
    friction: 0.1,
    positionX: 0,
    positionY: 0,
    velocityX: 0,
    velocityY: 0,
    outputPosition: true,
    outputVelocity: true,
    outputAcceleration: false,
  },
}

export function NodeTester() {
  const [activeNodes, setActiveNodes] = useState<ActiveNode[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const rafRef = useRef<number>()

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
      config: { ...DEFAULT_CONFIGS[type], name: displayName },
    }
    setActiveNodes(prev => [...prev, newNode])
    setSelectedNodeId(id)
    setIsPlaying(true)
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

  // Remove node
  const removeNode = (id: string) => {
    setActiveNodes(prev => prev.filter(n => n.id !== id))
    if (selectedNodeId === id) {
      setSelectedNodeId(null)
    }
  }

  // Poll outputs
  useEffect(() => {
    if (!isPlaying || activeNodes.length === 0) return

    const update = () => {
      const newOutputs: Record<string, any> = {}
      activeNodes.forEach(node => {
        const storeNode = aninodeStore.nodes[node.id]
        if (storeNode?.outputs) {
          newOutputs[node.id] = { ...storeNode.outputs }
        }
      })
      setOutputs(newOutputs)
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, activeNodes])

  // Compute separate transforms for each type (to support different anchor points)
  const getTransformLayers = () => {
    let rotationStyle: React.CSSProperties = {}
    let scaleStyle: React.CSSProperties = {}
    let positionStyle: React.CSSProperties = {}
    let opacityValue = 1

    // Collect transforms from all visual nodes (not LFO)
    activeNodes.forEach(node => {
      if (node.type === 'lfo') return

      const out = outputs[node.id]
      if (!out) return

      // Physics - apply position transforms
      if (out.positionX !== undefined || out.positionY !== undefined) {
        // For physics nodes, we want to apply position as a transform
        const positionX = out.positionX ?? 0
        const positionY = out.positionY ?? 0
        positionStyle = {
          transform: `translate(${positionX}px, ${positionY}px)`,
        }
      }

      // Rotation - each rotation node can have its own anchor
      if (out.rotation !== undefined && node.type === 'rotation') {
        const anchorX = out.anchorX ?? 50
        const anchorY = out.anchorY ?? 50
        // Combine rotations if multiple
        const existingRotation = rotationStyle.transform
          ? parseFloat((rotationStyle.transform as string).replace('rotate(', '').replace('deg)', ''))
          : 0
        rotationStyle = {
          transform: `rotate(${existingRotation + out.rotation}deg)`,
          transformOrigin: `${anchorX}% ${anchorY}%`,
        }
      }

      // Scale - each scale node can have its own anchor
      if ((out.scaleX !== undefined || out.scaleY !== undefined) && node.type === 'scale') {
        const scaleX = out.scaleX ?? 1
        const scaleY = out.scaleY ?? 1
        const anchorX = out.anchorX ?? 50
        const anchorY = out.anchorY ?? 50
        // Combine scales if multiple (multiply)
        const existingScaleX = scaleStyle.transform
          ? parseFloat((scaleStyle.transform as string).split(',')[0].replace('scale(', ''))
          : 1
        const existingScaleY = scaleStyle.transform
          ? parseFloat((scaleStyle.transform as string).split(',')[1]?.replace(')', '') || '1')
          : 1
        scaleStyle = {
          transform: `scale(${existingScaleX * scaleX}, ${existingScaleY * scaleY})`,
          transformOrigin: `${anchorX}% ${anchorY}%`,
        }
      }

      // Opacity (combine by multiply)
      if (out.opacity !== undefined) {
        opacityValue *= out.opacity
      }
    })

    return { positionStyle, rotationStyle, scaleStyle, opacityValue }
  }

  // Get active effects for display
  const getActiveEffects = () => {
    const effects: string[] = []
    activeNodes.forEach(node => {
      if (node.type === 'lfo') return
      const out = outputs[node.id]
      if (!out) return

      // Physics position effects
      if (out.positionX !== undefined || out.positionY !== undefined) {
        const positionX = out.positionX !== undefined ? out.positionX.toFixed(1) : '0'
        const positionY = out.positionY !== undefined ? out.positionY.toFixed(1) : '0'
        effects.push(`Position: (${positionX}, ${positionY})`)
      }
      
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
          return <PhysicsNode key={node.id} {...props as PhysicsNodeProps} />
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
            <div className={styles.canvasGrid} />

            {activeNodes.length === 0 ? (
              <div className={styles.noSelection}>
                <p>Add a node to start testing</p>
              </div>
            ) : (
              <>
                <div className={styles.previewContainer}>
                  {/* Nested wrappers for independent anchor points per transform type */}
                  {(() => {
                    const { positionStyle, rotationStyle, scaleStyle, opacityValue } = getTransformLayers()
                    return (
                      // Outer wrapper: Position (from physics)
                      <div style={positionStyle} className={styles.transformLayer}>
                        {/* Middle wrapper: Rotation (with its own transform-origin) */}
                        <div style={rotationStyle} className={styles.transformLayer}>
                          {/* Inner wrapper: Scale (with its own transform-origin) */}
                          <div style={scaleStyle} className={styles.transformLayer}>
                            {/* Inner: The actual preview box with opacity */}
                            <div
                              className={`${styles.previewBox} ${selectedNodeId ? styles.selected : ''}`}
                              style={{ opacity: opacityValue }}
                              onClick={() => {
                              // Cycle through nodes on click
                              if (activeNodes.length > 0) {
                                const currentIndex = activeNodes.findIndex(n => n.id === selectedNodeId)
                                const nextIndex = (currentIndex + 1) % activeNodes.length
                                setSelectedNodeId(activeNodes[nextIndex].id)
                              }
                            }}
                          >
                            <span className={styles.previewArrow}>→</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Show combined effects */}
                <div className={styles.previewInfo}>
                  {getActiveEffects().map((effect, i) => (
                    <span key={i} className={styles.previewBadge}>{effect}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          {selectedNode ? (
            <>
              <div className={styles.sidePanelHeader}>
                <h2>{selectedNode.config.name || selectedNode.type}</h2>
                <span className={styles.nodeTypeTag}>{selectedNode.type}</span>
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
                  <PhysicsProperties
                    config={selectedNode.config}
                    onChange={updateConfig}
                    availableLfos={activeNodes.filter(n => n.type === 'lfo')}
                  />
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
            <div className={styles.noSelection}>
              <p>Select a node to edit properties</p>
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

function PhysicsProperties({ config, onChange, availableLfos }: { config: any; onChange: (k: string, v: any) => void; availableLfos: ActiveNode[] }) {
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
            <option value="Gravity">Gravity</option>
            <option value="Bounce">Bounce</option>
            <option value="Parabola">Parabola</option>
            <option value="Collision">Collision</option>
            <option value="Attractor">Attractor</option>
            <option value="RandomPath">Random Path</option>
          </select>
        </div>
      </div>

      {/* Gravity Mode Settings */}
      {(config.mode === 'Gravity' || config.mode === 'Parabola') && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Gravity</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.gravityEnabled}
                onChange={e => onChange('gravityEnabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Strength</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="20"
                step="0.1"
                value={config.gravityStrength}
                onChange={e => onChange('gravityStrength', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.gravityStrength}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Direction</span>
            <select
              className={styles.propSelect}
              value={config.gravityDirection}
              onChange={e => onChange('gravityDirection', e.target.value)}
            >
              <option value="Down">Down</option>
              <option value="Up">Up</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          {config.gravityDirection === 'Custom' && (
            <>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Custom X</span>
                <input
                  type="number"
                  className={styles.propInput}
                  value={config.customGravityX}
                  onChange={e => onChange('customGravityX', Number(e.target.value))}
                />
              </div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Custom Y</span>
                <input
                  type="number"
                  className={styles.propInput}
                  value={config.customGravityY}
                  onChange={e => onChange('customGravityY', Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Bounce Mode Settings */}
      {config.mode === 'Bounce' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Bounce</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.bounceEnabled}
                onChange={e => onChange('bounceEnabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Bounce Strength</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.bounceStrength}
                onChange={e => onChange('bounceStrength', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.bounceStrength}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Bounce Decay</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.bounceDecay}
                onChange={e => onChange('bounceDecay', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.bounceDecay}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Elasticity</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.elasticity}
                onChange={e => onChange('elasticity', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.elasticity}</span>
            </div>
          </div>
        </div>
      )}

      {/* Parabola Mode Settings */}
      {config.mode === 'Parabola' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Parabola</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.parabolaEnabled}
                onChange={e => onChange('parabolaEnabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Initial Velocity X</span>
            <input
              type="number"
              className={styles.propInput}
              value={config.initialVelocityX}
              onChange={e => onChange('initialVelocityX', Number(e.target.value))}
            />
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Initial Velocity Y</span>
            <input
              type="number"
              className={styles.propInput}
              value={config.initialVelocityY}
              onChange={e => onChange('initialVelocityY', Number(e.target.value))}
            />
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Air Resistance</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                value={config.airResistance}
                onChange={e => onChange('airResistance', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.airResistance}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collision Mode Settings */}
      {config.mode === 'Collision' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Collision</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.collisionEnabled}
                onChange={e => onChange('collisionEnabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Repulsion</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={config.repulsionStrength}
                onChange={e => onChange('repulsionStrength', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.repulsionStrength}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Attraction</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={config.attractionStrength}
                onChange={e => onChange('attractionStrength', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.attractionStrength}</span>
            </div>
          </div>
        </div>
      )}

      {/* Attractor Mode Settings */}
      {config.mode === 'Attractor' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Attractor</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.attractorEnabled}
                onChange={e => onChange('attractorEnabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Strength</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={config.attractorStrength}
                onChange={e => onChange('attractorStrength', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.attractorStrength}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Radius</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={config.attractorRadius}
                onChange={e => onChange('attractorRadius', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.attractorRadius}</span>
            </div>
          </div>
        </div>
      )}

      {/* Random Path Mode Settings */}
      {config.mode === 'RandomPath' && (
        <div className={styles.propGroup}>
          <div className={styles.propGroupTitle}>Random Path</div>
          <div className={styles.propRow}>
            <label className={styles.propCheckbox}>
              <input
                type="checkbox"
                checked={config.randomPathEnabled}
                onChange={e => onChange('randomPathEnabled', e.target.checked)}
              />
              Enabled
            </label>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Randomness</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.randomness}
                onChange={e => onChange('randomness', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.randomness}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Complexity</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.pathComplexity}
                onChange={e => onChange('pathComplexity', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.pathComplexity}</span>
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Speed</span>
            <div className={styles.propSlider}>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={config.movementSpeed}
                onChange={e => onChange('movementSpeed', Number(e.target.value))}
              />
              <span className={styles.propSliderValue}>{config.movementSpeed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Object Properties */}
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Object Properties</div>
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
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Friction</span>
          <div className={styles.propSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.friction}
              onChange={e => onChange('friction', Number(e.target.value))}
            />
            <span className={styles.propSliderValue}>{config.friction}</span>
          </div>
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Position X</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.positionX}
            onChange={e => onChange('positionX', Number(e.target.value))}
          />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Position Y</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.positionY}
            onChange={e => onChange('positionY', Number(e.target.value))}
          />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Velocity X</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.velocityX}
            onChange={e => onChange('velocityX', Number(e.target.value))}
          />
        </div>
        <div className={styles.propRow}>
          <span className={styles.propLabel}>Velocity Y</span>
          <input
            type="number"
            className={styles.propInput}
            value={config.velocityY}
            onChange={e => onChange('velocityY', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Output Configuration */}
      <div className={styles.propGroup}>
        <div className={styles.propGroupTitle}>Output</div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.outputPosition}
              onChange={e => onChange('outputPosition', e.target.checked)}
            />
            Output Position
          </label>
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.outputVelocity}
              onChange={e => onChange('outputVelocity', e.target.checked)}
            />
            Output Velocity
          </label>
        </div>
        <div className={styles.propRow}>
          <label className={styles.propCheckbox}>
            <input
              type="checkbox"
              checked={config.outputAcceleration}
              onChange={e => onChange('outputAcceleration', e.target.checked)}
            />
            Output Acceleration
          </label>
        </div>
      </div>
    </>
  )
}
