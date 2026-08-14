import { describe, expect, it } from 'vitest'
import { BUILTIN_SKINS } from '../src/client/registry/builtinSkins.ts'

const FANREN_IDS = [
  'mupeiling-blossom',
  'hanli-daoist',
  'yinyue-lunar',
  'nangongwan-moon',
  'ziling-mystic',
]

describe('BUILTIN_SKINS（内置皮肤清单）', () => {
  it('共 7 款：aurora、midnight + 凡人修仙传 5 款', () => {
    expect(BUILTIN_SKINS.map(s => s.id)).toEqual(['aurora', 'midnight', ...FANREN_IDS])
  })

  it('凡人修仙传 5 款带全套图片资源（preview/hero/mascot）', () => {
    for (const id of FANREN_IDS) {
      const skin = BUILTIN_SKINS.find(s => s.id === id)
      expect(skin, id).toBeDefined()
      expect(skin?.previewUrl).toMatch(new RegExp(`/skins/${id}/assets/preview\\.png$`))
      expect(skin?.heroUrl).toMatch(new RegExp(`/skins/${id}/assets/hero\\.png$`))
      expect(skin?.mascotUrl).toMatch(new RegExp(`/skins/${id}/assets/sprite_anim\\.png$`))
    }
  })

  it('aurora / midnight 无图片资源（卡片回退渐变），且各带完整 token 表', () => {
    for (const id of ['aurora', 'midnight']) {
      const skin = BUILTIN_SKINS.find(s => s.id === id)
      expect(skin?.previewUrl).toBeUndefined()
      expect(skin?.heroUrl).toBeUndefined()
      expect(skin?.mascotUrl).toBeUndefined()
      expect(skin?.paletteCssGradient).toMatch(/^linear-gradient/)
      expect(skin?.tokenCount).toBeGreaterThan(0)
    }
  })

  it('色系声明与设计文档一致（银月/紫灵 dark，其余 light）', () => {
    const expectScheme = (id: string, scheme: 'light' | 'dark'): void => {
      expect(BUILTIN_SKINS.find(s => s.id === id)?.colorScheme).toBe(scheme)
    }
    expectScheme('aurora', 'light')
    expectScheme('midnight', 'dark')
    expectScheme('mupeiling-blossom', 'light')
    expectScheme('hanli-daoist', 'light')
    expectScheme('yinyue-lunar', 'dark')
    expectScheme('nangongwan-moon', 'light')
    expectScheme('ziling-mystic', 'dark')
  })

  it('全部为 builtin 来源、不可删除、token 表非空', () => {
    for (const skin of BUILTIN_SKINS) {
      expect(skin.source).toBe('builtin')
      expect(skin.removable).toBe(false)
      expect(skin.tokenCount).toBeGreaterThan(0)
      expect(skin.keywords?.length ?? 0).toBeGreaterThan(0)
    }
  })
})
