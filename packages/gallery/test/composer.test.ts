import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  checkReadability, contrastRatio, contrastLevel, deriveTheme, relativeLuminance,
} from '../src/client/composer/derive.ts'
import { encodePngRgb, gradientPng, storedDeflate } from '../src/client/composer/pngEncoder.ts'

describe('derive（配色推导）', () => {
  it('暗色/亮色各产出完整 14 token 表', () => {
    for (const scheme of ['dark', 'light'] as const) {
      const { tokens, palette } = deriveTheme('#6366f1', scheme)
      expect(Object.keys(tokens).length).toBe(14)
      expect(tokens['--dsw-alias-brand-primary']).toBe('#6366f1')
      expect(palette.primary).toBe('#6366f1')
    }
  })

  it('亮色背景是亮色、暗色背景是暗色（亮度单调）', () => {
    const light = deriveTheme('#6366f1', 'light')
    const dark = deriveTheme('#6366f1', 'dark')
    expect(relativeLuminance(light.palette.background)).toBeGreaterThan(0.5)
    expect(relativeLuminance(dark.palette.background)).toBeLessThan(0.2)
  })

  it('不同品牌色推导出不同背景', () => {
    const a = deriveTheme('#6366f1', 'dark')
    const b = deriveTheme('#e0405a', 'dark')
    expect(a.palette.background).not.toBe(b.palette.background)
  })
})

describe('WCAG 对比度', () => {
  it('黑白 = 21:1，同色 = 1:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('级别判定：≥4.5 good、≥3 ok、<3 poor', () => {
    expect(contrastLevel(21)).toBe('good')
    expect(contrastLevel(4.5)).toBe('good')
    expect(contrastLevel(3.5)).toBe('ok')
    expect(contrastLevel(2.9)).toBe('poor')
  })

  it('默认推导主题全部可读对 ≥3（poor 才拦截）', () => {
    for (const scheme of ['dark', 'light'] as const) {
      const { tokens } = deriveTheme('#6366f1', scheme)
      for (const check of checkReadability(tokens)) {
        expect(check.level, `${scheme} ${check.pair} ${check.ratio.toFixed(2)}`).not.toBe('poor')
      }
    }
  })

  it('故意不可读的组合会被检出 poor', () => {
    const { tokens } = deriveTheme('#6366f1', 'dark')
    tokens['--dsw-alias-label-primary'] = tokens['--dsw-alias-bg-base']
    expect(checkReadability(tokens).some(c => c.level === 'poor')).toBe(true)
  })
})

describe('pngEncoder（浏览器版 PNG 生成）', () => {
  it('storedDeflate 可被标准 zlib inflate 还原', () => {
    const data = new Uint8Array(70000).fill(0x5a) // 跨两个 stored 块
    const inflated = inflateSync(Buffer.from(storedDeflate(data)))
    expect(inflated.length).toBe(data.length)
    expect(Array.from(inflated.slice(0, 3))).toEqual([0x5a, 0x5a, 0x5a])
  })

  it('gradientPng 产出合法 PNG（签名/IHDR 尺寸/IDAT 可 inflate）', async () => {
    const png = await gradientPng('#6366f1', '#0f172a', 64, 48)
    const view = new DataView(png.buffer)
    expect(Array.from(png.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(view.getUint32(16)).toBe(64)
    expect(view.getUint32(20)).toBe(48)
    // IDAT 位于 8 签名 + 25 IHDR 之后：4 长度 + 4 类型
    const idatLen = view.getUint32(33)
    const idat = png.subarray(41, 41 + idatLen)
    const raw = inflateSync(Buffer.from(idat))
    expect(raw.length).toBe(48 * (1 + 64 * 3))
  })

  it('encodePngRgb 与 storedDeflate 兜底路径一致可用', async () => {
    const raw = new Uint8Array(8 * (1 + 8 * 3))
    const png = await encodePngRgb(raw, 8, 8)
    expect(png.length).toBeGreaterThan(8 + 25 + 12)
  })
})
