import { describe, expect, it } from 'vitest'
import { validateSkinManifest } from '../src/client/registry/validate.ts'
import type { UploadedSkinManifest } from '../src/client/registry/types.ts'

function baseManifest(overrides: Partial<UploadedSkinManifest> = {}): UploadedSkinManifest {
  return {
    id: 'my-skin',
    name: 'My Skin',
    version: '1.0.0',
    author: 'tester',
    description: '测试皮肤',
    colorScheme: 'dark',
    keywords: ['test'],
    palette: {
      primary: '#60a5fa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      border: '#334155',
    },
    tokens: {
      '--dsw-alias-bg-base': '#0f172a',
      '--dsw-alias-brand-primary': 'var(--dsw-static-blue-400)',
    },
    ...overrides,
  }
}

describe('validateSkinManifest', () => {
  it('合法 manifest 通过', () => {
    const result = validateSkinManifest(baseManifest())
    expect(result.passed).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('缺少必填字段报具体字段名', () => {
    const manifest = baseManifest()
    delete (manifest as Partial<UploadedSkinManifest>).description
    const result = validateSkinManifest(manifest)
    expect(result.passed).toBe(false)
    expect(result.errors.join()).toContain('缺少必填字段: description')
  })

  it('id 不符合 kebab-case 报错', () => {
    const result = validateSkinManifest(baseManifest({ id: 'My Skin!' }))
    expect(result.errors.join()).toContain('kebab-case')
  })

  it('id 占用内置保留字报错', () => {
    for (const reserved of ['system', 'light', 'dark']) {
      expect(validateSkinManifest(baseManifest({ id: reserved })).passed).toBe(false)
    }
  })

  it('version 不符合 SemVer 报错', () => {
    const result = validateSkinManifest(baseManifest({ version: '1.0' }))
    expect(result.errors.join()).toContain('SemVer')
  })

  it('colorScheme 非法值报错', () => {
    const result = validateSkinManifest(baseManifest({ colorScheme: 'blue' as never }))
    expect(result.errors.join()).toContain('light 或 dark')
  })

  it('token 名不带 --dsw-alias/specific 前缀报错', () => {
    const result = validateSkinManifest(baseManifest({
      tokens: { '--my-own-token': '#fff' },
    }))
    expect(result.errors.join()).toContain('--dsw-alias-*')
  })

  it('token 值带注入（url()/分号/引号）被拒绝', () => {
    for (const evil of ['url(x)', '#fff; } body {', '\'"onload="', 'expression(alert(1))']) {
      const result = validateSkinManifest(baseManifest({
        tokens: { '--dsw-alias-bg-base': evil },
      }))
      expect(result.passed).toBe(false)
    }
  })

  it('token 值允许 var() / color-mix / rgb()', () => {
    const result = validateSkinManifest(baseManifest({
      tokens: {
        '--dsw-alias-brand-primary': 'var(--dsw-static-blue-400)',
        '--dsw-alias-bg-layer-1': 'color-mix(in srgb, var(--dsw-alias-bg-base) 95%, black)',
        '--dsw-alias-label-primary': 'rgb(15 23 42)',
      },
    }))
    expect(result.passed).toBe(true)
  })

  it('palette 非法 hex 报错', () => {
    const result = validateSkinManifest(baseManifest({
      palette: { ...baseManifest().palette, primary: 'not-a-color' },
    }))
    expect(result.errors.join()).toContain('palette.primary')
  })

  it('缺 palette / 缺 tokens 是警告不是错误', () => {
    const manifest = baseManifest()
    delete manifest.palette
    delete manifest.tokens
    const result = validateSkinManifest(manifest)
    expect(result.passed).toBe(true)
    expect(result.warnings.length).toBeGreaterThanOrEqual(2)
  })
})
