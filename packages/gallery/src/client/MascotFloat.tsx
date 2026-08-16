/**
 * MascotFloat — 皮肤应用后的主界面吉祥物（可拖动、会散步、会说话）。
 *
 * - 4 帧动画与漫步过渡都用**内联 style** 驱动（keyframes 用全局未哈希名
 *   xl-mascot-frames，见 overlays.ts）：个别宿主环境会清空 class 规则里
 *   的 animation/transition（级联怪癖），内联样式已被证实免疫。
 * - 拖动：pointer 事件 + 点击/拖动阈值区分；拖动时暂停漫步，松手后从新
 *   位置继续散步；点击（未拖动）立即冒一条语录。
 * - 语录自动冒泡（quotes.ts 中/英双池各 200 句，连续不重复；登场首句
 *   是对程序员的问候，语言由皮肤中心设置选择）。
 * - reduced-motion：定格第一帧、不移动；settings.mascotEnabled 可关。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { usePrefersReducedMotion, useThemeSnapshot } from './hooks.ts'
import { skinStudioSettings } from './settings.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import { randomGreeting, randomQuote, type QuoteLang } from './quotes.ts'
import { onTaskDone, randomDoneQuote } from './taskNotify.ts'
import { effectiveTier, subscribeTier, TIERED_SPRITE_SKINS, type PowerTier } from './tierPower.ts'
import styles from './MascotFloat.module.css'

/** 锚位 / 漫步目标点（viewport 坐标）。 */
interface WanderPoint {
  x: number
  y: number
}

const IDLE_MS = 1600          // 每段驻足时长（满屏转悠版：更活泼）
const MOVE_MS = 1800          // 平滑移动时长
const BUBBLE_MS = 5200        // 气泡停留时长
const DRAG_THRESHOLD = 6      // 超过此位移视为拖动而非点击

/** 漫步目标点（viewport 坐标）。
 *  走动路径满屏（穿过正文是瞬时滑过，观感自然）；驻足点避开正文列 ——
 *  DSH 正文是内容区（侧栏右侧起）内居中的 ~700px 文本列，停在其左右
 *  空白带；两侧都放不下时（窄屏）退化为满屏随机。 */
function nextWanderPoint(): WanderPoint {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  const W = window.innerWidth
  const H = window.innerHeight
  const size = 160
  const minX = 300                                    // 避开左侧会话侧栏（不挡侧栏按钮）
  const minY = 72                                     // 避开顶部标题/工具栏
  const maxY = Math.max(minY + 40, H - size - 300)    // 底部避开输入区
  const maxX = Math.max(minX, W - size - 16)
  const rand = (lo: number, hi: number): number => Math.round(lo + Math.random() * Math.max(0, hi - lo))

  // 正文列估计：内容区内居中的文本列（与 DSH 会话布局一致）
  const contentW = W - minX
  const bodyW = Math.min(700, contentW * 0.62)
  const bodyX0 = minX + (contentW - bodyW) / 2
  const bodyX1 = bodyX0 + bodyW

  // 左右空白驻足带（至少 60px 宽才可用；上限 320px 保持分布集中）
  const bands: Array<[number, number]> = []
  const leftW = bodyX0 - 20 - size - minX
  const rightW = maxX - (bodyX1 + 20)
  if (leftW >= 60) bands.push([minX, minX + Math.min(leftW, 320)])
  if (rightW >= 60) bands.push([bodyX1 + 20, bodyX1 + 20 + Math.min(rightW, 320)])

  if (bands.length === 0) {
    // 窄屏兜底：没有可用的空白带，退化为满屏随机
    return { x: rand(minX, maxX), y: rand(minY, maxY) }
  }
  const [x0, x1] = bands[Math.floor(Math.random() * bands.length)] as [number, number]
  return { x: rand(x0, x1), y: rand(minY, maxY) }
}

/** 默认锚位（viewport 右下角，与 .wander 的 24px 边距一致）。 */
function defaultAnchor(): WanderPoint {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return { x: window.innerWidth - 184, y: window.innerHeight - 184 }
}

export function MascotFloat({ ctx }: { ctx: ClientContext }): JSX.Element | null {
  const snapshot = useThemeSnapshot(ctx)
  const reduced = usePrefersReducedMotion()
  const [enabled, setEnabled] = useState<boolean>(() => skinStudioSettings.get().mascotEnabled)
  /** 语录语言（settings.quoteLang，中/英双池）。 */
  const [lang, setLang] = useState<QuoteLang>(() => skinStudioSettings.get().quoteLang)
  /** 淡出淡入：皮肤切换瞬间先降 opacity 再升起。 */
  const [visible, setVisible] = useState(false)
  /** 当前锚位（viewport 坐标）：初始右下角，漫步/拖动都直接更新它。 */
  const [anchor, setAnchor] = useState<WanderPoint>(defaultAnchor)
  const [dragging, setDragging] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  /** 任务完成庆祝中（叠加庆祝动画，短暂覆盖常规帧动画节奏）。 */
  const [celebrating, setCelebrating] = useState(false)
  const lastQuoteRef = useRef<string | null>(null)
  const dragStartRef = useRef<{ px: number; py: number; ax: number; ay: number; moved: boolean } | null>(null)
  const activeSkin = snapshot !== null ? skinRegistry.get(snapshot.active.id) : undefined
  const skinId = activeSkin?.id ?? ''

  // 境界档位：驱动吉祥物造型（分档 sprite；t0 用原形象）
  const [tier, setTier] = useState<PowerTier>(() => effectiveTier())
  useEffect(() => subscribeTier(setTier), [])

  useEffect(() => skinStudioSettings.subscribe(s => {
    setEnabled(s.mascotEnabled)
    setLang(s.quoteLang)
  }), [])

  // 换皮肤后第一句气泡用「对程序员的问候」
  const greetedRef = useRef(false)

  useEffect(() => {
    setVisible(false)
    setAnchor(defaultAnchor())
    setBubble(null)
    greetedRef.current = false
    const raf = requestAnimationFrame(() => { setVisible(true) })
    return () => cancelAnimationFrame(raf)
  }, [activeSkin?.id])

  // 散步走动（满屏随机走位；reduced-motion / 未启用 / 拖动中停住）
  useEffect(() => {
    if (reduced || !enabled || dragging || activeSkin?.mascotUrl === undefined) return undefined
    let alive = true
    const step = (): void => {
      if (!alive) return
      setAnchor(nextWanderPoint())
      window.setTimeout(step, IDLE_MS + MOVE_MS)
    }
    step()
    return () => { alive = false }
  }, [reduced, enabled, dragging, activeSkin?.mascotUrl])

  // 随机弹一条语录（更新 lastQuoteRef 以连续不重复；登场首句用问候）
  const bubbleTimerRef = useRef<number>(undefined)
  const pushBubble = useCallback((): void => {
    const q = greetedRef.current
      ? randomQuote(skinId, lang, lastQuoteRef.current)
      : randomGreeting(skinId, lang)
    greetedRef.current = true
    lastQuoteRef.current = q
    setBubble(q)
    if (bubbleTimerRef.current !== undefined) window.clearTimeout(bubbleTimerRef.current)
    bubbleTimerRef.current = window.setTimeout(() => { setBubble(null) }, BUBBLE_MS)
  }, [skinId, lang])

  // 任务完成庆祝：跳两下 + 冒一条完成语录（拖动中不抢戏）
  const celebrateTimerRef = useRef<number>(undefined)
  useEffect(() => {
    if (reduced || !enabled || skinId === '') return undefined
    return onTaskDone(() => {
      if (dragging) return
      setCelebrating(true)
      if (celebrateTimerRef.current !== undefined) window.clearTimeout(celebrateTimerRef.current)
      celebrateTimerRef.current = window.setTimeout(() => { setCelebrating(false) }, 1600)
      const q = randomDoneQuote(lang)
      lastQuoteRef.current = q
      setBubble(q)
      if (bubbleTimerRef.current !== undefined) window.clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = window.setTimeout(() => { setBubble(null) }, BUBBLE_MS)
    })
  }, [reduced, enabled, skinId, dragging, lang])

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

  // 只有提供了 sprite_anim.png 的皮肤才有浮层
  if (!enabled || activeSkin?.mascotUrl === undefined) return null

  // 分档造型：t1+ 用 tiers/t{n}/sprite_anim.png（t0 沿用原形象）
  const tierMascotUrl = tier > 0 && TIERED_SPRITE_SKINS.has(skinId)
    ? `/skins/${skinId}/assets/tiers/t${tier}/sprite_anim.png`
    : activeSkin.mascotUrl

  return (
    <div
      className={styles.wander}
      style={{
        left: anchor.x,
        top: anchor.y,
        // 覆盖 .wander 的 right/bottom 定位（同时存在会拉伸宽度）
        right: 'auto',
        bottom: 'auto',
        // 内联过渡：拖动时跟手（无过渡），漫步时平滑走位
        transition: dragging ? 'none' : `left ${MOVE_MS}ms cubic-bezier(0.33, 0, 0.2, 1), top ${MOVE_MS}ms cubic-bezier(0.33, 0, 0.2, 1)`,
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
          backgroundImage: `url(${tierMascotUrl})`,
          opacity: visible ? 0.9 : 0,
          // 内联动画（全局 keyframes 名）：class 规则的 animation 在部分宿主
          // 环境会被清覆，内联已被证实免疫。庆祝时叠加庆祝动画（transform
          // 通道）—— 与帧动画（background-position 通道）并行不冲突。
          animation: reduced
            ? undefined
            : celebrating
              ? 'xl-mascot-frames 1.2s step-end infinite, xl-mascot-celebrate 0.8s ease-in-out 2'
              : 'xl-mascot-frames 1.2s step-end infinite',
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
