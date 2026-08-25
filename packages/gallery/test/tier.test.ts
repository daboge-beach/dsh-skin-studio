/**
 * tierPower.effortTier / tierSync 排序映射的单元测试。
 */
import { describe, expect, it } from 'vitest'
import { effortTier } from '../src/client/tierPower.ts'
import { syncTierToEffort } from '../src/client/tierSync.ts'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

describe('effortTier（等级名 → 档位强度）', () => {
  it('英文档位强度递进', () => {
    expect(effortTier('low')).toBe(0)
    expect(effortTier('default')).toBe(0)
    expect(effortTier('medium')).toBe(1)
    expect(effortTier('high')).toBe(2)
    expect(effortTier('max')).toBe(3)
    expect(effortTier('ultra')).toBe(3)
    expect(effortTier('thinking')).toBe(3)
  })

  it('中文档位', () => {
    expect(effortTier('深度思考')).toBe(3)
    expect(effortTier('快速')).toBe(0)
    expect(effortTier('标准')).toBe(0)
  })

  it('未识别返回 null（上层保持当前档位不突变）', () => {
    expect(effortTier('turbo-deluxe')).toBeNull()
    expect(effortTier('')).toBeNull()
  })
})

describe('syncTierToEffort（防御式降级）', () => {
  const known = (id: string): number | null => effortTier(id)

  it('服务缺失时静默（不抛错）', () => {
    const ctx = { modelDirectories: undefined, sessions: undefined } as unknown as ClientContext
    expect(() => { syncTierToEffort(ctx, 2, known) }).not.toThrow()
  })

  it('efforts 按强度排序后取目标档位并提交', async () => {
    const calls: Array<{ provider: string; model: string; reasoningEffort?: string }> = []
    const dir = {
      store: {
        getSnapshot: () => ({
          current: { provider: 'p1', model: 'm1', reasoningEffort: 'low' },
          groups: [{ id: 'p1', models: [{ id: 'm1', reasoning: { efforts: [{ id: 'max' }, { id: 'low' }, { id: 'high' }] } }] }],
        }),
      },
      select: async (s: { provider: string; model: string; reasoningEffort?: string }) => { calls.push(s) },
    }
    const ctx = {
      modelDirectories: { directoryFor: () => dir },
      sessions: { list: { getSnapshot: () => ({ current: { id: 's1' } }) } },
    } as unknown as ClientContext
    syncTierToEffort(ctx, 3, known)
    await new Promise(r => { setTimeout(r, 0) })
    expect(calls).toEqual([{ provider: 'p1', model: 'm1', reasoningEffort: 'max' }])
  })

  it('当前已是目标等级时不重复提交', async () => {
    const calls: unknown[] = []
    const dir = {
      store: {
        getSnapshot: () => ({
          current: { provider: 'p1', model: 'm1', reasoningEffort: 'high' },
          groups: [{ id: 'p1', models: [{ id: 'm1', reasoning: { efforts: [{ id: 'low' }, { id: 'high' }] } }] }],
        }),
      },
      select: async (s: unknown) => { calls.push(s) },
    }
    const ctx = {
      modelDirectories: { directoryFor: () => dir },
      sessions: { list: { getSnapshot: () => ({ current: { id: 's1' } }) } },
    } as unknown as ClientContext
    syncTierToEffort(ctx, 2, known)
    await new Promise(r => { setTimeout(r, 0) })
    expect(calls).toEqual([])
  })

  it('档位超出等级数取最高档', async () => {
    const calls: Array<{ reasoningEffort?: string }> = []
    const dir = {
      store: {
        getSnapshot: () => ({
          current: { provider: 'p', model: 'm', reasoningEffort: 'low' },
          groups: [{ id: 'p', models: [{ id: 'm', reasoning: { efforts: [{ id: 'low' }, { id: 'high' }] } }] }],
        }),
      },
      select: async (s: { reasoningEffort?: string }) => { calls.push(s) },
    }
    const ctx = {
      modelDirectories: { directoryFor: () => dir },
      sessions: { list: { getSnapshot: () => ({ current: { id: 's' } }) } },
    } as unknown as ClientContext
    syncTierToEffort(ctx, 4, known)
    await new Promise(r => { setTimeout(r, 0) })
    expect(calls).toEqual([{ provider: 'p', model: 'm', reasoningEffort: 'high' }])
  })
})
