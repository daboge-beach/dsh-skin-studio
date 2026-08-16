/**
 * quotes.ts — 凡人修仙传 Q 版人物语录（吉祥物对话气泡用）。
 *
 * 每款皮肤每语言恰好 200 句（quotes/ 目录每角色一份素材，builder
 * 装配：手写句 + 程序员问候 + 黄历「宜/忌」组合句补足）。
 * 语言由皮肤中心设置（settings.quoteLang，'zh' | 'en'）选择；
 * 吉祥物每次登场的第一句气泡从 greetings 里挑（对程序员的问候）。
 */
import type { QuoteLang } from './quotes/types.ts'
import { buildLines } from './quotes/builder.ts'
import { blossom } from './quotes/blossom.ts'
import { daoist } from './quotes/daoist.ts'
import { lunar } from './quotes/lunar.ts'
import { moon } from './quotes/moon.ts'
import { mystic } from './quotes/mystic.ts'
import { seraphine } from './quotes/seraphine.ts'
import { jinx } from './quotes/jinx.ts'
import { lux } from './quotes/lux.ts'
import { yasuo } from './quotes/yasuo.ts'
import { vayne } from './quotes/vayne.ts'
import { ezreal } from './quotes/ezreal.ts'
import { sona } from './quotes/sona.ts'
import { mf } from './quotes/mf.ts'
import { ahri } from './quotes/ahri.ts'
import { kaisa } from './quotes/kaisa.ts'
import { liangshen } from './quotes/liangshen.ts'

export type { QuoteLang } from './quotes/types.ts'
export { TARGET_LINES } from './quotes/builder.ts'

/** 全部 16 款带语录的皮肤（凡人 5 + 英雄联盟 10 + 梗文化 1）。 */
const CHARACTER_DEFS = [
  blossom, daoist, lunar, moon, mystic,
  seraphine, jinx, lux, yasuo, vayne, ezreal, sona, mf, ahri, kaisa,
  liangshen,
] as const

/** 未知皮肤的双语回退池。 */
const FALLBACK: Record<QuoteLang, readonly string[]> = {
  zh: ['慢慢来，比较快。', '路虽远，行则必至。', '道友好，今日宜心平气和。'],
  en: ['Slow is smooth, smooth is fast.', 'A long road still starts beneath your feet.', 'Hello, fellow — keep calm and code on.'],
}

/** 装配结果缓存（素材为常量，装配幂等且纯）。 */
const poolCache = new Map<string, readonly string[]>()

/** 按皮肤 id + 语言取语录池（无则回退通用池）。 */
export function quotesForSkin(skinId: string, lang: QuoteLang = 'zh'): readonly string[] {
  const def = CHARACTER_DEFS.find(d => d.skinId === skinId)
  if (def === undefined) return FALLBACK[lang]
  const key = `${skinId}:${lang}`
  let pool = poolCache.get(key)
  if (pool === undefined) {
    pool = buildLines(def, lang)
    poolCache.set(key, pool)
  }
  return pool
}

/** 随机取一条（连续冒泡不与上一句重复）。 */
export function randomQuote(skinId: string, lang: QuoteLang, avoidLast: string | null): string {
  const pool = quotesForSkin(skinId, lang)
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
  const def = CHARACTER_DEFS.find(d => d.skinId === skinId)
  const greetings = def?.[lang].greetings ?? FALLBACK[lang]
  return greetings[Math.floor(Math.random() * greetings.length)] ?? greetings[0] ?? ''
}
