import { describe, expect, it } from 'vitest'
import { TARGET_LINES, quotesForSkin, randomGreeting, randomQuote } from '../src/client/quotes.ts'

const SKIN_IDS = [
  'mupeiling-blossom', 'hanli-daoist', 'yinyue-lunar', 'nangongwan-moon', 'ziling-mystic',
  'seraphine-anthem', 'jinx-mayhem', 'lux-radiance', 'yasuo-gale', 'vayne-nightfall',
  'ezreal-relicrun', 'sona-etwahl', 'mf-bountyhunter', 'ahri-ninefold', 'kaisa-voidborn',
] as const
const LANGS = ['zh', 'en'] as const

describe('quotes（吉祥物语录池 · 中英双语 ×200）', () => {
  it.each(SKIN_IDS)('%s：中/英各恰好 200 句且句内无重复', skinId => {
    for (const lang of LANGS) {
      const pool = quotesForSkin(skinId, lang)
      expect(pool.length).toBe(TARGET_LINES)
      expect(new Set(pool).size).toBe(TARGET_LINES)
    }
  })

  it.each(SKIN_IDS)('%s：句子长度合理', skinId => {
    for (const lang of LANGS) {
      for (const line of quotesForSkin(skinId, lang)) {
        expect(line.length).toBeGreaterThan(lang === 'zh' ? 4 : 8)
      }
    }
  })

  it.each(SKIN_IDS)('%s：中英池内容不同（各是独立语料）', skinId => {
    const zh = new Set(quotesForSkin(skinId, 'zh'))
    const en = quotesForSkin(skinId, 'en')
    expect(en.some(line => zh.has(line))).toBe(false)
  })

  it('randomQuote 连续调用不与上一句重复，且始终在池内', () => {
    for (const lang of LANGS) {
      const pool = quotesForSkin('hanli-daoist', lang)
      let last: string | null = null
      for (let i = 0; i < 30; i++) {
        const q = randomQuote('hanli-daoist', lang, last)
        if (last !== null) expect(q).not.toBe(last)
        expect(pool).toContain(q)
        last = q
      }
    }
  })

  it('randomGreeting 返回问候语（未知皮肤回退通用池）', () => {
    for (const skinId of SKIN_IDS) {
      for (const lang of LANGS) {
        const g = randomGreeting(skinId, lang)
        expect(g.length).toBeGreaterThan(4)
        // 问候语也在完整池内（buildLines 会并入 greetings）
        expect(quotesForSkin(skinId, lang)).toContain(g)
      }
    }
    expect(randomGreeting('unknown-skin', 'en').length).toBeGreaterThan(4)
  })

  it('未知皮肤回退通用池（中/英）', () => {
    for (const lang of LANGS) {
      const pool = quotesForSkin('unknown-skin', lang)
      expect(pool.length).toBeGreaterThanOrEqual(1)
    }
  })
})
