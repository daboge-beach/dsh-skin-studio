import { describe, expect, it } from 'vitest'
import { buildZip } from './zipBuilder.ts'
import { findEntry, unzip } from '../src/client/registry/unzip.ts'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

describe('unzip', () => {
  it('解压 STORE 条目并保持内容一致', async () => {
    const bytes = buildZip([{ name: 'skin.json', data: encoder.encode('{"id":"a"}'), method: 0 }])
    const files = await unzip(bytes)
    expect(decoder.decode(files.get('skin.json') ?? new Uint8Array())).toBe('{"id":"a"}')
  })

  it('解压 DEFLATE 条目并保持内容一致（含二进制）', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5])
    const bytes = buildZip([
      { name: 'skin.json', data: encoder.encode('hello'), method: 8 },
      { name: 'assets/preview.png', data: png, method: 8 },
      { name: 'assets/', data: new Uint8Array(), method: 0 }, // 目录条目应被跳过
    ])
    const files = await unzip(bytes)
    expect(files.size).toBe(2)
    expect(decoder.decode(files.get('skin.json') ?? new Uint8Array())).toBe('hello')
    expect(Array.from(files.get('assets/preview.png') ?? [])).toEqual(Array.from(png))
  })

  it('损坏字节抛出可读错误', async () => {
    await expect(unzip(new Uint8Array(64).fill(0x7f))).rejects.toThrow(/zip/)
  })
})

describe('findEntry', () => {
  it('直接命中包根路径', () => {
    const files = new Map([['skin.json', new Uint8Array()]])
    expect(findEntry(files, 'skin.json')).toBe('skin.json')
  })

  it('命中子目录内的路径', () => {
    const files = new Map([['my-skin/skin.json', new Uint8Array()]])
    expect(findEntry(files, 'skin.json')).toBe('my-skin/skin.json')
  })

  it('未命中返回 undefined', () => {
    expect(findEntry(new Map(), 'skin.json')).toBeUndefined()
  })
})
