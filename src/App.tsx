import { useState } from 'react'
import { useSnapshot } from 'valtio'
import { aninodeStore } from '@core/store'
import { Layout } from '@components/Layout'
import { NodeEditor } from '@components/NodeEditor'
import { Viewport } from '@components/Viewport'
import { PropertiesPanel } from '@components/PropertiesPanel'
import { Timeline } from '@components/Timeline'
import { TopBar } from '@components/TopBar'
import { NodeTester } from '@pages/NodeTester'
import './App.css'

function App() {
  const snap = useSnapshot(aninodeStore)
  const [view, setView] = useState<'main' | 'tester'>('main')

  // View switcher (temporary for testing)
  const viewSwitch = (
    <div style={{
      position: 'fixed',
      top: '60px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px'
    }}>
      <button
        onClick={() => setView('main')}
        style={{
          padding: '6px 12px',
          background: view === 'main' ? '#667eea' : 'rgba(255,255,255,0.1)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Main
      </button>
      <button
        onClick={() => setView('tester')}
        style={{
          padding: '6px 12px',
          background: view === 'tester' ? '#667eea' : 'rgba(255,255,255,0.1)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Node Tester 🔬
      </button>
    </div>
  )

  if (view === 'tester') {
    return (
      <>
        {viewSwitch}
        <NodeTester />
      </>
    )
  }

  return (
    <>
      {viewSwitch}
      <div className="app">
        <TopBar />
        <Layout>
          <Layout.Left show={snap.ui.sidebarOpen}>
            <NodeEditor />
          </Layout.Left>

          <Layout.Center>
            <Viewport />
          </Layout.Center>

          <Layout.Right show={snap.ui.propertiesPanelOpen}>
            <PropertiesPanel />
          </Layout.Right>

          <Layout.Bottom show={snap.ui.timelinePanelOpen}>
            <Timeline />
          </Layout.Bottom>
        </Layout>
      </div>
    </>
  )
}

export default App
