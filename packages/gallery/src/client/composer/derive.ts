/**
 * derive — 皮肤工坊的纯逻辑层（v0.15 无代码编辑器）。
 *
 * 品牌色 × 色系 → 完整 14 token 主题（与脚手架 create-skin.mjs 同一套
 * 推导规则，浏览器/Node 通用）；WCAG 对比度计算与可读性判定。全部
 * 纯函数，无 DOM 依赖，单测直接覆盖。
 */

export type Scheme = 'light' | 'dark'

export interface Palette {
  primary: string
  background: string
  surface: string
  text: string
  border: string
}

export interface DerivedTheme {
  palette: Palette
  tokens: Record<string, string>
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  const hex6 = m?.[1]
  if (hex6 === undefined) throw new Error(`颜色 "${hex}" 不是 #RRGGBB 格式`)
  const n = parseInt(hex6, 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)))

export function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`
}

/** 向目标色混合 t 比例（t=0 原色，t=1 目标色）。 */
export function mix(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  return toHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t })
}

export const lighten = (hex: string, t: number): string => mix(hex, '#ffffff', t)
export const darken = (hex: string, t: number): string => mix(hex, '#000000', t)

/** 品牌色 × 色系 → 完整 alias token 表（与内置 18 款同构的 14 项）。 */
export function deriveTheme(primary: string, scheme: Scheme): DerivedTheme {
  if (scheme === 'light') {
    const background = mix('#f8fafc', primary, 0.04)
    const surface = '#ffffff'
    const layer2 = mix(background, primary, 0.08)
    const text = darken(mix(primary, '#1e293b', 0.72), 0.1)
    const border = mix('#e2e8f0', primary, 0.15)
    return {
      palette: { primary, background, surface, text, border },
      tokens: {
        '--dsw-alias-bg-base': background,
        '--dsw-alias-bg-layer-1': surface,
        '--dsw-alias-bg-layer-2': layer2,
        '--dsw-alias-bg-overlay': surface,
        '--dsw-alias-border-l1': border,
        '--dsw-alias-border-l2': darken(border, 0.12),
        '--dsw-alias-brand-primary': primary,
        '--dsw-alias-brand-hover': darken(primary, 0.1),
        '--dsw-alias-label-primary': text,
        '--dsw-alias-label-secondary': mix(text, background, 0.45),
        '--dsw-alias-state-error-primary': '#ef4444',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#f59e0b',
        '--dsh-specific-sidebar-fill': layer2,
      },
    }
  }
  const background = mix('#0f172a', primary, 0.1)
  const surface = lighten(background, 0.07)
  const layer2 = lighten(background, 0.14)
  const text = '#f1f5f9'
  const border = mix(lighten(background, 0.18), primary, 0.25)
  return {
    palette: { primary, background, surface, text, border },
    tokens: {
      '--dsw-alias-bg-base': background,
      '--dsw-alias-bg-layer-1': surface,
      '--dsw-alias-bg-layer-2': layer2,
      '--dsw-alias-bg-overlay': surface,
      '--dsw-alias-border-l1': border,
      '--dsw-alias-border-l2': lighten(border, 0.12),
      '--dsw-alias-brand-primary': primary,
      '--dsw-alias-brand-hover': lighten(primary, 0.25),
      '--dsw-alias-label-primary': text,
      '--dsw-alias-label-secondary': mix(text, background, 0.55),
      '--dsw-alias-state-error-primary': '#f87171',
      '--dsw-alias-state-success-primary': '#34d399',
      '--dsw-alias-state-warn-primary': '#fbbf24',
      '--dsh-specific-sidebar-fill': darken(background, 0.04),
    },
  }
}

// ── WCAG 对比度 ────────────────────────────────────────────────────

/** 8bit 通道 → 线性亮度分量（WCAG 2.x）。 */
function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** 相对亮度 L（0-1）。 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** 对比度比值（1-21；白/黑 = 21）。 */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA)
  const lb = relativeLuminance(hexB)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export type ContrastLevel = 'good' | 'ok' | 'poor'

/** 可读性级别：≥4.5 良好（AA 正文）、≥3 勉强（大字 AA）、<3 差（不可读风险）。 */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 4.5) return 'good'
  if (ratio >= 3) return 'ok'
  return 'poor'
}

export interface ContrastCheck {
  pair: string
  ratio: number
  level: ContrastLevel
}

/** 关键可读性对检查（正文/背景、正文/卡片、品牌色/背景）。 */
export function checkReadability(tokens: Record<string, string>): ContrastCheck[] {
  const bg = tokens['--dsw-alias-bg-base'] ?? '#000000'
  const surface = tokens['--dsw-alias-bg-layer-1'] ?? bg
  const text = tokens['--dsw-alias-label-primary'] ?? '#ffffff'
  const brand = tokens['--dsw-alias-brand-primary'] ?? text
  const pairs: Array<[string, string, string]> = [
    ['正文 / 窗口底', text, bg],
    ['正文 / 卡片面', text, surface],
    ['品牌色 / 窗口底', brand, bg],
  ]
  return pairs.map(([pair, a, b]) => {
    const ratio = contrastRatio(a, b)
    return { pair, ratio, level: contrastLevel(ratio) }
  })
}
