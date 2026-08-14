/**
 * 内置皮肤清单（SkinRegistry 的 builtin 数据源）。
 *
 * 数据逐字段对齐 packages/skins 下 7 个皮肤包的 skin.json 与各包
 * src/index.ts 中的 ctx.theme.register() token 表（详情面板「Token 覆盖」
 * 直接展示这份数据，与皮肤插件真正注册到 ThemeRuntime 的值一致）。
 *
 * 资源映射规则见 docs/FRONTEND_REQUIREMENTS.md「皮肤包内的资源映射」：
 * assets/preview.png → previewUrl、assets/hero.png → heroUrl、
 * assets/sprite_anim.png → mascotUrl（2×2 网格 4 帧动画）。
 * aurora / midnight 未提供图片资源 → 对应字段缺省，卡片回退配色渐变。
 */
import type { SkinEntry } from './types.ts'

/** 内置皮肤的静态资源基址（与 FANREN_SKINS_DESIGN.md 的光标资源路径约定一致）。 */
const assetUrl = (skinId: string, file: string): string => `/skins/${skinId}/assets/${file}`

/** 由 palette 摘要生成卡片回退渐变（无 preview.png 时使用）。 */
export function paletteCssGradient(palette: SkinEntry['palette']): string {
  return `linear-gradient(135deg, ${palette.background} 0%, ${palette.surface} 48%, ${palette.primary} 160%)`
}

function entry(
  manifest: {
    id: string
    name: string
    description: string
    colorScheme: 'light' | 'dark'
    version: string
    keywords: string[]
    palette: SkinEntry['palette']
    /** assets/ 下的可用图片（aurora / midnight 无图则省略整段）。 */
    images?: { preview?: string; hero?: string; mascot?: string }
  },
  tokens: Record<string, string>,
): SkinEntry {
  const tokenList = Object.entries(tokens) as Array<[string, string]>
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    author: {
      name: 'DSH Skin Studio',
      url: 'https://github.com/dengbochina-a11y/dsh-skin-studio',
    },
    description: manifest.description,
    colorScheme: manifest.colorScheme,
    license: 'MIT',
    homepage: 'https://github.com/dengbochina-a11y/dsh-skin-studio',
    keywords: manifest.keywords,
    preview: manifest.images?.preview ? assetUrl(manifest.id, 'preview.png') : undefined,
    previewUrl: manifest.images?.preview ? assetUrl(manifest.id, 'preview.png') : undefined,
    heroUrl: manifest.images?.hero ? assetUrl(manifest.id, 'hero.png') : undefined,
    mascotUrl: manifest.images?.mascot ? assetUrl(manifest.id, 'sprite_anim.png') : undefined,
    palette: manifest.palette,
    tokens: tokenList,
    tokenCount: tokenList.length,
    paletteCssGradient: paletteCssGradient(manifest.palette),
    source: 'builtin',
    removable: false,
  }
}

/** 全部 7 款内置皮肤（各皮肤包 skin.json + src/index.ts 的镜像）。 */
export const BUILTIN_SKINS: readonly SkinEntry[] = Object.freeze([
  entry({
    id: 'aurora',
    name: 'Aurora',
    description: '极光 — 极简亮色皮肤，柔和的晨光配色，长时间使用不刺眼。',
    colorScheme: 'light',
    version: '0.1.0',
    keywords: ['minimal', 'light', 'clean'],
    palette: {
      primary: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      border: '#e2e8f0',
    },
  }, {
    '--dsw-alias-bg-base': '#f8fafc',
    '--dsw-alias-bg-layer-1': '#ffffff',
    '--dsw-alias-bg-layer-2': '#f1f5f9',
    '--dsw-alias-bg-overlay': '#ffffff',
    '--dsw-alias-border-l1': '#e2e8f0',
    '--dsw-alias-border-l2': '#cbd5e1',
    '--dsw-alias-brand-primary': '#3b82f6',
    '--dsw-alias-label-primary': '#0f172a',
    '--dsw-alias-label-secondary': '#64748b',
    '--dsw-alias-state-error-primary': '#ef4444',
    '--dsw-alias-state-success-primary': '#10b981',
    '--dsw-alias-state-warn-primary': '#f59e0b',
    '--dsw-specific-sidebar-fill': '#f1f5f9',
  }),
  entry({
    id: 'midnight',
    name: 'Midnight',
    description: '午夜 — 极简暗色皮肤，深邃的夜空配色，护眼专注。',
    colorScheme: 'dark',
    version: '0.1.0',
    keywords: ['minimal', 'dark', 'focus'],
    palette: {
      primary: '#60a5fa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      border: '#334155',
    },
  }, {
    '--dsw-alias-bg-base': '#0f172a',
    '--dsw-alias-bg-layer-1': '#1e293b',
    '--dsw-alias-bg-layer-2': '#334155',
    '--dsw-alias-bg-overlay': '#1e293b',
    '--dsw-alias-border-l1': '#334155',
    '--dsw-alias-border-l2': '#475569',
    '--dsw-alias-brand-primary': '#60a5fa',
    '--dsw-alias-label-primary': '#f1f5f9',
    '--dsw-alias-label-secondary': '#94a3b8',
    '--dsw-alias-state-error-primary': '#f87171',
    '--dsw-alias-state-success-primary': '#34d399',
    '--dsw-alias-state-warn-primary': '#fbbf24',
    '--dsw-specific-sidebar-fill': '#0f172a',
  }),
  entry({
    id: 'mupeiling-blossom',
    name: '慕沛灵 · 桃夭',
    description: '粉白国风 · 桃花薄雾 — 落云宗药园女修的柔美桃花意境，花瓣法宝光标 + 灵气涟漪特效。',
    colorScheme: 'light',
    version: '0.1.0',
    keywords: ['fanren', 'xianxia', 'guofeng', 'pink', 'light'],
    palette: {
      primary: '#D4537E',
      background: '#FBEAF0',
      surface: '#FFFFFF',
      text: '#993556',
      border: '#F4C0D1',
    },
    images: { preview: 'preview.png', hero: 'hero.png', mascot: 'sprite_anim.png' },
  }, {
    '--dsw-alias-bg-base': '#FBEAF0',
    '--dsw-alias-bg-layer-1': '#FFFFFF',
    '--dsw-alias-bg-layer-2': '#F4C0D1',
    '--dsw-alias-bg-overlay': '#FBEAF0',
    '--dsw-alias-border-l1': '#F4C0D1',
    '--dsw-alias-border-l2': '#ED93B1',
    '--dsw-alias-brand-primary': '#D4537E',
    '--dsw-alias-brand-hover': '#ED93B1',
    '--dsw-alias-label-primary': '#993556',
    '--dsw-alias-label-secondary': '#C77B98',
    '--dsw-alias-state-error-primary': '#E24B4A',
    '--dsw-alias-state-success-primary': '#10b981',
    '--dsw-alias-state-warn-primary': '#FBBF24',
    '--dsw-specific-sidebar-fill': '#FBEAF0',
  }),
  entry({
    id: 'hanli-daoist',
    name: '韩立 · 青竹',
    description: '青绿道风 · 翠竹雷光 — 青袍道人的竹剑意境，青竹蜂云剑光标 + 辟邪神雷特效。',
    colorScheme: 'light',
    version: '0.1.0',
    keywords: ['fanren', 'xianxia', 'daoist', 'green', 'light'],
    palette: {
      primary: '#639922',
      background: '#EAF3DE',
      surface: '#F4F8EC',
      text: '#3B6D11',
      border: '#C0DD97',
    },
    images: { preview: 'preview.png', hero: 'hero.png', mascot: 'sprite_anim.png' },
  }, {
    '--dsw-alias-bg-base': '#EAF3DE',
    '--dsw-alias-bg-layer-1': '#F4F8EC',
    '--dsw-alias-bg-layer-2': '#C0DD97',
    '--dsw-alias-bg-overlay': '#F4F8EC',
    '--dsw-alias-border-l1': '#C0DD97',
    '--dsw-alias-border-l2': '#97C459',
    '--dsw-alias-brand-primary': '#639922',
    '--dsw-alias-brand-hover': '#97C459',
    '--dsw-alias-label-primary': '#3B6D11',
    '--dsw-alias-label-secondary': '#5F8A3D',
    '--dsw-alias-state-error-primary': '#BA7517',
    '--dsw-alias-state-success-primary': '#639922',
    '--dsw-alias-state-warn-primary': '#FBBF24',
    '--dsw-specific-sidebar-fill': '#EAF3DE',
  }),
  entry({
    id: 'yinyue-lunar',
    name: '银月 · 月华',
    description: '银蓝仙光 · 月华冷辉 — 银月狼族器灵的星河意境，月牙法器光标 + 星辉流转特效。',
    colorScheme: 'dark',
    version: '0.1.0',
    keywords: ['fanren', 'xianxia', 'lunar', 'silver-blue', 'dark'],
    palette: {
      primary: '#85B7EB',
      background: '#042C53',
      surface: '#0C447C',
      text: '#E6F1FB',
      border: '#185FA5',
    },
    images: { preview: 'preview.png', hero: 'hero.png', mascot: 'sprite_anim.png' },
  }, {
    '--dsw-alias-bg-base': '#042C53',
    '--dsw-alias-bg-layer-1': '#0C447C',
    '--dsw-alias-bg-layer-2': '#185FA5',
    '--dsw-alias-bg-overlay': '#0C447C',
    '--dsw-alias-border-l1': '#185FA5',
    '--dsw-alias-border-l2': '#378ADD',
    '--dsw-alias-brand-primary': '#85B7EB',
    '--dsw-alias-brand-hover': '#B5D4F4',
    '--dsw-alias-label-primary': '#E6F1FB',
    '--dsw-alias-label-secondary': '#B5D4F4',
    '--dsw-alias-state-error-primary': '#F09595',
    '--dsw-alias-state-success-primary': '#5DCAA5',
    '--dsw-alias-state-warn-primary': '#FAC775',
    '--dsw-specific-sidebar-fill': '#042C53',
  }),
  entry({
    id: 'nangongwan-moon',
    name: '南宫婉 · 寒梅',
    description: '月白清辉 · 朱雀赤纹 — 掩月宗女修的寒梅意境，白玉簪光标 + 朱雀火纹特效。',
    colorScheme: 'light',
    version: '0.1.0',
    keywords: ['fanren', 'xianxia', 'plum', 'moon-white', 'light'],
    palette: {
      primary: '#B4B2A9',
      background: '#F1EFE8',
      surface: '#FFFFFF',
      text: '#444441',
      border: '#D3D1C7',
    },
    images: { preview: 'preview.png', hero: 'hero.png', mascot: 'sprite_anim.png' },
  }, {
    '--dsw-alias-bg-base': '#F1EFE8',
    '--dsw-alias-bg-layer-1': '#FFFFFF',
    '--dsw-alias-bg-layer-2': '#D3D1C7',
    '--dsw-alias-bg-overlay': '#F1EFE8',
    '--dsw-alias-border-l1': '#D3D1C7',
    '--dsw-alias-border-l2': '#B4B2A9',
    '--dsw-alias-brand-primary': '#B4B2A9',
    '--dsw-alias-brand-hover': '#888780',
    '--dsw-alias-label-primary': '#444441',
    '--dsw-alias-label-secondary': '#5F5E5A',
    '--dsw-alias-state-error-primary': '#E24B4A',
    '--dsw-alias-state-success-primary': '#97C459',
    '--dsw-alias-state-warn-primary': '#FBBF24',
    '--dsw-specific-sidebar-fill': '#F1EFE8',
  }),
  entry({
    id: 'ziling-mystic',
    name: '紫灵 · 紫霞',
    description: '暗紫妖魅 · 紫纱流霞 — 妙音门第一美女的紫雾意境，紫纱面饰光标 + 妙音声波特效。',
    colorScheme: 'dark',
    version: '0.1.0',
    keywords: ['fanren', 'xianxia', 'mystic', 'purple', 'dark'],
    palette: {
      primary: '#AFA9EC',
      background: '#26215C',
      surface: '#3C3489',
      text: '#EEEDFE',
      border: '#534AB7',
    },
    images: { preview: 'preview.png', hero: 'hero.png', mascot: 'sprite_anim.png' },
  }, {
    '--dsw-alias-bg-base': '#26215C',
    '--dsw-alias-bg-layer-1': '#3C3489',
    '--dsw-alias-bg-layer-2': '#534AB7',
    '--dsw-alias-bg-overlay': '#3C3489',
    '--dsw-alias-border-l1': '#534AB7',
    '--dsw-alias-border-l2': '#7F77DD',
    '--dsw-alias-brand-primary': '#AFA9EC',
    '--dsw-alias-brand-hover': '#CECBF6',
    '--dsw-alias-label-primary': '#EEEDFE',
    '--dsw-alias-label-secondary': '#CECBF6',
    '--dsw-alias-state-error-primary': '#F09595',
    '--dsw-alias-state-success-primary': '#5DCAA5',
    '--dsw-alias-state-warn-primary': '#FAC775',
    '--dsw-specific-sidebar-fill': '#26215C',
  }),
])
