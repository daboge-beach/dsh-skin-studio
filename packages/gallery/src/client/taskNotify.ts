/**
 * taskNotify — 任务完成提醒（提示音 + 吉祥物庆祝）。
 *
 * 信号源：DSH 的「发送消息」按钮 disabled 状态 —— 任务运行期间按钮禁用，
 * 完成恢复。观察 disabled→enabled 的上升沿（且此前真的忙过）即任务完成。
 * 不依赖宿主私有 API，纯 DOM 观察，页面结构变化时静默退化为无提醒。
 *
 * 提示音：Web Audio 合成（零音频资源），音色按皮肤系列三档 ——
 * 凡人修仙传系（古筝拨弦）/ 英雄联盟系（号角双响）/ 基础系（清脆叮咚）。
 * 吉祥物庆祝：模块级监听器分发，MascotFloat 订阅后跳跃庆祝 + 冒完成语录。
 */
import type { QuoteLang } from './quotes/types.ts'

/** 任务完成提醒模式（settings.notifyTaskDone）。 */
export type TaskNotifyMode = 'off' | 'sound' | 'motion' | 'both'

/** 完成事件监听器（吉祥物庆祝动作用）。 */
type DoneListener = () => void
const doneListeners = new Set<DoneListener>()

/** 订阅任务完成事件（返回取消函数）。 */
export function onTaskDone(listener: DoneListener): () => void {
  doneListeners.add(listener)
  return () => { doneListeners.delete(listener) }
}

/** 当前是否处于「刚完成」节流窗口（3 秒内多次边沿只触发一次）。 */
let lastFiredAt = 0

/** 查找 DSH 发送按钮（aria-label 随界面语言变化，中英都认）。 */
function findSendButton(): HTMLButtonElement | null {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button')
  for (const btn of buttons) {
    const label = btn.getAttribute('aria-label') ?? btn.title ?? btn.textContent ?? ''
    if (/发送消息|发送|send message/i.test(label)) return btn
  }
  return null
}

/** 按钮当前是否禁用（disabled 属性或 aria-disabled）。 */
function isBusy(btn: HTMLButtonElement | null): boolean {
  if (btn === null) return false
  return btn.disabled || btn.getAttribute('aria-disabled') === 'true'
}

// ── 提示音（Web Audio 合成） ────────────────────────────────────────────

let audioCtx: AudioContext | null = null

/** 懒创建 AudioContext（浏览器自动播放策略：首次调用通常已发生过用户交互）。 */
function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (audioCtx === null) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AC === undefined) return null
      audioCtx = new AC()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

/** 单个合成音：oscillator + 指数衰减包络 + 可选滑音。 */
function tone(freq: number, start: number, dur: number, type: OscillatorType, gainPeak: number, slideTo?: number): void {
  const ac = ctx()
  if (ac === null) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const t0 = ac.currentTime + start
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

/** 凡人修仙传系皮肤 id（拨弦音色）。 */
const FANREN_IDS = new Set(['hanli-daoist', 'mupeiling-blossom', 'yinyue-lunar', 'nangongwan-moon', 'ziling-mystic'])

/** 按皮肤系列播放完成提示音。 */
function playDoneSound(skinId: string): void {
  if (FANREN_IDS.has(skinId)) {
    // 古筝拨弦：两个正弦滑音，一挑一收
    tone(880, 0, 0.28, 'sine', 0.16, 660)
    tone(660, 0.16, 0.4, 'sine', 0.12, 523)
  } else if (skinId === 'aurora' || skinId === 'midnight') {
    // 基础系：清脆叮咚两连音
    tone(1318.5, 0, 0.14, 'sine', 0.14)
    tone(1760, 0.13, 0.22, 'sine', 0.11)
  } else {
    // 英雄联盟系：号角双响（三和弦）
    for (const f of [523.25, 659.25, 783.99]) tone(f, 0, 0.16, 'square', 0.045)
    for (const f of [523.25, 659.25, 783.99]) tone(f, 0.19, 0.26, 'square', 0.05)
  }
}

// ── 挂载 / 卸载 ────────────────────────────────────────────────────────

export interface TaskNotifyOptions {
  /** 当前应用中的皮肤 id（音色按系列分化）。 */
  getSkinId: () => string
  /** 提醒模式（off 时不做任何事）。 */
  getMode: () => TaskNotifyMode
  /** 是否抑制动作（reduced-motion 且未强制 always）。 */
  reducedMotion: () => boolean
}

/**
 * 挂载任务完成观察器。
 * @returns 卸载函数（断开观察、清空监听）。
 */
export function mountTaskNotify(options: TaskNotifyOptions): () => void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return () => {}

  let wasBusy = false
  let fireTimer: number | undefined

  const emitDone = (): void => {
    const now = Date.now()
    if (now - lastFiredAt < 3000) return // 节流：状态抖动只响一次
    lastFiredAt = now
    const mode = options.getMode()
    if (mode === 'off') return
    if (mode === 'sound' || mode === 'both') playDoneSound(options.getSkinId())
    if ((mode === 'motion' || mode === 'both') && !options.reducedMotion()) {
      for (const listener of doneListeners) listener()
    }
  }

  const observer = new MutationObserver(() => {
    // 防抖到一个宏任务再采样，规避一帧内的多次属性变更
    if (fireTimer !== undefined) window.clearTimeout(fireTimer)
    fireTimer = window.setTimeout(() => {
      fireTimer = undefined
      const busy = isBusy(findSendButton())
      if (busy) {
        wasBusy = true
      } else if (wasBusy) {
        wasBusy = false
        emitDone()
      }
    }, 120)
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled'],
  })

  return () => {
    if (fireTimer !== undefined) window.clearTimeout(fireTimer)
    observer.disconnect()
    doneListeners.clear()
  }
}

/** 任务完成专用语录（通用池，双语）。 */
export const DONE_QUOTES: Record<QuoteLang, readonly string[]> = {
  zh: [
    '活干完了，道行又涨一分。',
    'Bug 已斩，剑归鞘。',
    '这一趟行云流水，收工。',
    '功德 +1，记得喝口水。',
    '跑完了。吾辈先行歇息，道友随意。',
    '搞定。要不要再许个愿？',
    '尘埃落定，代码已成。',
    '任务终了，杯莫停。',
  ],
  en: [
    'Done and dusted — another +1 to your cultivation.',
    'Bug slain, sword sheathed.',
    'Smooth as flowing water. Take a break.',
    'Merit point earned. Hydrate, coder.',
    'Finished. I shall rest now — carry on.',
    'All done. Care to make another wish?',
    'The dust has settled; the code is forged.',
    'Quest complete. Cheers!',
  ],
}

/** 随机取一条完成语录。 */
export function randomDoneQuote(lang: QuoteLang): string {
  const pool = DONE_QUOTES[lang]
  return pool[Math.floor(Math.random() * pool.length)] ?? DONE_QUOTES.zh[0] ?? 'Done!'
}
