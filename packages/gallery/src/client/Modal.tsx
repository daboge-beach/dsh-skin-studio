/**
 * Modal — 自实现模态容器。
 *
 * docs/FRONTEND_REQUIREMENTS.md 待澄清问题 #1（DSH 的 Modal 在哪个包）：
 * 为保持 gallery 零第三方 UI 依赖（官方约束：原生 CSS Modules），按文档
 * 调用契约 <Modal onClose size="large"> 自带实现；接入真实 DSH 后如官方
 * ui-primitives 暴露 Modal，可无缝替换。
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

export function Modal({ onClose, size = 'default', labelledBy, children }: ModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.focus()
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
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
