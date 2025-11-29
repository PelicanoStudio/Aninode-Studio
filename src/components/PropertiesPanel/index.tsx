import { useSnapshot } from 'valtio'
import { aninodeStore } from '@core/store'
import styles from './PropertiesPanel.module.css'

export function PropertiesPanel() {
  const snap = useSnapshot(aninodeStore)

  const selectedNode =
    snap.ui.selectedNodeIds.length === 1
      ? snap.nodes[snap.ui.selectedNodeIds[0]]
      : null

  const selectedLayer = snap.ui.selectedLayerId
    ? snap.scene?.assets.find((a) => a.id === snap.ui.selectedLayerId)
    : null

  if (!selectedNode && !selectedLayer) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Properties</h2>
        </div>
        <div className={styles.empty}>
          <p>Select a node or layer to view properties</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Properties</h2>
      </div>

      {selectedNode && (
        <div className={styles.section}>
          <h3>Node: {selectedNode.name}</h3>
          <div className={styles.property}>
            <label>Type</label>
            <input type="text" value={selectedNode.type} disabled />
          </div>
          <div className={styles.property}>
            <label>ID</label>
            <input type="text" value={selectedNode.id} disabled />
          </div>

          <h4>Base Props</h4>
          <div className={styles.jsonView}>
            <pre>{JSON.stringify(selectedNode.baseProps, null, 2)}</pre>
          </div>

          <h4>Outputs</h4>
          <div className={styles.jsonView}>
            <pre>{JSON.stringify(selectedNode.outputs, null, 2)}</pre>
          </div>

          <h4>Overrides</h4>
          <div className={styles.jsonView}>
            <pre>{JSON.stringify(selectedNode.overrides, null, 2)}</pre>
          </div>
        </div>
      )}

      {selectedLayer && (
        <div className={styles.section}>
          <h3>Layer: {selectedLayer.name}</h3>
          <div className={styles.property}>
            <label>X Position</label>
            <input type="number" value={selectedLayer.x} />
          </div>
          <div className={styles.property}>
            <label>Y Position</label>
            <input type="number" value={selectedLayer.y} />
          </div>
          <div className={styles.property}>
            <label>Width</label>
            <input type="number" value={selectedLayer.width} disabled />
          </div>
          <div className={styles.property}>
            <label>Height</label>
            <input type="number" value={selectedLayer.height} disabled />
          </div>
          <div className={styles.property}>
            <label>Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedLayer.opacity}
            />
          </div>
          <div className={styles.property}>
            <label>Z-Index</label>
            <input type="number" value={selectedLayer.zIndex} />
          </div>
        </div>
      )}
    </div>
  )
}
