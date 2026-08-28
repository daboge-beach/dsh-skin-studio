/**
 * Modal — 自实现模态容器（无障碍完整版）。
 *
 * docs/FRONTEND_REQUIREMENTS.md 待澄清问题 #1（DSH 的 Modal 在哪个包）：
 * 为保持 gallery 零第三方 UI 依赖（官方约束：原生 CSS Modules），按文档
 * 调用契约 <Modal onClose size="large"> 自带实现；接入真实 DSH 后如官方
 * ui-primitives 暴露 Modal，可无缝替换。
 *
 * 无障碍行为（v0.9）：
 * - 打开时聚焦第一个可聚焦元素（无则对话框本体）
 * - Tab 循环（焦点陷阱），Shift+Tab 反向
 * - Escape 关闭
 * - 打开期间锁定背景滚动
 * - 关闭后把焦点还给打开前的触发元素
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

export interface ModalProps {
  onClose: () => void
  size?: 'default' | 'large'
  labelledBy?: string
  children: ReactNode
}

/** 对话框内当前可见、可聚焦的元素列表。 */
function focusableIn(root: HTMLElement | null): HTMLElement[] {
  if (root === null) return []
  return Array.from(root.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )).filter(el => !(el instanceof HTMLButtonElement && el.disabled) && el.offsetParent !== null)
}

export function Modal({ onClose, size = 'default', labelledBy, children }: ModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    // 焦点归还目标：打开瞬间记录触发元素（可能是按钮 / body）
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // 背景滚动锁定（还原时写回原值，不假设初始是空串）
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const list = focusableIn(dialog)
    const first = list[0] ?? dialog
    first?.focus()

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const focusables = focusableIn(dialog)
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (firstEl === undefined || lastEl === undefined) { e.preventDefault(); dialog?.focus(); return }
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === firstEl || active === dialog || active === document.body) { e.preventDefault(); lastEl.focus() }
      } else if (active === lastEl || active === dialog || active === document.body) {
        e.preventDefault(); firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      opener?.focus()
    }
  }, [onClose])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`${styles.dialog} ${size === 'large' ? styles['dialog--large'] : ''}`}
        onClick={e => { e.stopPropagation() }}
      >
        {children}
      </div>
    </div>
  )
}
