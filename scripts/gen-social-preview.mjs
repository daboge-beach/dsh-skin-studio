#!/usr/bin/env node
/**
 * gen-social-preview.mjs — 生成 1280×640 社交预览图（GitHub Social Preview）。
 *
 * 纯原创视觉：以项目品牌色（indigo）到暗底的斜向渐变 + 三条皮肤系列色带
 * （LOL 金 / 凡人青绿 / 梁神蓝），复用皮肤工坊的零依赖 PNG 编码器，
 * 不使用任何来源不明图片。输出 docs/social-preview.png。
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { encodePngRgb } = await import(
  '../packages/gallery/src/client/composer/pngEncoder.ts'
)

const W = 1280
const H = 640
const BG_TOP = [15, 23, 42]     // #0f172a 暗底
const BRAND = [99, 102, 241]    // #6366f1 indigo
const BANDS = [
  { y: 0.62, color: [224, 168, 63], label: 'lol' },    // LOL 金
  { y: 0.74, color: [99, 153, 34], label: 'fanren' },  // 凡人青绿
  { y: 0.86, color: [77, 107, 254], label: 'liangshen' }, // 梁神蓝
]

const raw = new Uint8Array(H * (1 + W * 3))
let o = 0
for (let y = 0; y < H; y += 1) {
  raw[o] = 0; o += 1
  const ty = y / H
  for (let x = 0; x < W; x += 1) {
    const tx = x / W
    // 主渐变：左上暗 → 右下品牌色（对角）
    const t = Math.min(1, (tx * 0.6 + ty * 0.55) * 1.15)
    let r = BG_TOP[0] + (BRAND[0] - BG_TOP[0]) * t
    let g = BG_TOP[1] + (BRAND[1] - BG_TOP[1]) * t
    let b = BG_TOP[2] + (BRAND[2] - BG_TOP[2]) * t
    // 色带：在设定 y 附近叠加系列色（左右渐隐）
    for (const band of BANDS) {
      const dy = Math.abs(ty - band.y)
      if (dy < 0.035) {
        const fadeY = 1 - dy / 0.035
        const fadeX = tx < 0.12 ? tx / 0.12 : tx > 0.88 ? (1 - tx) / 0.12 : 1
        const k = fadeY * fadeX * 0.85
        r += (band.color[0] - r) * k
        g += (band.color[1] - g) * k
        b += (band.color[2] - b) * k
      }
    }
    raw[o] = Math.max(0, Math.min(255, Math.round(r)))
    raw[o + 1] = Math.max(0, Math.min(255, Math.round(g)))
    raw[o + 2] = Math.max(0, Math.min(255, Math.round(b)))
    o += 3
  }
}

const png = await encodePngRgb(raw, W, H)
const out = join(__dirname, '..', 'docs', 'social-preview.png')
writeFileSync(out, png)
console.log(`✓ docs/social-preview.png（${W}×${H}，${(png.length / 1024).toFixed(0)}KB）`)
console.log('  上传位置：仓库 Settings → Social preview → Edit → Upload')
