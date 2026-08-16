import { describe, expect, it } from 'vitest'
import { BUILTIN_SKINS } from '../src/client/registry/builtinSkins.ts'

const FANREN_IDS = [
  'mupeiling-blossom',
  'hanli-daoist',
  'yinyue-lunar',
  'nangongwan-moon',
  'ziling-mystic',
]

const LOL_IDS = [
  'seraphine-anthem',
  'jinx-mayhem',
  'lux-radiance',
  'yasuo-gale',
  'vayne-nightfall',
  'ezreal-relicrun',
  'sona-etwahl',
  'mf-bountyhunter',
  'ahri-ninefold',
  'kaisa-voidborn',
]

/** LOL 系列色系（亮/暗）。 */
const LOL_SCHEME: Record<string, 'light' | 'dark'> = {
  'seraphine-anthem': 'light',
  'jinx-mayhem': 'dark',
  'lux-radiance': 'light',
  'yasuo-gale': 'light',
  'vayne-nightfall': 'dark',
  'ezreal-relicrun': 'light',
  'sona-etwahl': 'light',
  'mf-bountyhunter': 'dark',
  'ahri-ninefold': 'light',
  'kaisa-voidborn': 'dark',
}

describe('BUILTIN_SKINS（内置皮肤清单）', () => {
  it('共 18 款：aurora、midnight + 凡人修仙传 5 款 + 英雄联盟 10 款 + 梗文化 1 款', () => {
    expect(BUILTIN_SKINS.map(s => s.id)).toEqual(['aurora', 'midnight', ...FANREN_IDS, ...LOL_IDS, 'liangshen'])
  })

  it('凡人 5 款 + LOL 10 款带全套图片资源（preview/hero/mascot）', () => {
    for (const id of [...FANREN_IDS, ...LOL_IDS]) {
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

  it('色系声明与设计文档一致（银月/紫灵 dark，LOL 按表）', () => {
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
    for (const [id, scheme] of Object.entries(LOL_SCHEME)) expectScheme(id, scheme)
  })

  it('LOL 10 款 token 表与皮肤包注册值一致（bg-base / brand / sidebar）', () => {
    const EXPECT: Record<string, [string, string, string]> = {
      'seraphine-anthem': ['#F6EFFC', '#A855F7', '#F6EFFC'],
      'jinx-mayhem': ['#170F2E', '#22D3EE', '#170F2E'],
      'lux-radiance': ['#FAF6EC', '#D99A1B', '#FAF6EC'],
      'yasuo-gale': ['#EEF5F4', '#0E9394', '#EEF5F4'],
      'vayne-nightfall': ['#171228', '#8B7BD8', '#171228'],
      'ezreal-relicrun': ['#F2F6FA', '#2E86D9', '#F2F6FA'],
      'sona-etwahl': ['#F4F0FA', '#7C5CBF', '#F4F0FA'],
      'mf-bountyhunter': ['#221017', '#E0405A', '#221017'],
      'ahri-ninefold': ['#FDF2F4', '#E86A92', '#FDF2F4'],
      'kaisa-voidborn': ['#150D22', '#A78BFA', '#150D22'],
    }
    for (const [id, [base, brand, sb]] of Object.entries(EXPECT)) {
      const tokens = Object.fromEntries(BUILTIN_SKINS.find(s => s.id === id)?.tokens ?? [])
      expect(tokens['--dsw-alias-bg-base'], id).toBe(base)
      expect(tokens['--dsw-alias-brand-primary'], id).toBe(brand)
      expect(tokens['--dsw-specific-sidebar-fill'], id).toBe(sb)
    }
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
