import { useSnapshot } from 'valtio'
import { aninodeStore, storeActions } from '@core/store'
import styles from './TopBar.module.css'

export function TopBar() {
  const snap = useSnapshot(aninodeStore)

  const handleImportScene = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker()
      const fileHandle = await handle.getFileHandle('data.json')
      const file = await fileHandle.getFile()
      const text = await file.text()
      const sceneData = JSON.parse(text)

      // Load images
      const images: Record<string, string> = {}
      for (const asset of sceneData.assets) {
        try {
          const imgHandle = await handle.getFileHandle(asset.file)
          const imgFile = await imgHandle.getFile()
          images[asset.file] = URL.createObjectURL(imgFile)
        } catch (e) {
          console.warn(`Missing asset: ${asset.file}`)
        }
      }

      storeActions.loadScene(sceneData, images)
    } catch (err) {
      console.error('Failed to import scene:', err)
    }
  }

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.logo}>Aninode</div>
        <button className={styles.menuButton}>File</button>
        <button className={styles.menuButton}>Edit</button>
        <button className={styles.menuButton}>View</button>
      </div>

      <div className={styles.center}>
        <button
          className={styles.toolButton}
          onClick={() => storeActions.setToolMode('SELECT')}
          data-active={snap.ui.toolMode === 'SELECT'}
        >
          <span>🖱️</span>
        </button>
        <button
          className={styles.toolButton}
          onClick={() => storeActions.setToolMode('DRAW')}
          data-active={snap.ui.toolMode === 'DRAW'}
        >
          <span>✏️</span>
        </button>
        <button
          className={styles.toolButton}
          onClick={() => storeActions.setToolMode('PAN')}
          data-active={snap.ui.toolMode === 'PAN'}
        >
          <span>👋</span>
        </button>

        <div className={styles.divider} />

        <button
          className={styles.playButton}
          onClick={() => storeActions.setPlaying(!snap.ui.isPlaying)}
        >
          {snap.ui.isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>

      <div className={styles.right}>
        <button className={styles.iconButton} onClick={handleImportScene}>
          📁 Import
        </button>
        <button className={styles.iconButton}>💾 Export</button>
        <button
          className={styles.iconButton}
          onClick={() => storeActions.toggleSidebar()}
        >
          {snap.ui.sidebarOpen ? '◀️' : '▶️'}
        </button>
      </div>
    </header>
  )
}
