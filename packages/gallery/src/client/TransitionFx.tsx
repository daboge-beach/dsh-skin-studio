/**
 * TransitionFx — 切换皮肤的过渡特效（docs/FANREN_SKINS_DESIGN.md §三）。
 *
 * 基础：全屏主色一闪（flash 600ms：0 → 0.3 → 0）+ body 配色 400ms 过渡
 * （global.css）。每款皮肤有专属切换特效：
 *   慕沛灵 粉色花瓣从屏幕中心向外绽放 / 韩立 金色雷光从四角向中心聚拢 /
 *   银月 银白月光从顶部向下倾泻 / 南宫婉 朱雀赤纹从中心向四周扩散 /
 *   紫灵 紫色星辰从下向上升起（aurora/midnight 仅基础一闪）。
 *
 * 全部纯 CSS @keyframes（transform/opacity，60fps），且只在
 * prefers-reduced-motion: no-preference 下渲染。
 */
import { useEffect, useRef, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { usePrefersReducedMotion, useThemeSnapshot } from './hooks.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import styles from './TransitionFx.module.css'

/** 专属特效的皮肤 → class 后缀。 */
const SIGNATURE_FX: Record<string, string> = {
  'mupeiling-blossom': 'blossom',
  'hanli-daoist': 'thunder',
  'yinyue-lunar': 'moonlight',
  'nangongwan-moon': 'vermilion',
  'ziling-mystic': 'stars',
}

const FX_DURATION_MS = 900

interface FxState {
  key: number
  skinId: string
  color: string
}

export function TransitionFx({ ctx }: { ctx: ClientContext }): JSX.Element | null {
  const snapshot = useThemeSnapshot(ctx)
  const reduced = usePrefersReducedMotion()
  const [fx, setFx] = useState<FxState | null>(null)
  const lastIdRef = useRef<string | null>(null)

  useEffect(() => {
    const id = snapshot?.active.id ?? null
    if (lastIdRef.current === null) {
      lastIdRef.current = id // 首次挂载不算切换
      return
    }
    if (id === lastIdRef.current) return
    lastIdRef.current = id
    if (id === null || reduced) return

    const skin = skinRegistry.get(id)
    setFx({ key: performance.now(), skinId: id, color: skin?.palette.primary ?? 'var(--dsw-alias-brand-primary)' })
    const timer = window.setTimeout(() => setFx(null), FX_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [snapshot, reduced])

  if (fx === null) return null

  const signature = SIGNATURE_FX[fx.skinId]

  return (
    <div key={fx.key} className={styles.layer} aria-hidden="true">
      {/* 基础：全屏主色一闪 */}
      <div className={styles.flash} style={{ background: fx.color }} />

      {signature === 'blossom' && (
        <div className={styles.fx}>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={styles.petal} style={{ '--a': `${i * 30}deg` } as React.CSSProperties} />
          ))}
        </div>
      )}

      {signature === 'thunder' && (
        <div className={styles.fx}>
          <span className={`${styles.bolt} ${styles['bolt--tl']}`} />
          <span className={`${styles.bolt} ${styles['bolt--tr']}`} />
          <span className={`${styles.bolt} ${styles['bolt--bl']}`} />
          <span className={`${styles.bolt} ${styles['bolt--br']}`} />
          <span className={styles.burst} />
        </div>
      )}

      {signature === 'moonlight' && (
        <div className={styles.fx}>
          <span className={styles.moonfall} />
        </div>
      )}

      {signature === 'vermilion' && (
        <div className={styles.fx}>
          <span className={`${styles.ring} ${styles['ring--1']}`} />
          <span className={`${styles.ring} ${styles['ring--2']}`} />
          <span className={`${styles.ring} ${styles['ring--3']}`} />
        </div>
      )}

      {signature === 'stars' && (
        <div className={styles.fx}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={styles.star} style={{ '--x': `${6 + i * 9.5}%`, '--d': `${i * 70}ms` } as React.CSSProperties} />
          ))}
        </div>
      )}
    </div>
  )
}
