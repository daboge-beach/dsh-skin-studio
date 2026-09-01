/**
 * SkinCard — 画廊卡片（docs/FRONTEND_REQUIREMENTS.md · SkinCard 组件）。
 *
 * 预览：优先 preview.png（真实渲染图），无图回退 palette 渐变。
 * 吉祥物：sprite_anim.png 是 2×2 网格 4 帧动画，右下角 72×72 播放，
 * steps(1) 硬切帧、1.2s 循环；prefers-reduced-motion 时定格第一帧。
 */
import { ColorDot } from './icons.tsx'
import type { SkinEntry } from './registry/types.ts'
import styles from './SkinCard.module.css'

export interface SkinCardProps {
  skin: SkinEntry
  /** 是否是当前应用的主题。 */
  active: boolean
  /** 是否正在试穿。 */
  tryOn: boolean
  onClick: () => void
  onTryOn: () => void
  /** 上传款可删除（内置不可删）。 */
  onRemove?: (skin: SkinEntry) => void
}

export function SkinCard({ skin, active, tryOn, onClick, onTryOn, onRemove }: SkinCardProps): JSX.Element {
  return (
    <div
      className={[
        styles.card,
        active ? styles['card--active'] : '',
        tryOn ? styles['card--try-on'] : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`${skin.name}，点击查看详情`}
    >
      <div className={styles.preview}>
        {/* 预览图：优先用皮肤包的 preview.png（真实渲染图），无则回退配色渐变 */}
        {skin.previewUrl ? (
          <img
            className={styles['preview-img']}
            loading="lazy"
            decoding="async"
            src={skin.previewUrl}
            alt={skin.name}
          />
        ) : (
          <div
            className={styles['preview-fallback']}
            style={{ background: skin.paletteCssGradient }}
          >
            <span className={styles['preview-name']}>{skin.name}</span>
          </div>
        )}
        {/* 吉祥物：若皮肤提供 sprite_anim.png，右下角播放 4 帧循环动画 */}
        {skin.mascotUrl && (
          <div
            className={styles.mascot}
            style={{ backgroundImage: `url(${skin.mascotUrl})` }}
            role="img"
            aria-label={`${skin.name} mascot animation`}
          />
        )}
        {active && <span className={`${styles.badge} ${styles['badge--active']}`}>启用中</span>}
        {tryOn && <span className={`${styles.badge} ${styles['badge--try-on']}`}>试穿中</span>}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{skin.name}</div>
        <div className={styles.meta}>{formatAuthor(skin.author)} · v{skin.version}</div>
        <div className={styles.desc}>{skin.description}</div>
        <div className={styles.variant}>
          <ColorDot color={skin.palette.primary} />
          <span>{skin.colorScheme}</span>
          {skin.removable && onRemove && (
            <button
              type="button"
              className={styles.removeBtn}
              title="删除该上传皮肤"
              aria-label={`删除 ${skin.name}`}
              onClick={e => {
                e.stopPropagation()
                onRemove(skin)
              }}
            >
              删除
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        className={styles['try-on-btn']}
        onClick={(e) => { e.stopPropagation(); onTryOn() }}
      >
        {tryOn ? '退出试穿' : '试穿'}
      </button>
    </div>
  )
}

/** author: string | { name, url? } → 显示名。 */
export function formatAuthor(author: SkinEntry['author']): string {
  return typeof author === 'string' ? author : author.name
}
