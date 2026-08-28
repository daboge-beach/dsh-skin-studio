/**
 * SkinRegistry 上传链路集成测试（对应 docs/FRONTEND_REQUIREMENTS.md
 * 「上传皮肤」流程：upload → validate → install → list；IAB 无法驱动
 * 文件选择器，这里用真实 zip 字节在 Node 里走同一代码路径）。
 */
import { afterEach, describe, expect, it } from 'vitest'
import { buildZip } from './zipBuilder.ts'
import { skinRegistry } from '../src/client/registry/skinRegistry.ts'

const encoder = new TextEncoder()

const VALID_MANIFEST = {
  id: 'moon-fox',
  name: '月狐',
  version: '0.2.0',
  author: { name: 'tester', url: 'https://example.com' },
  description: '测试上传的皮肤',
  colorScheme: 'dark',
  keywords: ['test', 'dark'],
  license: 'MIT',
  homepage: 'https://example.com/moon-fox',
  palette: {
    primary: '#85B7EB',
    background: '#0F1B2E',
    surface: '#1E2D4A',
    text: '#E6F1FB',
    border: '#378ADD',
  },
  assets: {
    hero: 'assets/hero.png',
    preview: 'assets/preview.png',
    mascot: 'assets/sprite_anim.png',
  },
}

function validZip(subdir = ''): Uint8Array {
  const p = (name: string): string => (subdir === '' ? name : `${subdir}/${name}`)
  return buildZip([
    { name: p('skin.json'), data: encoder.encode(JSON.stringify(VALID_MANIFEST)) },
    { name: p('assets/preview.png'), data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]), method: 0 },
    { name: p('assets/hero.png'), data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 4, 5, 6]), method: 0 },
    { name: p('assets/sprite_anim.png'), data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 7, 8, 9]), method: 0 },
  ])
}

function toFile(bytes: Uint8Array, name = 'skin.zip'): File {
  return new File([bytes as BlobPart], name, { type: 'application/zip' })
}

afterEach(async () => {
  for (const skin of await skinRegistry.list('uploaded')) {
    await skinRegistry.remove(skin.id)
  }
})

describe('skinRegistry 上传链路', () => {
  it('非 .zip 文件直接报错', async () => {
    const file = new File([encoder.encode('{}')], 'skin.tar.gz')
    await expect(skinRegistry.upload(file)).rejects.toThrow('.zip')
  })

  it('缺少 skin.json 的 zip 报错', async () => {
    const zip = buildZip([{ name: 'readme.txt', data: encoder.encode('no manifest') }])
    await expect(skinRegistry.upload(toFile(zip))).rejects.toThrow('skin.json')
  })

  it('skin.json 语法错误报具体信息', async () => {
    const zip = buildZip([{ name: 'skin.json', data: encoder.encode('{broken') }])
    await expect(skinRegistry.upload(toFile(zip))).rejects.toThrow('解析失败')
  })

  it('合法皮肤包走完 upload → validate → install → list 全链路', async () => {
    const progress: number[] = []
    const entry = await skinRegistry.upload(toFile(validZip()), { onProgress: p => progress.push(p) })

    expect(entry.id).toBe('moon-fox')
    expect(entry.source).toBe('upload')
    expect(entry.removable).toBe(true)
    expect(entry.previewUrl).toMatch(/^blob:/)
    expect(entry.heroUrl).toMatch(/^blob:/)
    expect(entry.mascotUrl).toMatch(/^blob:/)
    expect(entry.tokenCount).toBeGreaterThan(0)
    expect(progress.at(-1)).toBe(1)

    const validation = await skinRegistry.validate(entry)
    expect(validation.passed).toBe(true)
    expect(validation.errors).toEqual([])

    await skinRegistry.install(entry)
    const uploaded = await skinRegistry.list('uploaded')
    expect(uploaded.map(s => s.id)).toContain('moon-fox')
    expect(skinRegistry.get('moon-fox')?.name).toBe('月狐')

    // 内置款不受影响
    expect((await skinRegistry.list('builtin')).length).toBe(18)
  })

  it('子目录内的皮肤包同样可解析（路径前缀剥离）', async () => {
    const entry = await skinRegistry.upload(toFile(validZip('moon-fox-pkg')))
    expect(entry.previewUrl).toMatch(/^blob:/)
    expect(entry.mascotUrl).toMatch(/^blob:/)
  })

  it('非法 manifest 的校验失败给出具体错误（画廊据此展示）', async () => {
    const manifest = { ...VALID_MANIFEST, id: 'Bad ID', version: 'x', colorScheme: 'blue' }
    const zip = buildZip([{ name: 'skin.json', data: encoder.encode(JSON.stringify(manifest)) }])
    const entry = await skinRegistry.upload(toFile(zip))
    const validation = await skinRegistry.validate(entry)
    expect(validation.passed).toBe(false)
    expect(validation.errors.join()).toContain('kebab-case')
    expect(validation.errors.join()).toContain('SemVer')
    expect(validation.errors.join()).toContain('light 或 dark')
  })

  it('重复 id 上传款按更新安装处理（原位替换，不重复）', async () => {
    const first = await skinRegistry.upload(toFile(validZip()))
    await skinRegistry.install(first)
    const second = await skinRegistry.upload(toFile(validZip()))
    await skinRegistry.install(second) // 更新安装：不再抛「已存在」
    const uploaded = await skinRegistry.list('uploaded')
    expect(uploaded.filter(s => s.id === 'moon-fox')).toHaveLength(1)
  })

  it('与内置款撞 id 的安装被拒绝', async () => {
    const hostile = buildZip([
      { name: 'skin.json', data: encoder.encode(JSON.stringify({ ...VALID_MANIFEST, id: 'aurora' })) },
      { name: 'assets/preview.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1]), method: 0 },
    ])
    const entry = await skinRegistry.upload(toFile(hostile))
    await expect(skinRegistry.install(entry)).rejects.toThrow('内置皮肤冲突')
  })

  it('remove 释放条目且内置皮肤不可删', async () => {
    const entry = await skinRegistry.upload(toFile(validZip()))
    await skinRegistry.install(entry)
    await skinRegistry.remove('moon-fox')
    expect((await skinRegistry.list('uploaded')).map(s => s.id)).not.toContain('moon-fox')
    await expect(skinRegistry.remove('aurora')).rejects.toThrow('内置皮肤不可删除')
  })
})
