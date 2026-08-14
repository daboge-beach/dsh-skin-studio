/**
 * MascotFloat — 皮肤应用后的主界面吉祥物（可拖动、会散步、会说话）。
 *
 * - 4 帧动画与漫步过渡都用**内联 style** 驱动（keyframes 用全局未哈希名
 *   xl-mascot-frames，见 overlays.ts）：个别宿主环境会清空 class 规则里
 *   的 animation/transition（级联怪癖），内联样式已被证实免疫。
 * - 拖动：pointer 事件 + 点击/拖动阈值区分；拖动时暂停漫步，松手后从新
 *   位置继续散步；点击（未拖动）立即冒一条语录。
 * - 语录自动冒泡（quotes.ts，连续不重复）。
 * - reduced-motion：定格第一帧、不移动；settings.mascotEnabled 可关。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { usePrefersReducedMotion, useThemeSnapshot } from './hooks.ts'
import { skinStudioSettings } from './settings.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import { randomQuote } from './quotes.ts'
import styles from './MascotFloat.module.css'

/** 漫步目标点（相对当前锚位的 translate 偏移）。 */
interface WanderPoint {
  x: number
  y: number
}

const IDLE_MS = 2600          // 每段驻足时长
const MOVE_MS = 2200          // 平滑移动时长
const BUBBLE_MS = 5200        // 气泡停留时长
const DRAG_THRESHOLD = 6      // 超过此位移视为拖动而非点击

function nextWanderPoint(): WanderPoint {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  // 相对锚位向左、向上随机走（锚位在右下角或拖动后的落点）
  const maxX = Math.max(0, window.innerWidth * 0.45)
  const maxY = Math.min(window.innerHeight * 0.28, 150)
  return {
    x: Math.round(Math.random() * maxX),
    y: -Math.round(Math.random() * maxY),
  }
}

export function MascotFloat({ ctx }: { ctx: ClientContext }): JSX.Element | null {
  const snapshot = useThemeSnapshot(ctx)
  const reduced = usePrefersReducedMotion()
  const [enabled, setEnabled] = useState<boolean>(() => skinStudioSettings.get().mascotEnabled)
  /** 淡出淡入：皮肤切换瞬间先降 opacity 再升起。 */
  const [visible, setVisible] = useState(false)
  const [point, setPoint] = useState<WanderPoint>({ x: 0, y: 0 })
  /** 拖动后的固定锚位（viewport 坐标）；null = 回到默认右下角。 */
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const lastQuoteRef = useRef<string | null>(null)
  const dragStartRef = useRef<{ px: number; py: number; ax: number; ay: number; moved: boolean } | null>(null)
  const activeSkin = snapshot !== null ? skinRegistry.get(snapshot.active.id) : undefined
  const skinId = activeSkin?.id ?? ''

  useEffect(() => skinStudioSettings.subscribe(s => setEnabled(s.mascotEnabled)), [])

  useEffect(() => {
    setVisible(false)
    setPoint({ x: 0, y: 0 })
    setAnchor(null)
    setBubble(null)
    const raf = requestAnimationFrame(() => { setVisible(true) })
    return () => cancelAnimationFrame(raf)
  }, [activeSkin?.id])

  // 散步走动（reduced-motion / 未启用 / 拖动中停住）
  useEffect(() => {
    if (reduced || !enabled || dragging || activeSkin?.mascotUrl === undefined) return undefined
    let alive = true
    const step = (): void => {
      if (!alive) return
      setPoint(nextWanderPoint())
      window.setTimeout(step, IDLE_MS + MOVE_MS)
    }
    step()
    return () => { alive = false }
  }, [reduced, enabled, dragging, activeSkin?.mascotUrl])

  // 随机弹一条语录（更新 lastQuoteRef 以连续不重复）
  const bubbleTimerRef = useRef<number>(undefined)
  const pushBubble = useCallback((): void => {
    const q = randomQuote(skinId, lastQuoteRef.current)
    lastQuoteRef.current = q
    setBubble(q)
    if (bubbleTimerRef.current !== undefined) window.clearTimeout(bubbleTimerRef.current)
    bubbleTimerRef.current = window.setTimeout(() => { setBubble(null) }, BUBBLE_MS)
  }, [skinId])

  // 自动语录冒泡（拖动中不抢戏）
  useEffect(() => {
    if (reduced || !enabled || skinId === '' || dragging) return undefined
    let alive = true
    const showNext = (): void => {
      if (!alive) return
      pushBubble()
      window.setTimeout(showNext, BUBBLE_MS + 3600)
    }
    const first = window.setTimeout(showNext, 2200)
    return () => {
      alive = false
      window.clearTimeout(first)
      if (bubbleTimerRef.current !== undefined) window.clearTimeout(bubbleTimerRef.current)
    }
  }, [reduced, enabled, skinId, dragging, pushBubble])

  // ── 拖动（pointer events；位移小于阈值视为点击 → 冒语录）。拖动是
  // 交互不是动画，reduced-motion 下同样允许（只是不播帧动画/不漫步）。
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    dragStartRef.current = {
      px: e.clientX, py: e.clientY,
      ax: rect.left, ay: rect.top,
      moved: false,
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    const start = dragStartRef.current
    if (start === null) return
    const dx = e.clientX - start.px
    const dy = e.clientY - start.py
    if (!start.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
    start.moved = true
    setPoint({ x: 0, y: 0 }) // 拖动时清掉漫步偏移，直接跟随指针
    setAnchor({ x: start.ax + dx, y: start.ay + dy })
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    const start = dragStartRef.current
    dragStartRef.current = null
    setDragging(false)
    if (start === null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!start.moved) pushBubble()
  }

  // 只有提供了 sprite_anim.png 的皮肤（凡人修仙传 5 款）才有浮层
  if (!enabled || activeSkin?.mascotUrl === undefined) return null

  const anchored = anchor !== null

  return (
    <div
      className={styles.wander}
      style={{
        ...(anchored
          ? { left: anchor.x, top: anchor.y, right: 'auto', bottom: 'auto' }
          : {}),
        transform: `translate(${-point.x}px, ${point.y}px)`,
        // 内联过渡：拖动时跟手（无过渡），漫步时平滑
        transition: dragging ? 'none' : `transform ${MOVE_MS}ms cubic-bezier(0.33, 0, 0.2, 1)`,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      {bubble !== null && (
        <div className={styles.bubble} role="status" aria-live="polite">
          <span>{bubble}</span>
          <i aria-hidden="true" />
        </div>
      )}
      <div
        key={activeSkin.id}
        className={styles.float}
        style={{
          backgroundImage: `url(${activeSkin.mascotUrl})`,
          opacity: visible ? 0.9 : 0,
          // 内联动画（全局 keyframes 名）：class 规则的 animation 在部分宿主
          // 环境会被清覆，内联已被证实免疫
          animation: reduced ? undefined : 'xl-mascot-frames 1.2s step-end infinite',
          transition: 'opacity 0.3s ease',
        }}
        role="img"
        aria-label={`${activeSkin.name} 吉祥物（可拖动）`}
        title={`${activeSkin.name} · 拖动我散步，点我说话`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  )
}
