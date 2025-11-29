import { useState, useEffect, useRef, useMemo } from 'react'
import { RotationNode, RotationNodeProps } from './index'
import { aninodeStore } from '@core/store'
import styles from './RotationNodeTester.module.css'

/**
 * Testing component for RotationNode
 * Allows you to configure and test rotation behavior
 */
export function RotationNodeTester() {
  const [config, setConfig] = useState<Partial<RotationNodeProps>>({
    id: 'rotation_test_1',
    name: 'Test Rotation',
    mode: 'Animated',
    staticAngle: 45,
    animationEnabled: true,
    startAngle: 0,
    endAngle: 360,
    speed: 1,
    direction: 'CW',
    continuous: true,
    duration: 2,
    loop: false,
    yoyo: false,
    multiplier: 1,
    offset: 0,
    anchorX: 50,
    anchorY: 50,
  })

  const [isActive, setIsActive] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, any> | null>(null)
  const animationFrameRef = useRef<number>()

  // Poll for rotation updates instead of using useSnapshot (which causes re-renders)
  useEffect(() => {
    if (!isActive) {
      setCurrentRotation(0)
      setNodeOutputs(null)
      return
    }

    const updateRotation = () => {
      const node = aninodeStore.nodes['rotation_test_1']
      if (node?.outputs?.rotation !== undefined) {
        setCurrentRotation(node.outputs.rotation)
        setNodeOutputs({ ...node.outputs })
      }
      animationFrameRef.current = requestAnimationFrame(updateRotation)
    }

    animationFrameRef.current = requestAnimationFrame(updateRotation)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive])

  // Memoize the RotationNode to prevent unnecessary re-renders
  const rotationNodeElement = useMemo(() => {
    if (!isActive) return null
    return <RotationNode {...(config as RotationNodeProps)} />
  }, [isActive, config])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🔄 RotationNode Tester</h2>
        <button
          className={styles.toggleButton}
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? 'Stop Node' : 'Start Node'}
        </button>
      </div>

      {rotationNodeElement}

      <div className={styles.content}>
        {/* Live Preview */}
        <div className={styles.preview}>
          <h3>Live Preview</h3>
          <div className={styles.previewBox}>
            <div
              className={styles.rotatingBox}
              style={{
                transform: `rotate(${currentRotation}deg)`,
                transformOrigin: `${config.anchorX}% ${config.anchorY}%`,
              }}
            >
              <div className={styles.arrow}>→</div>
            </div>
          </div>
          <div className={styles.stats}>
            <div>
              <strong>Rotation:</strong> {currentRotation.toFixed(2)}°
            </div>
            <div>
              <strong>Anchor:</strong> ({config.anchorX}%, {config.anchorY}%)
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className={styles.config}>
          <h3>Configuration</h3>

          {/* Mode Selection */}
          <div className={styles.group}>
            <label>Mode</label>
            <select
              value={config.mode}
              onChange={(e) =>
                setConfig({ ...config, mode: e.target.value as any })
              }
            >
              <option value="Static">Static</option>
              <option value="Animated">Animated</option>
              <option value="Controlled">Controlled</option>
            </select>
          </div>

          {/* Static Mode */}
          {config.mode === 'Static' && (
            <div className={styles.group}>
              <label>Static Angle (degrees)</label>
              <input
                type="range"
                min="0"
                max="360"
                value={config.staticAngle}
                onChange={(e) =>
                  setConfig({ ...config, staticAngle: Number(e.target.value) })
                }
              />
              <span>{config.staticAngle}°</span>
            </div>
          )}

          {/* Animated Mode */}
          {config.mode === 'Animated' && (
            <>
              <div className={styles.group}>
                <label>
                  <input
                    type="checkbox"
                    checked={config.animationEnabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        animationEnabled: e.target.checked,
                      })
                    }
                  />
                  Animation Enabled
                </label>
              </div>

              <div className={styles.group}>
                <label>
                  <input
                    type="checkbox"
                    checked={config.continuous}
                    onChange={(e) =>
                      setConfig({ ...config, continuous: e.target.checked })
                    }
                  />
                  Continuous Rotation
                </label>
              </div>

              {config.continuous ? (
                <>
                  <div className={styles.group}>
                    <label>Speed (rotations/sec)</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={config.speed}
                      onChange={(e) =>
                        setConfig({ ...config, speed: Number(e.target.value) })
                      }
                    />
                    <span>{config.speed}</span>
                  </div>

                  <div className={styles.group}>
                    <label>Direction</label>
                    <select
                      value={config.direction}
                      onChange={(e) =>
                        setConfig({ ...config, direction: e.target.value as any })
                      }
                    >
                      <option value="CW">Clockwise (CW)</option>
                      <option value="CCW">Counter-Clockwise (CCW)</option>
                    </select>
                  </div>

                  <div className={styles.group}>
                    <label>Start Angle (degrees)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={config.startAngle}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          startAngle: Number(e.target.value),
                        })
                      }
                    />
                    <span>{config.startAngle}°</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.group}>
                    <label>Start Angle (degrees)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={config.startAngle}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          startAngle: Number(e.target.value),
                        })
                      }
                    />
                    <span>{config.startAngle}°</span>
                  </div>

                  <div className={styles.group}>
                    <label>End Angle (degrees)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={config.endAngle}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          endAngle: Number(e.target.value),
                        })
                      }
                    />
                    <span>{config.endAngle}°</span>
                  </div>

                  <div className={styles.group}>
                    <label>Duration (seconds)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={config.duration}
                      onChange={(e) =>
                        setConfig({ ...config, duration: Number(e.target.value) })
                      }
                    />
                    <span>{config.duration}s</span>
                  </div>

                  <div className={styles.group}>
                    <label>
                      <input
                        type="checkbox"
                        checked={config.loop}
                        onChange={(e) =>
                          setConfig({ ...config, loop: e.target.checked })
                        }
                      />
                      Loop
                    </label>
                  </div>

                  {config.loop && (
                    <div className={styles.group}>
                      <label>
                        <input
                          type="checkbox"
                          checked={config.yoyo}
                          onChange={(e) =>
                            setConfig({ ...config, yoyo: e.target.checked })
                          }
                        />
                        Yoyo (Reverse)
                      </label>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Controlled Mode */}
          {config.mode === 'Controlled' && (
            <>
              <div className={styles.group}>
                <label>Input Node ID</label>
                <input
                  type="text"
                  value={config.inputNodeId || ''}
                  onChange={(e) =>
                    setConfig({ ...config, inputNodeId: e.target.value })
                  }
                  placeholder="e.g., lfo1"
                />
              </div>

              <div className={styles.group}>
                <label>Input Property</label>
                <input
                  type="text"
                  value={config.inputProperty || ''}
                  onChange={(e) =>
                    setConfig({ ...config, inputProperty: e.target.value })
                  }
                  placeholder="e.g., value"
                />
              </div>

              <div className={styles.group}>
                <label>Multiplier</label>
                <input
                  type="number"
                  value={config.multiplier}
                  onChange={(e) =>
                    setConfig({ ...config, multiplier: Number(e.target.value) })
                  }
                />
              </div>

              <div className={styles.group}>
                <label>Offset</label>
                <input
                  type="number"
                  value={config.offset}
                  onChange={(e) =>
                    setConfig({ ...config, offset: Number(e.target.value) })
                  }
                />
              </div>
            </>
          )}

          {/* Anchor/Pivot Point */}
          <div className={styles.separator} />
          <h4>Transform Origin (Pivot Point)</h4>

          <div className={styles.group}>
            <label>Anchor X (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.anchorX}
              onChange={(e) =>
                setConfig({ ...config, anchorX: Number(e.target.value) })
              }
            />
            <span>{config.anchorX}%</span>
          </div>

          <div className={styles.group}>
            <label>Anchor Y (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.anchorY}
              onChange={(e) =>
                setConfig({ ...config, anchorY: Number(e.target.value) })
              }
            />
            <span>{config.anchorY}%</span>
          </div>
        </div>

        {/* Output Values */}
        <div className={styles.outputs}>
          <h3>Node Outputs</h3>
          {nodeOutputs ? (
            <pre>{JSON.stringify(nodeOutputs, null, 2)}</pre>
          ) : (
            <p>Node not active</p>
          )}
        </div>
      </div>
    </div>
  )
}
