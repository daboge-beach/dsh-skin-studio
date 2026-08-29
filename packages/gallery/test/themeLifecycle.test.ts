import { afterEach, describe, expect, it } from 'vitest'
import { createMockHost } from '../dev/mockHost.ts'
import { apply as applyGallery } from '../src/client/index.ts'
import { skinRegistry } from '../src/client/registry/skinRegistry.ts'
import { ensureThemeRegistered, unregisterGalleryTheme } from '../src/client/themeBridge.ts'
import type { SkinEntry } from '../src/client/registry/types.ts'

const MANIFEST = {
  id: 'lifecycle-fox',
  name: '生命周期狐',
  version: '0.1.0',
  author: { name: 'tester' },
  description: '生命周期回归测试皮肤',
  colorScheme: 'dark',
  license: 'MIT',
  palette: { primary: '#85B7EB', background: '#0F1B2E', surface: '#1E2D4A', text: '#E6F1FB', border: '#378ADD' },
  assets: { preview: 'assets/preview.png' },
}

afterEach(async () => {
  for (const skin of await skinRegistry.list('uploaded')) {
    await skinRegistry.remove(skin.id)
  }
})

describe('主题注册生命周期（工坊/上传真实调用链）', () => {
  it('工坊式安装（installFromParts）不暗中注册主题、不改变当前激活主题', async () => {
    const host = createMockHost([])
    applyGallery(host.ctx)
    await skinRegistry.restored() // 等启动恢复循环落定（真实应用为先启动后安装）
    const before = host.ctx.theme.getTheme()
    const beforeIds = before.themes.map(t => t.id)

    const entry = await skinRegistry.installFromParts(MANIFEST, new Map([['assets/preview.png', new Uint8Array([1])]]))
    expect(entry.source).toBe('upload')

    const after = host.ctx.theme.getTheme()
    // 不自动应用：active 不变
    expect(after.active.id).toBe(before.active.id)
    // 不暗中注册：已安装但主题表未新增
    expect(after.themes.map(t => t.id)).toEqual(beforeIds)
    // 已进「已上传」列表
    expect((await skinRegistry.list('uploaded')).map(s => s.id)).toContain('lifecycle-fox')
  })

  it('ensureThemeRegistered 幂等注册；unregisterGalleryTheme 反注册无残留', async () => {
    const host = createMockHost([])
    applyGallery(host.ctx)
    await skinRegistry.restored() // 等启动恢复循环落定（真实应用为先启动后安装）
    const entry = await skinRegistry.installFromParts(MANIFEST, new Map())
    const skin = entry as SkinEntry

    ensureThemeRegistered(host.ctx, skin)
    expect(host.ctx.theme.getTheme().themes.map(t => t.id)).toContain('lifecycle-fox')

    // 幂等：重复 ensure 不产生重复主题
    ensureThemeRegistered(host.ctx, skin)
    expect(host.ctx.theme.getTheme().themes.filter(t => t.id === 'lifecycle-fox')).toHaveLength(1)

    // 删除路径：unregister 后主题表无残留
    unregisterGalleryTheme(host.ctx, skin)
    expect(host.ctx.theme.getTheme().themes.map(t => t.id)).not.toContain('lifecycle-fox')

    // 未注册过的皮肤 unregister 是安全 no-op
    expect(() => unregisterGalleryTheme(host.ctx, { ...skin, id: 'never-registered' })).not.toThrow()
  })

  it('更新安装后注册的是新版本主题；删除后主题与列表同时干净', async () => {
    const host = createMockHost([])
    applyGallery(host.ctx)
    await skinRegistry.restored() // 等启动恢复循环落定（真实应用为先启动后安装）

    await skinRegistry.installFromParts(MANIFEST, new Map())
    const v2 = await skinRegistry.installFromParts(
      { ...MANIFEST, version: '0.2.0', tokens: { '--dsw-alias-bg-base': '#101020' } },
      new Map(),
    )
    expect(v2.version).toBe('0.2.0')

    ensureThemeRegistered(host.ctx, v2)
    const registered = host.ctx.theme.getTheme().themes.find(t => t.id === 'lifecycle-fox')
    expect(registered).toBeDefined()

    // GalleryPanel 删除路径的同款调用序列
    await skinRegistry.remove('lifecycle-fox')
    unregisterGalleryTheme(host.ctx, v2)
    expect(host.ctx.theme.getTheme().themes.map(t => t.id)).not.toContain('lifecycle-fox')
    expect((await skinRegistry.list('uploaded')).map(s => s.id)).not.toContain('lifecycle-fox')
  })
})
