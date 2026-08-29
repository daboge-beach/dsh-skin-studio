/**
 * pngEncoder — 零依赖 PNG 生成（浏览器端，皮肤工坊占位预览图用）。
 *
 * IDAT 优先走原生 CompressionStream('deflate')（zlib 封装，与 PNG 规范
 * 匹配）；环境不支持时退回「stored 块」deflate 编码（BTYPE=00 无压缩，
 * 纯字节拼接，每块 ≤65535 字节）——不依赖任何压缩 API，永远可用。
 * CRC32 查表与 zipWriter 同款。
 */
import { hexToRgb } from './derive.ts'

const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)))

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) c = (CRC_TABLE[(c ^ (bytes[i] ?? 0)) & 0xff] ?? 0) ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/** stored 块 deflate（BTYPE=00 + zlib 封装头尾，兜底编码器，同步可用）。 */
export function storedDeflate(data: Uint8Array): Uint8Array {
  const blocks = Math.ceil(data.length / 65535) || 1
  const body = new Uint8Array(data.length + blocks * 5)
  const view = new DataView(body.buffer)
  let src = 0
  let dst = 0
  for (let i = 0; i < blocks; i += 1) {
    const len = Math.min(65535, data.length - src)
    body[dst] = i === blocks - 1 ? 1 : 0 // BFINAL + BTYPE=00
    view.setUint16(dst + 1, len, true)
    view.setUint16(dst + 3, ~len & 0xffff, true)
    dst += 5
    body.set(data.subarray(src, src + len), dst)
    src += len
    dst += len
  }
  // adler32（zlib 尾）
  let a = 1
  let b = 0
  for (let i = 0; i < data.length; i += 1) {
    a = (a + (data[i] ?? 0)) % 65521
    b = (b + a) % 65521
  }
  // zlib 封装：CMF/FLG 头（0x78 0x9C，32K 窗口）+ deflate + adler32
  const out = new Uint8Array(2 + body.length + 4)
  out[0] = 0x78
  out[1] = 0x9c
  out.set(body, 2)
  new DataView(out.buffer).setUint32(2 + body.length, ((b << 16) | a) >>> 0)
  return out
}

async function zlibDeflate(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

/** 原始 RGB（逐行 filter 0）→ PNG 字节。 */
export async function encodePngRgb(raw: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13)
  const iv = new DataView(ihdr.buffer)
  iv.setUint32(0, width)
  iv.setUint32(4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  const deflated = (await zlibDeflate(raw)) ?? storedDeflate(raw)
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // 签名
    ...chunk('IHDR', ihdr),
    ...chunk('IDAT', deflated),
    ...chunk('IEND', new Uint8Array(0)),
  ])
}

/** 背景 → 品牌色对角渐变 PNG（默认 800×600，与预览图规格一致）。 */
export async function gradientPng(primaryHex: string, backgroundHex: string, width = 800, height = 600): Promise<Uint8Array> {
  const from = hexToRgb(backgroundHex)
  const to = hexToRgb(primaryHex)
  const raw = new Uint8Array(height * (1 + width * 3))
  let o = 0
  for (let y = 0; y < height; y += 1) {
    raw[o] = 0 // filter: none
    o += 1
    for (let x = 0; x < width; x += 1) {
      const t = (x / width + y / height) / 2
      raw[o] = clamp(from.r + (to.r - from.r) * t)
      raw[o + 1] = clamp(from.g + (to.g - from.g) * t)
      raw[o + 2] = clamp(from.b + (to.b - from.b) * t)
      o += 3
    }
  }
  return encodePngRgb(raw, width, height)
}
