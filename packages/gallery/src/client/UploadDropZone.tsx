/**
 * UploadDropZone — 画廊网格末尾的「+ 上传」格（点击选文件 / 拖拽 zip）。
 */
import { useRef, useState } from 'react'
import { UploadIcon } from './icons.tsx'
import styles from './UploadDropZone.module.css'

export interface UploadDropZoneProps {
  onUpload: (file: File) => void
  /** 上传进行中（禁用并显示进度文案）。 */
  busy?: boolean
  progressText?: string
}

export function UploadDropZone({ onUpload, busy = false, progressText }: UploadDropZoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const pick = (): void => { inputRef.current?.click() }

  return (
    <div
      className={`${styles.zone} ${dragOver ? styles['zone--over'] : ''} ${busy ? styles['zone--busy'] : ''}`}
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-label="上传皮肤包（.zip）"
      onClick={() => { if (!busy) pick() }}
      onKeyDown={e => {
        if (!busy && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          pick()
        }
      }}
      onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        if (busy) return
        const file = e.dataTransfer.files.item(0)
        if (file !== null) onUpload(file)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className={styles.input}
        onChange={e => {
          const file = e.target.files?.item(0) ?? null
          if (file !== null) onUpload(file)
          e.target.value = '' // 允许重复选择同一文件
        }}
      />
      {busy ? (
        <span className={styles.label}>{progressText ?? '正在解析皮肤包...'}</span>
      ) : (
        <>
          <UploadIcon size={22} />
          <span className={styles.label}>上传皮肤</span>
          <span className={styles.hint}>点击或拖入 .zip 皮肤包</span>
        </>
      )}
    </div>
  )
}
