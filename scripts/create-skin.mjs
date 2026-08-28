#!/usr/bin/env node
/**
 * create-skin.mjs — 皮肤包脚手架（v0.11 开发者体验）。
 *
 * 用法：
 *   pnpm gen:skin -- my-skin --name "我的皮肤" [--en "My Skin"]
 *                    [--scheme dark|light] [--primary "#6366f1"] [--author "你的名字"]
 *
 * 生成 packages/skins/<id>/：
 *   skin.json          完整 manifest（palette/tokens 按 primary×scheme 自动推导）
 *   assets/preview.png 800×600 渐变占位图（后续替换为真实渲染图）
 *
 * 之后：`pnpm gen:skin-data` 自动进画廊注册表，`pnpm validate-skins` 过门禁。
 * 创作指南见 docs/skin-authoring.md。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKINS_DIR = resolve(__dirname, '..', 'packages', 'skins')

const ID_REGEX = /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/

// ── 颜色工具（零依赖）─────────────────────────────────────────────
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (m === null) throw new Error(`颜色 "${hex}" 不是 #RRGGBB 格式`)
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
const toHex = ({ r, g, b }) => `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`
/** 向目标色混合 t 比例（t=0 原色，t=1 目标色）。 */
function mix(hex, target, t) {
  const a = hexToRgb(hex); const b = hexToRgb(target)
  return toHex({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t })
}
const lighten = (hex, t) => mix(hex, '#ffffff', t)
const darken = (hex, t) => mix(hex, '#000000', t)

/** 按 primary × scheme 推导完整 palette + token 表（与内置 18 款同构）。 */
function deriveTheme(primary, scheme) {
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

// ── 零依赖 PNG：800×600 对角渐变占位图（真实渲染图就绪前的卡片缩略）───
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()
function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ (bytes[i] ?? 0)) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
/** 生成渐变占位 PNG（背景 → primary 对角渐变，4:3 与文档预览图规格一致）。 */
function gradientPng(primaryHex, backgroundHex) {
  const W = 800; const H = 600
  const from = hexToRgb(backgroundHex); const to = hexToRgb(primaryHex)
  const raw = Buffer.alloc(H * (1 + W * 3))
  let o = 0
  for (let y = 0; y < H; y += 1) {
    raw[o] = 0; o += 1 // filter: none
    for (let x = 0; x < W; x += 1) {
      const t = (x / W + y / H) / 2
      raw[o] = clamp(from.r + (to.r - from.r) * t); o += 1
      raw[o] = clamp(from.g + (to.g - from.g) * t); o += 1
      raw[o] = clamp(from.b + (to.b - from.b) * t); o += 1
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── 参数解析 ─────────────────────────────────────────────────────
function fail(msg) {
  console.error(`✗ ${msg}`)
  console.error('用法: pnpm gen:skin -- <id> --name "中文名" [--en "English"] [--scheme dark|light] [--primary "#6366f1"] [--author "名字"]')
  process.exit(1)
}

const args = process.argv.slice(2).filter(a => a !== '--')
const id = args[0] && !args[0].startsWith('--') ? args[0] : undefined
if (id === undefined) fail('缺少皮肤 id（kebab-case，如 my-skin）')
if (!ID_REGEX.test(id)) fail(`id "${id}" 不符合 kebab-case 规则（小写字母数字连字符）`)

function opt(name) {
  const i = args.indexOf(`--${name}`)
  return i !== -1 ? args[i + 1] : undefined
}

const nameZh = opt('name')
if (nameZh === undefined) fail('缺少 --name "中文名"')
const nameEn = opt('en') ?? nameZh
const scheme = opt('scheme') ?? 'dark'
if (scheme !== 'dark' && scheme !== 'light') fail(`--scheme 必须是 dark 或 light（得到 "${scheme}"）`)
const primary = opt('primary') ?? (scheme === 'dark' ? '#6366f1' : '#3b82f6')
hexToRgb(primary) // 早期校验
const author = opt('author') ?? 'DSH Skin Studio'

const dir = join(SKINS_DIR, id)
if (existsSync(dir)) fail(`皮肤目录已存在: ${dir}`)

// ── 生成 ─────────────────────────────────────────────────────────
const { palette, tokens } = deriveTheme(primary, scheme)
const manifest = {
  id,
  name: nameZh,
  version: '0.1.0',
  author: { name: author },
  description: `${nameZh}（${nameEn}）— 由脚手架生成的皮肤骨架，编辑本文件完善介绍。`,
  license: 'MIT',
  colorScheme: scheme,
  preview: 'preview.png',
  keywords: ['community', scheme],
  palette,
  specVersion: '0.2.0',
  dshVersion: '>=0.1.0-rc.5',
  tokens,
}

mkdirSync(join(dir, 'assets'), { recursive: true })
writeFileSync(join(dir, 'skin.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
writeFileSync(join(dir, 'assets', 'preview.png'), gradientPng(primary, palette.background))

console.log(`✓ 皮肤包已生成: packages/skins/${id}`)
console.log(`  skin.json（${scheme} · ${Object.keys(tokens).length} tokens）+ assets/preview.png（800×600 占位渐变）`)
console.log('')
console.log('下一步：')
console.log(`  1. pnpm gen:skin-data        # 自动进画廊注册表（builtinSkins.gen.ts）`)
console.log(`  2. pnpm validate-skins       # 发布门禁（应显示 19 款全过）`)
console.log(`  3. 替换 assets/preview.png 为真实渲染图；可选补充 hero.png（1024×1536）、`)
console.log(`     sprite_anim.png（2×2 四帧）、cursors/*.svg、tiers/t0-t4/ 分档资产`)
console.log(`  4. 编辑 skin.json 的 description / keywords / author 完善信息`)
console.log(`  创作指南：docs/skin-authoring.md`)
