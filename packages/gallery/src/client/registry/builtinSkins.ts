/**
 * 内置皮肤清单（SkinRegistry 的 builtin 数据源）— v1.0 起为装配层。
 *
 * 数据不再手写：scripts/gen-skin-data.mjs 从各皮肤包 skin.json（tokens
 * 已合并入内，源自各包 src/index.ts 的 ctx.theme.register() 字面量）
 * 生成 builtinSkins.gen.ts，本模块只负责把生成数据装配成 SkinEntry。
 * 新增皮肤 = 建包 + pnpm gen:skin-data，不再「源码、manifest、registry
 * 三处手工同步」。
 *
 * 资源映射规则见 docs/FRONTEND_REQUIREMENTS.md「皮肤包内的资源映射」：
 * assets/preview.png → previewUrl、assets/hero.png → heroUrl、
 * assets/sprite_anim.png → mascotUrl（2×2 网格 4 帧动画）。
 */
import type { SkinEntry } from './types.ts'
import { GENERATED_SKINS } from './builtinSkins.gen.ts'

/** 内置皮肤的静态资源基址（与 FANREN_SKINS_DESIGN.md 的光标资源路径约定一致）。 */
const assetUrl = (skinId: string, file: string): string => `/skins/${skinId}/assets/${file}`

/** 由 palette 摘要生成卡片回退渐变（无 preview.png 时使用）。 */
export function paletteCssGradient(palette: SkinEntry['palette']): string {
  return `linear-gradient(135deg, ${palette.background} 0%, ${palette.surface} 48%, ${palette.primary} 160%)`
}

/** 生成的 manifest 数据 → 画廊条目。 */
function entry(manifest: typeof GENERATED_SKINS[number]): SkinEntry {
  const tokenList = Object.entries(manifest.tokens) as Array<[string, string]>
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    colorScheme: manifest.colorScheme,
    license: manifest.license,
    homepage: manifest.homepage,
    keywords: manifest.keywords,
    preview: manifest.images?.preview,
    previewUrl: manifest.images?.preview !== undefined ? assetUrl(manifest.id, 'preview.png') : undefined,
    heroUrl: manifest.images?.hero !== undefined ? assetUrl(manifest.id, 'hero.png') : undefined,
    mascotUrl: manifest.images?.mascot !== undefined ? assetUrl(manifest.id, 'sprite_anim.png') : undefined,
    palette: manifest.palette,
    tokens: tokenList,
    tokenCount: tokenList.length,
    paletteCssGradient: paletteCssGradient(manifest.palette),
    source: 'builtin',
    removable: false,
  }
}

/** 画廊展示顺序（基础两款 → 凡人修仙传 → 英雄联盟 → 梗文化；未知排末尾）。 */
const DISPLAY_ORDER = [
  'aurora', 'midnight',
  'mupeiling-blossom', 'hanli-daoist', 'yinyue-lunar', 'nangongwan-moon', 'ziling-mystic',
  'seraphine-anthem', 'jinx-mayhem', 'lux-radiance', 'yasuo-gale', 'vayne-nightfall',
  'ezreal-relicrun', 'sona-etwahl', 'mf-bountyhunter', 'ahri-ninefold', 'kaisa-voidborn',
  'liangshen',
]

/** 全部内置皮肤（生成数据装配；画廊按策展顺序展示，新增皮肤自动排末尾）。 */
export const BUILTIN_SKINS: readonly SkinEntry[] = Object.freeze(
  [...GENERATED_SKINS]
    .sort((a, b) => {
      const ia = DISPLAY_ORDER.indexOf(a.id)
      const ib = DISPLAY_ORDER.indexOf(b.id)
      return (ia === -1 ? DISPLAY_ORDER.length : ia) - (ib === -1 ? DISPLAY_ORDER.length : ib)
    })
    .map(entry),
)
