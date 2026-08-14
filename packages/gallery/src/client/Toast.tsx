/**
 * 轻量 toast（模块级 API + <ToastHost /> 渲染栈）。
 *
 * docs/FRONTEND_REQUIREMENTS.md 试穿交互：toast 带「应用并保存 / 退出还原」
 * 两个动作且 duration: 0 不自动消失，等用户决策；上传流程用 type: 'error'
 * 显示具体校验错误（支持多行，white-space: pre-line）。
 */
import { useEffect, useSyncExternalStore } from 'react'
import styles from './Toast.module.css'

export interface ToastOptions {
  message: string
  type?: 'info' | 'success' | 'error'
  /** 动作按钮文案（如「应用并保存」）；缺省不显示按钮。 */
  actionLabel?: string
  onAction?: () => void
  /** 取消按钮文案（如「退出还原」）；缺省不显示按钮。 */
  cancelLabel?: string
  onCancel?: () => void
  /** 毫秒；0 = 不自动消失，等用户决策。 */
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
}

let nextId = 1
let items: ToastItem[] = []
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function dismiss(id: number): void {
  const target = items.find(t => t.id === id)
  if (target === undefined) return
  items = items.filter(t => t.id !== id)
  emit()
}

/** 显示一条 toast，返回手动关闭函数。 */
export function showToast(options: ToastOptions): () => void {
  const id = nextId++
  items = [...items, { ...options, id }]
  emit()
  return () => dismiss(id)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** 底部 toast 栈。挂在 GalleryPanel 内（皮肤中心自己管理的 UI 面）。 */
export function ToastHost(): JSX.Element {
  const toasts = useSyncExternalStore(subscribe, () => items)

  useEffect(() => {
    const timers = toasts
      .filter(t => (t.duration ?? 0) > 0)
      .map(t => window.setTimeout(() => dismiss(t.id), t.duration))
    return () => { for (const timer of timers) window.clearTimeout(timer) }
  }, [toasts])

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`${styles.toast} ${styles[`toast--${toast.type ?? 'info'}`] ?? ''}`}>
          <span className={styles.message}>{toast.message}</span>
      <span className={styles.actions}>
        {toast.actionLabel !== undefined && (
          <button
            type="button"
            className={`${styles.btn} ${styles['btn--primary']}`}
            onClick={() => {
              toast.onAction?.()
              dismiss(toast.id)
            }}
          >
            {toast.actionLabel}
          </button>
        )}
        {toast.cancelLabel !== undefined && (
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              toast.onCancel?.()
              dismiss(toast.id)
            }}
          >
            {toast.cancelLabel}
          </button>
        )}
      </span>
      {/* 有动作按钮时也保留关闭按钮：用户可以随时手动关掉（不必决策） */}
      <button
        type="button"
        className={styles.close}
        aria-label="关闭提示"
        onClick={() => dismiss(toast.id)}
      >
        ×
      </button>
        </div>
      ))}
    </div>
  )
}
