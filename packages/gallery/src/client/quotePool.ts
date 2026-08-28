/**
 * quotePool — 吉祥物语录池（fetch 运行时，v1.0 架构与性能）。
 *
 * 语录素材不再打进插件 client bundle（DSH ModuleLoader 是单文件契约，
 * 动态 import 会被内联，无法真正懒加载）：scripts/gen-quotes.mjs 把
 * quotes/ 源数据生成为各皮肤 assets/quotes.json，走既有 /skins 静态
 * 路由按需加载——只取当前皮肤的一份，bundle 直减 ~120KB。
 *
 * API 保持同步随机取词：warmQuotes() 在皮肤激活时预热（异步 fetch +
 * 内存缓存），加载完成前 random* 落回通用双语池，失败静默（吉祥物
 * 不因网络问题丢气泡）。源数据模块 quotes.ts 仍由测试与生成脚本消费。
 */
import type { QuoteLang } from './quotes/types.ts'

export type { QuoteLang } from './quotes/types.ts'

interface SkinQuotes {
  zh: string[]
  en: string[]
  greetings: { zh: string[]; en: string[] }
}

/** 未知皮肤 / 未加载完成时的双语回退池。 */
const FALLBACK: Record<QuoteLang, readonly string[]> = {
  zh: ['慢慢来，比较快。', '路虽远，行则必至。', '道友好，今日宜心平气和。'],
  en: ['Slow is smooth, smooth is fast.', 'A long road still starts beneath your feet.', 'Hello, fellow — keep calm and code on.'],
}

const cache = new Map<string, SkinQuotes>()
const inFlight = new Map<string, Promise<void>>()

/** 预热某款皮肤的语录池（皮肤激活 / 切换时调用；幂等，失败静默）。 */
export function warmQuotes(skinId: string): void {
  if (skinId === '' || cache.has(skinId) || inFlight.has(skinId)) return
  const load = fetch(`/skins/${skinId}/assets/quotes.json`)
    .then(r => {
      if (!r.ok) throw new Error(`quotes.json ${r.status}`)
      return r.json() as Promise<SkinQuotes>
    })
    .then(data => {
      if (Array.isArray(data.zh) && Array.isArray(data.en)) cache.set(skinId, data)
    })
    .catch(() => undefined) // 静默：random* 用回退池
    .then(() => { inFlight.delete(skinId) })
  inFlight.set(skinId, load)
}

function poolOf(skinId: string, lang: QuoteLang): readonly string[] {
  return cache.get(skinId)?.[lang] ?? FALLBACK[lang]
}

/** 随机取一条（连续冒泡不与上一句重复）。 */
export function randomQuote(skinId: string, lang: QuoteLang, avoidLast: string | null): string {
  const pool = poolOf(skinId, lang)
  if (pool.length === 1) return pool[0] ?? ''
  let idx = Math.floor(Math.random() * pool.length)
  let guard = 0
  while (pool[idx] === avoidLast && guard < pool.length) {
    idx = (idx + 1) % pool.length
    guard += 1
  }
  return pool[idx] ?? ''
}

/** 随机取一条对程序员的问候（吉祥物登场首句用）。 */
export function randomGreeting(skinId: string, lang: QuoteLang): string {
  const greetings = cache.get(skinId)?.greetings[lang] ?? FALLBACK[lang]
  return greetings[Math.floor(Math.random() * greetings.length)] ?? greetings[0] ?? ''
}
