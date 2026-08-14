/**
 * quotes/types.ts — 角色语录定义的类型（每角色一份，见同目录 5 个数据文件）。
 *
 * 语录按语言分池（中文/English），每池目标 200 句：
 * - fixed：手写句（原著风台词 + 程序员问候 + 修仙×码农跨界梗）
 * - greetings：对程序员的问候语（吉祥物每次登场的第一句气泡用它）
 * - good/bad：黄历「宜/忌」词表，builder 按确定性配对组合出余量句
 *   （今日宜{g}，忌{b}），保证去重且凑满 200。
 */

/** 语录语言。 */
export type QuoteLang = 'zh' | 'en'

/** 单语言的语录素材。 */
export interface LangQuoteDef {
  /** 手写固定句（含原著风 + 跨界梗）。 */
  fixed: string[]
  /** 对程序员的问候语（登场首句从这里挑）。 */
  greetings: string[]
  /** 黄历「宜」词表（名词短语，如「重构祖传代码」）。 */
  good: string[]
  /** 黄历「忌」词表。 */
  bad: string[]
}

/** 一个 Q 版角色的完整语录定义。 */
export interface CharacterQuoteDef {
  /** 皮肤 id。 */
  skinId: string
  /** 中文池素材。 */
  zh: LangQuoteDef
  /** 英文池素材。 */
  en: LangQuoteDef
}
