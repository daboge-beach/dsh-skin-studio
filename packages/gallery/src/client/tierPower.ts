/**
 * tierPower — 境界档位（推理等级联动）。
 *
 * 'auto' 模式从 DSH 模型按钮的 aria-label 读取当前推理等级（与 taskNotify
 * 同款 DOM 观察思路，不依赖宿主私有 API），按名称归一化映射到 0-3 档；
 * 手动模式直接取 settings.powerTier。档位变化经模块级订阅分发，驱动
 * 吉祥物造型 / 光标配色 / 背景装饰强度。
 */
import { skinStudioSettings } from './settings.ts'

export type PowerTier = 0 | 1 | 2 | 3

/** 推理等级名 → 档位（未识别的名称按保守原则落 0 档）。 */
function effortNameToTier(name: string): PowerTier {
  const n = name.trim().toLowerCase()
  // 英文档名（模型元数据原生）
  if (/(max|ultra|insane|thinking)/.test(n)) return 3
  if (/high/.test(n)) return 2
  if (/(medium|mid|balanced)/.test(n)) return 1
  // 中文档名（界面本地化形态）
  if (/深度|极智|最强|满血/.test(n)) return 3
  if (/高|深思/.test(n)) return 2
  if (/中|平衡/.test(n)) return 1
  if (/low|mini|fast|default|none|快速|默认|标准/.test(n)) return 0
  return 0
}

/** 从 DOM 读当前推理等级名（模型触发按钮的 aria-label 含 "推理等级 X" / "reasoning effort X"）。 */
function readReasoningEffort(): string | null {
  if (typeof document === 'undefined') return null
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[aria-label]')
  for (const btn of buttons) {
    const label = btn.getAttribute('aria-label') ?? ''
    const m = /(?:推理等级|reasoning effort)\s+([A-Za-z\u4e00-\u9fa5]+)/i.exec(label)
    if (m?.[1] !== undefined) return m[1]
  }
  return null
}

/** 检测到的推理档位（读不到时 0 档）。 */
let detectedTier: PowerTier = 0

/** 当前生效档位（手动锁定优先）。 */
export function effectiveTier(): PowerTier {
  const mode = skinStudioSettings.get().powerTier
  if (mode === 'auto') return detectedTier
  return (Number(mode.slice(1)) as PowerTier)
}

type TierListener = (tier: PowerTier) => void
const listeners = new Set<TierListener>()

function publish(): void {
  const tier = effectiveTier()
  for (const listener of listeners) listener(tier)
}

/** React hook 式订阅当前档位（返回取消函数）。 */
export function subscribeTier(listener: TierListener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/**
 * 挂载档位观察器：MutationObserver 监视 aria-label 变化重读推理等级 +
 * 订阅设置变化（手动档切换）。
 * @returns 卸载函数。
 */
export function mountTierWatch(): () => void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return () => {}

  let scanTimer: number | undefined
  const rescan = (): void => {
    if (scanTimer !== undefined) window.clearTimeout(scanTimer)
    scanTimer = window.setTimeout(() => {
      scanTimer = undefined
      const name = readReasoningEffort()
      const next = name === null ? 0 : effortNameToTier(name)
      if (next !== detectedTier) {
        detectedTier = next
        publish()
      }
    }, 150)
  }

  const observer = new MutationObserver(rescan)
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-label'],
  })
  rescan()

  const offSettings = skinStudioSettings.subscribe(() => { publish() })
  return () => {
    if (scanTimer !== undefined) window.clearTimeout(scanTimer)
    observer.disconnect()
    offSettings()
    listeners.clear()
  }
}

/** 各皮肤的档位标签（境界名 / 皮肤等级名；未列出的皮肤用通用档名）。 */
const TIER_LABELS: Record<string, readonly [string, string, string, string]> = {
  'hanli-daoist': ['炼气', '筑基', '结丹', '元婴'],
  'mupeiling-blossom': ['炼气', '筑基', '结丹', '元婴'],
  'yinyue-lunar': ['炼气', '筑基', '结丹', '元婴'],
  'nangongwan-moon': ['炼气', '筑基', '结丹', '元婴'],
  'ziling-mystic': ['炼气', '筑基', '结丹', '元婴'],
  'ahri-ninefold': ['基础', '史诗', '传说', '终极'],
  'ezreal-relicrun': ['基础', '史诗', '传说', '终极'],
  'jinx-mayhem': ['基础', '史诗', '传说', '终极'],
  'kaisa-voidborn': ['基础', '史诗', '传说', '终极'],
  'lux-radiance': ['基础', '史诗', '传说', '终极'],
  'mf-bountyhunter': ['基础', '史诗', '传说', '终极'],
  'seraphine-anthem': ['基础', '史诗', '传说', '终极'],
  'sona-etwahl': ['基础', '史诗', '传说', '终极'],
  'vayne-nightfall': ['基础', '史诗', '传说', '终极'],
  'yasuo-gale': ['基础', '史诗', '传说', '终极'],
  'liangshen': ['凉子', '梁子', '梁圣', '梁神'],
}

/** 取皮肤在某档的显示名（如「韩立 · 青竹（元婴）」）。 */
export function tierLabel(skinId: string, tier: PowerTier): string {
  return TIER_LABELS[skinId]?.[tier] ?? `Lv.${tier + 1}`
}

/** 有分档生图资产（tiers/t{n}/sprite_anim.png）的皮肤，第一版三条链路。 */
export const TIERED_SPRITE_SKINS = new Set(['hanli-daoist', 'ahri-ninefold', 'liangshen'])

/** 有分档光标变体的皮肤（cursors/*-t{n}.svg 由构建脚本生成）。 */
export const TIERED_CURSOR_SKINS = new Set(['hanli-daoist', 'ahri-ninefold', 'liangshen'])
