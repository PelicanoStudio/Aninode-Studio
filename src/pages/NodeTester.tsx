import { useState, useEffect, useRef, useMemo } from 'react'
import { RotationNode, RotationNodeProps } from '@nodes/RotationNode'
import { ScaleNode, ScaleNodeProps } from '@nodes/ScaleNode'
import { OpacityNode, OpacityNodeProps } from '@nodes/OpacityNode'
import { LFONode, LFONodeProps } from '@nodes/LFONode'
import { aninodeStore } from '@core/store'
import styles from './NodeTester.module.css'

type NodeTypeKey = 'rotation' | 'scale' | 'opacity' | 'lfo'

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
}

export function NodeTester() {
  const [activeNodes, setActiveNodes] = useState<ActiveNode[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const rafRef = useRef<number>()

  // Get selected node
  const selectedNode = activeNodes.find(n => n.id === selectedNodeId)

  // Add a new node
  const addNode = (type: NodeTypeKey) => {
    const id = `${type}_${Date.now()}`
    const newNode: ActiveNode = {
      type,
      id,
      config: { ...DEFAULT_CONFIGS[type] },
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

  // Compute combined transform for preview box (all non-LFO nodes)
  const getPreviewStyle = () => {
    const style: React.CSSProperties = {}
    let transforms: string[] = []
    let anchorX = 50
    let anchorY = 50

    // Combine outputs from all visual nodes (not LFO)
    activeNodes.forEach(node => {
      if (node.type === 'lfo') return // LFO doesn't affect visuals directly

      const out = outputs[node.id]
      if (!out) return

      // Rotation
      if (out.rotation !== undefined) {
        transforms.push(`rotate(${out.rotation}deg)`)
        if (out.anchorX !== undefined) {
          anchorX = out.anchorX
          anchorY = out.anchorY ?? 50
        }
      }

      // Scale
      if (out.scaleX !== undefined || out.scaleY !== undefined) {
        const scaleX = out.scaleX ?? 1
        const scaleY = out.scaleY ?? 1
        transforms.push(`scale(${scaleX}, ${scaleY})`)
        if (out.anchorX !== undefined && node.type === 'scale') {
          anchorX = out.anchorX
          anchorY = out.anchorY ?? 50
        }
      }

      // Opacity
      if (out.opacity !== undefined) {
        style.opacity = out.opacity
      }
    })

    if (transforms.length > 0) {
      style.transform = transforms.join(' ')
      style.transformOrigin = `${anchorX}% ${anchorY}%`
    }

    return style
  }

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
                  <div
                    className={`${styles.previewBox} ${selectedNodeId ? styles.selected : ''}`}
                    style={getPreviewStyle()}
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
                <label className={styles.propCheckbox}>
                  <input
                    type="checkbox"
                    checked={config.clamp ?? true}
                    onChange={e => onChange('clamp', e.target.checked)}
                  />
                  Clamp (0-1)
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
