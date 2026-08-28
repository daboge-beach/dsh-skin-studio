import { describe, expect, it } from 'vitest'
import { buildZip } from './zipBuilder.ts'
import { DEFAULT_ZIP_LIMITS, unzip } from '../src/client/registry/unzip.ts'
import { assertImageBounds, imageDimensions, MAX_IMAGE_DIMENSION } from '../src/client/registry/imageGuard.ts'
import { zipStore } from '../src/client/registry/zipWriter.ts'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

describe('unzip 安全限制', () => {
  it('条目数超限被拒', async () => {
    const bytes = buildZip([
      { name: 'a.json', data: encoder.encode('1'), method: 0 },
      { name: 'b.json', data: encoder.encode('2'), method: 0 },
    ])
    await expect(unzip(bytes, { ...DEFAULT_ZIP_LIMITS, maxEntries: 1 })).rejects.toThrow(/条目数/)
  })

  it('单条目解压后超限被拒（解压前预检）', async () => {
    const bytes = buildZip([{ name: 'big.bin', data: new Uint8Array(1000), method: 0 }])
    await expect(unzip(bytes, { ...DEFAULT_ZIP_LIMITS, maxEntryUncompressed: 100 })).rejects.toThrow(/单文件上限/)
  })

  it('总解压量超限被拒', async () => {
    const bytes = buildZip([
      { name: 'a.bin', data: new Uint8Array(700), method: 0 },
      { name: 'b.bin', data: new Uint8Array(700), method: 0 },
    ])
    await expect(unzip(bytes, { ...DEFAULT_ZIP_LIMITS, maxTotalUncompressed: 1000 })).rejects.toThrow(/总量/)
  })

  it('异常压缩比（疑似 zip bomb）被拒', async () => {
    // 压缩后 ~20KB（>4KB 门槛）的 deflated 条目解出 20MB（比例 ~1000:1）
    const compressible = new Uint8Array(20_000_000).fill(0x61)
    const bytes = buildZip([{ name: 'bomb.bin', data: compressible, method: 8 }])
    await expect(unzip(bytes, { ...DEFAULT_ZIP_LIMITS, maxCompressionRatio: 50 })).rejects.toThrow(/zip bomb|压缩比/)
  })

  it('绝对路径条目被拒', async () => {
    const bytes = buildZip([{ name: '/etc/passwd', data: encoder.encode('x'), method: 0 }])
    await expect(unzip(bytes)).rejects.toThrow(/绝对路径/)
  })

  it('.. 路径穿越被拒', async () => {
    const bytes = buildZip([{ name: 'a/../../evil.json', data: encoder.encode('x'), method: 0 }])
    await expect(unzip(bytes)).rejects.toThrow(/\.\./)
  })

  it('目录深度超限被拒', async () => {
    const bytes = buildZip([{ name: 'a/b/c/d/e/f/g/h/i/j.json', data: encoder.encode('x'), method: 0 }])
    await expect(unzip(bytes)).rejects.toThrow(/深度/)
  })

  it('压缩包本身体积超限被拒', async () => {
    const bytes = buildZip([{ name: 'x.bin', data: new Uint8Array(2000), method: 0 }])
    await expect(unzip(bytes, { ...DEFAULT_ZIP_LIMITS, maxArchiveBytes: 1000 })).rejects.toThrow(/上限/)
  })

  it('正常小包不受影响（默认限制）', async () => {
    const bytes = buildZip([
      { name: 'skin.json', data: encoder.encode('{"id":"ok"}'), method: 8 },
      { name: 'assets/a/b.png', data: new Uint8Array([1, 2, 3]), method: 0 },
    ])
    const files = await unzip(bytes)
    expect(decoder.decode(files.get('skin.json') ?? new Uint8Array())).toBe('{"id":"ok"}')
  })
})

describe('imageGuard 图片尺寸', () => {
  /** 构造带指定宽高的最小 PNG 头（签名 + IHDR 长度/标记 + 宽高）。 */
  function fakePng(width: number, height: number): Uint8Array {
    const b = new Uint8Array(32)
    b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    new DataView(b.buffer).setUint32(16, width)
    new DataView(b.buffer).setUint32(20, height)
    return b
  }

  it('解析 PNG 宽高', () => {
    expect(imageDimensions(fakePng(1920, 1080))).toEqual({ width: 1920, height: 1080 })
  })

  it('解析 GIF 宽高', () => {
    const b = new Uint8Array(13)
    b.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // GIF89a
    new DataView(b.buffer).setUint16(6, 640, true)
    new DataView(b.buffer).setUint16(8, 480, true)
    expect(imageDimensions(b)).toEqual({ width: 640, height: 480 })
  })

  it('解析 JPEG 宽高（SOF0）', () => {
    const b = new Uint8Array([
      0xff, 0xd8,              // SOI
      0xff, 0xc0, 0x00, 0x0b,  // SOF0 段长 11
      0x08,                    // 精度
      0x07, 0xb0,              // 高 1968
      0x0a, 0x80,              // 宽 2688
    ])
    expect(imageDimensions(b)).toEqual({ width: 2688, height: 1968 })
  })

  it('未知格式返回 null（交给体积限制兜底）', () => {
    expect(imageDimensions(new Uint8Array([1, 2, 3, 4]))).toBeNull()
  })

  it('超大像素图被拒（可读错误带路径）', () => {
    const huge = new Map([['assets/bg.png', fakePng(MAX_IMAGE_DIMENSION + 1, 100)]])
    expect(() => assertImageBounds(huge)).toThrow(/assets\/bg\.png/)
  })

  it('正常尺寸与 SVG 放行', () => {
    expect(() => assertImageBounds(new Map<string, Uint8Array>([
      ['assets/bg.png', fakePng(1920, 1080)],
      ['assets/cursor.svg', new Uint8Array([0x3c, 0x73, 0x76, 0x67])],
    ]))).not.toThrow()
  })
})

describe('zipWriter 导出', () => {
  it('zipStore → unzip 往返内容一致（UTF-8 文件名 + 二进制）', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6, 7, 8])
    const zip = zipStore([
      { name: 'skin.json', bytes: encoder.encode('{"id":"round-trip","name":"往返"}') },
      { name: 'assets/预览.png', bytes: png },
    ])
    const files = await unzip(zip)
    expect(decoder.decode(files.get('skin.json') ?? new Uint8Array())).toBe('{"id":"round-trip","name":"往返"}')
    expect(Array.from(files.get('assets/预览.png') ?? [])).toEqual(Array.from(png))
  })

  it('空包可往返', async () => {
    const files = await unzip(zipStore([]))
    expect(files.size).toBe(0)
  })
})
