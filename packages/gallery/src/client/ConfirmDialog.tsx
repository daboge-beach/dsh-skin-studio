/**
 * ConfirmDialog — 危险操作确认（删除上传皮肤 / 还原出厂等）。
 *
 * 视觉与交互与其它模态一致（继承 Modal 的焦点陷阱 / Escape / 焦点归还），
 * 危险操作主按钮为红色系；文案完全走 i18n（中/英）。
 */
import { Modal } from './Modal.tsx'
import { t } from './i18n.ts'
import styles from './SkinDetailModal.module.css'

export interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** 危险操作（删除/重置）：主按钮红色。 */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title, message, confirmLabel, cancelLabel, danger = false, onConfirm, onCancel,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Modal onClose={onCancel} labelledBy="confirm-title">
      <div className={styles.detail}>
        <div className={styles.meta}>
          <h2 id="confirm-title">{title}</h2>
          <p className={styles.author} style={{ whiteSpace: 'pre-line' }}>{message}</p>
        </div>
        <footer className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles['btn--ghost']}`} onClick={onCancel}>
            {cancelLabel ?? t('cancel')}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles['btn--primary']}`}
            style={danger ? { background: '#dc2626' } : undefined}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('confirm')}
          </button>
        </footer>
      </div>
    </Modal>
  )
}
