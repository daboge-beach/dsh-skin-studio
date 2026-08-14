/**
 * quotes/builder.ts — 把角色素材装配成 200 句语录池。
 *
 * 池 = fixed（原著风 + 跨界梗）+ greetings（程序员问候）+ 黄历「宜/忌」
 * 组合句补足缺口。黄历第 k 条取 (good[k % G], bad[floor(k / G)])，
 * need ≤ G×B 时配对必不重复；句式按 k 轮换 3 个模板避免读感机械。
 * 产出顺序稳定、可测。
 */
import type { CharacterQuoteDef, LangQuoteDef, QuoteLang } from './types.ts'

/** 每角色每语言的目标句数（产品约定 200）。 */
export const TARGET_LINES = 200

const ZH_TEMPLATES = [
  (g: string, b: string): string => `今日宜${g}，忌${b}。`,
  (g: string, b: string): string => `黄历有云：宜${g}，忌${b}。`,
  (g: string, b: string): string => `掐指一算，今日宜${g}，切忌${b}。`,
]

const EN_TEMPLATES = [
  (g: string, b: string): string => `Today: good for ${g}; avoid ${b}.`,
  (g: string, b: string): string => `The almanac says: do ${g}, skip ${b}.`,
  (g: string, b: string): string => `Stars align for ${g} — steer clear of ${b}.`,
]

/** 黄历组合句（确定性，need 条且互不重复）。 */
export function almanacLines(def: LangQuoteDef, lang: QuoteLang, need: number): string[] {
  const templates = lang === 'zh' ? ZH_TEMPLATES : EN_TEMPLATES
  const G = def.good.length
  const B = def.bad.length
  const out: string[] = []
  for (let k = 0; k < need; k++) {
    const g = def.good[k % G] ?? ''
    const b = def.bad[Math.floor(k / G) % B] ?? ''
    const tpl = templates[k % templates.length]
    if (tpl !== undefined) out.push(tpl(g, b))
  }
  return out
}

/** 装配单语言完整池（fixed + greetings + 黄历补足到 TARGET_LINES）。 */
export function buildLines(def: CharacterQuoteDef, lang: QuoteLang): string[] {
  const material = def[lang]
  const head = [...material.fixed, ...material.greetings]
  const need = Math.max(0, TARGET_LINES - head.length)
  if (need > material.good.length * material.bad.length) {
    throw new Error(`${def.skinId}.${lang} 素材不足以凑满 ${TARGET_LINES} 句`)
  }
  return [...head, ...almanacLines(material, lang, need)]
}
