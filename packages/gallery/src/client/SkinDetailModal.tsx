/**
 * SkinDetailModal — 皮肤详情面板（docs/FRONTEND_REQUIREMENTS.md · 界面二）。
 *
 * 顶部大预览（hero.png 立绘 / palette 纯色回退）→ 元信息 → 配色 swatch →
 * Token 覆盖（默认 3 项可展开全部）→ 底部 取消 / 试穿（即时生效） / 应用并保存。
 */
import { useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { ChevronIcon, CloseIcon, ColorDot, ExternalLinkIcon } from './icons.tsx'
import { Modal } from './Modal.tsx'
import { showToast } from './Toast.tsx'
import type { SkinEntry } from './registry/types.ts'
import { ensureThemeRegistered } from './themeBridge.ts'
import { skinStudioSettings } from './settings.ts'
import styles from './SkinDetailModal.module.css'

export interface SkinDetailModalProps {
  skin: SkinEntry
  ctx: ClientContext
  onClose: () => void
  /** 与画廊共享的试穿入口（保持卡片「试穿中」状态一致）。 */
  onTryOn: (skin: SkinEntry) => void
}

/** palette 摘要 → swatch 展示项（label 为中文语义名）。 */
function paletteEntries(skin: SkinEntry): Array<[label: string, color: string]> {
  return [
    ['primary', skin.palette.primary],
    ['background', skin.palette.background],
    ['surface', skin.palette.surface],
    ['text', skin.palette.text],
    ['border', skin.palette.border],
  ]
}

export function SkinDetailModal({ skin, ctx, onClose, onTryOn }: SkinDetailModalProps): JSX.Element {
  const [tokenExpanded, setTokenExpanded] = useState(false)
  const snapshot = ctx.theme.getTheme()
  const isActive = snapshot?.active.id === skin.id

  const apply = (): void => {
    try {
      ensureThemeRegistered(ctx, skin)
      // 显式落记忆（试穿态下监听会跳过跟随，必须在这里写）；先退出试穿态
      skinStudioSettings.setTryOn(null)
      skinStudioSettings.setActiveSkin(skin.id)
      ctx.theme.setTheme(skin.id)
      showToast({ message: `${skin.name} 已应用并保存`, type: 'success' })
      onClose()
    } catch (e) {
      showToast({ message: `应用失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    }
  }

  const swatches = paletteEntries(skin)
  const visibleTokens = skin.tokens.slice(0, tokenExpanded ? undefined : 3)

  return (
    <Modal onClose={onClose} size="large" labelledBy="skin-detail-name">
      <div className={styles.detail}>

        {/* 顶部大预览区：有 hero.png 立绘时用图片，否则回退纯色 */}
        <div
          className={`${styles.hero} ${skin.heroUrl ? styles['hero--image'] : ''}`}
          style={skin.heroUrl ? undefined : {
            background: skin.palette.background,
            color: skin.palette.text,
          }}
        >
          {skin.heroUrl && (
            <img
              className={styles['hero-img']}
              src={skin.heroUrl}
              alt={skin.name}
            />
          )}
          <button className={styles.close} onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
          <div className={styles['hero-body']}>
            <h1 className={styles['hero-name']} style={{ color: skin.palette.primary }}>
              {skin.name}
            </h1>
            <p className={styles['hero-desc']}>{skin.description}</p>
            <div className={styles['hero-badge']}>
              <ColorDot color={skin.palette.primary} size={6} />
              {skin.colorScheme} · v{skin.version}
            </div>
          </div>
        </div>

        {/* 元信息 */}
        <div className={styles.meta}>
          <h2 id="skin-detail-name">{skin.name}</h2>
          <p className={styles.author}>
            作者 {authorNode(skin)} · {skin.license ?? 'MIT'}
            {skin.homepage && <> · <a className={styles.link} href={skin.homepage} target="_blank" rel="noreferrer">来源 <ExternalLinkIcon /></a></>}
          </p>
        </div>

        {/* 配色 swatch 预览 */}
        <section className={styles.palette}>
          <h3>配色预览</h3>
          <div className={styles.swatches}>
            {swatches.map(([name, color]) => (
              <div key={name} className={styles.swatch} title={`${name}: ${color}`}>
                <div className={styles['swatch-color']} style={{ background: color }} />
                <span className={styles['swatch-label']}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Token 覆盖列表 */}
        <section className={styles.tokens}>
          <div className={styles['tokens-header']}>
            <h3>Token 覆盖</h3>
            <button
              type="button"
              className={styles['tokens-toggle']}
              onClick={() => setTokenExpanded(!tokenExpanded)}
              aria-expanded={tokenExpanded}
            >
              {tokenExpanded ? '收起' : `展开 · 共 ${skin.tokenCount} 项`}
              <ChevronIcon expanded={tokenExpanded} />
            </button>
          </div>
          <div className={styles['tokens-list']}>
            {visibleTokens.map(([name, value]) => (
              <div key={name} className={styles['token-row']}>
                <code className={styles['token-name']}>{name}</code>
                <code className={styles['token-value']}>{value}</code>
                <span className={styles['token-color']} style={{ background: value }} />
              </div>
            ))}
            {!tokenExpanded && skin.tokenCount > 3 && (
              <div className={styles['tokens-more']}>还有 {skin.tokenCount - 3} 项...</div>
            )}
          </div>
        </section>

        {/* 底部操作栏 */}
        <footer className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles['btn--ghost']}`} onClick={onClose}>取消</button>
          <button
            type="button"
            className={`${styles.btn} ${styles['btn--primary']}`}
            onClick={() => onTryOn(skin)}
            disabled={isActive}
          >
            {isActive ? '当前启用' : '试穿（即时生效）'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles['btn--outline-primary']}`}
            onClick={apply}
            disabled={isActive}
          >
            应用并保存
          </button>
        </footer>
      </div>
    </Modal>
  )
}

/** author 显示：带 url 时渲染成链接。 */
function authorNode(skin: SkinEntry): JSX.Element {
  const author = skin.author
  if (typeof author === 'string') return <>{author}</>
  if (author.url) {
    return <a className={styles.link} href={author.url} target="_blank" rel="noreferrer">{author.name}</a>
  }
  return <>{author.name}</>
}
