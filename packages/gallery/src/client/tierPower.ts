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

/**
 * 推理等级名 → 档位。返回 null = 未识别（调用方保持当前档位不变，
 * 不做任何突变——任何模型的等级词没命中就维持现状，滑条随时手控）。
 */
function effortNameToTier(name: string): PowerTier | null {
  const n = name.trim().toLowerCase()
  // 通用强度词（DeepSeek / GLM / 主流 OpenAI 风格档位）
  if (/(max|ultra|insane|thinking|deep|深度|极智|最强|满血|开启思考)/.test(n)) return 3
  if (/(high|深|强)/.test(n)) return 2
  if (/(medium|mid|balanced|中|平衡)/.test(n)) return 1
  if (/(low|mini|fast|default|none|off|standard|quick|快速|默认|标准|关闭思考)/.test(n)) return 0
  return null
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
  // 可观测探针：body data-xl-tier 暴露当前档（诊断联动链路用）
  if (typeof document !== 'undefined') document.body.dataset.xlTier = String(tier)
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
      // 未识别的等级名（换了模型/新档位词）→ 保持当前档位，不突变
      if (name === null) return
      const next = effortNameToTier(name)
      if (next !== null && next !== detectedTier) {
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

  // 轮询兜底：MutationObserver 在个别宿主环境下可能漏报 aria-label 变化
  // （按钮被整棵替换等），2s 轮询保证推理等级变化最终一致（值未变时零开销）。
  const pollTimer = window.setInterval(rescan, 2000)

  const offSettings = skinStudioSettings.subscribe(() => { publish() })
  return () => {
    window.clearInterval(pollTimer)
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
