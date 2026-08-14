import { describe, expect, it } from 'vitest'
import { FANREN_QUOTES, quotesForSkin, randomQuote } from '../src/client/quotes.ts'

describe('quotes（吉祥物语录池）', () => {
  it('凡人 5 款皮肤各有语录组且非空', () => {
    const ids = ['mupeiling-blossom', 'hanli-daoist', 'yinyue-lunar', 'nangongwan-moon', 'ziling-mystic']
    expect(FANREN_QUOTES.map(q => q.skinId).sort()).toEqual([...ids].sort())
    for (const group of FANREN_QUOTES) {
      expect(group.lines.length).toBeGreaterThanOrEqual(5)
      for (const line of group.lines) expect(line.length).toBeGreaterThan(4)
    }
  })

  it('未知皮肤回退通用池', () => {
    const pool = quotesForSkin('unknown-skin')
    expect(pool.length).toBeGreaterThanOrEqual(1)
  })

  it('randomQuote 连续调用不与上一条重复（池 >1 时）', () => {
    const pool = quotesForSkin('hanli-daoist')
    let last: string | null = null
    for (let i = 0; i < 30; i++) {
      const q = randomQuote('hanli-daoist', last)
      if (last !== null && pool.length > 1) expect(q).not.toBe(last)
      expect(pool).toContain(q)
      last = q
    }
  })

  it('randomQuote 始终返回池内文案', () => {
    for (const group of FANREN_QUOTES) {
      const q = randomQuote(group.skinId, null)
      expect(group.lines).toContain(q)
    }
  })
})
