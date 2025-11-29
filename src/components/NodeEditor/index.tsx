import { useSnapshot } from 'valtio'
import { aninodeStore, storeActions } from '@core/store'
import styles from './NodeEditor.module.css'

export function NodeEditor() {
  const snap = useSnapshot(aninodeStore)

  const nodeTypes = [
    { type: 'SceneAnimator', icon: '🎬', label: 'Scene Animator' },
    { type: 'LFO', icon: '〰️', label: 'LFO' },
    { type: 'ObjectPicker', icon: '🔗', label: 'Picker' },
    { type: 'ScaleModifier', icon: '⚙️', label: 'Modifier' },
    { type: 'LightController', icon: '💡', label: 'Light' },
    { type: 'PathDrawer', icon: '✏️', label: 'Path Drawer' },
  ]

  const handleAddNode = (type: string) => {
    const nodeId = `${type.toLowerCase()}_${Date.now()}`
    storeActions.addNode({
      id: nodeId,
      type: type as any,
      name: type,
      position: { x: 100, y: 100 },
      baseProps: {},
      overrides: {},
      outputs: {},
      connectedInputs: {},
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Node Library</h2>
      </div>

      <div className={styles.section}>
        <h3>Add Nodes</h3>
        <div className={styles.nodeGrid}>
          {nodeTypes.map((node) => (
            <button
              key={node.type}
              className={styles.nodeCard}
              onClick={() => handleAddNode(node.type)}
            >
              <span className={styles.nodeIcon}>{node.icon}</span>
              <span className={styles.nodeLabel}>{node.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Active Nodes ({Object.keys(snap.nodes).length})</h3>
        <div className={styles.nodeList}>
          {Object.values(snap.nodes).map((node) => (
            <div
              key={node.id}
              className={`${styles.nodeItem} ${
                snap.ui.selectedNodeIds.includes(node.id) ? styles.selected : ''
              }`}
              onClick={() => storeActions.selectNode(node.id)}
            >
              <span className={styles.nodeName}>{node.name}</span>
              <span className={styles.nodeType}>{node.type}</span>
            </div>
          ))}
        </div>
      </div>

      {snap.scene && (
        <div className={styles.section}>
          <h3>Scene Layers</h3>
          <div className={styles.layerList}>
            {[...snap.scene.assets]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((asset) => (
                <div
                  key={asset.id}
                  className={`${styles.layerItem} ${
                    snap.ui.selectedLayerId === asset.id ? styles.selected : ''
                  }`}
                  onClick={() => {
                    aninodeStore.ui.selectedLayerId = asset.id
                  }}
                >
                  <span>{asset.name}</span>
                  <span className={styles.zIndex}>z:{asset.zIndex}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
