import { ReactNode } from 'react'
import styles from './Layout.module.css'

type LayoutProps = {
  children: ReactNode
}

type PanelProps = {
  children: ReactNode
  show?: boolean
}

function LayoutRoot({ children }: LayoutProps) {
  return <div className={styles.layout}>{children}</div>
}

function LayoutLeft({ children, show = true }: PanelProps) {
  return (
    <aside className={`${styles.left} ${show ? styles.show : styles.hide}`}>
      {children}
    </aside>
  )
}

function LayoutCenter({ children }: PanelProps) {
  return <main className={styles.center}>{children}</main>
}

function LayoutRight({ children, show = true }: PanelProps) {
  return (
    <aside className={`${styles.right} ${show ? styles.show : styles.hide}`}>
      {children}
    </aside>
  )
}

function LayoutBottom({ children, show = true }: PanelProps) {
  return (
    <footer className={`${styles.bottom} ${show ? styles.show : styles.hide}`}>
      {children}
    </footer>
  )
}

export const Layout = Object.assign(LayoutRoot, {
  Left: LayoutLeft,
  Center: LayoutCenter,
  Right: LayoutRight,
  Bottom: LayoutBottom,
})
