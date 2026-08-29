import { beforeEach, describe, expect, it } from 'vitest'
import { clearStats, formatDuration, getStats, recordApply, recordSwitch, recordTryOn, tick } from '../src/client/usageStats.ts'

describe('usageStats（纯本地使用统计）', () => {
  beforeEach(() => {
    clearStats()
  })

  it('激活计数按皮肤累计', () => {
    recordSwitch('a')
    recordSwitch('a')
    recordSwitch('b')
    const stats = getStats()
    expect(stats.switches.a).toBe(2)
    expect(stats.switches.b).toBe(1)
    expect(stats.firstAt).toBeGreaterThan(0)
  })

  it('空 id 的激活不计数', () => {
    recordSwitch('')
    expect(Object.keys(getStats().switches)).toHaveLength(0)
  })

  it('时长心跳：前台累计、后台不计、空皮肤不计', () => {
    tick('a', true)
    tick('a', true)
    tick('a', false)
    tick('', true)
    expect(getStats().seconds.a).toBe(2)
  })

  it('试穿与转正计数及转化率数据', () => {
    recordTryOn()
    recordTryOn()
    recordApply()
    const stats = getStats()
    expect(stats.tryOns).toBe(2)
    expect(stats.applies).toBe(1)
  })

  it('clearStats 全量重置（保留合法结构）', () => {
    recordSwitch('a')
    recordTryOn()
    tick('a', true)
    clearStats()
    const stats = getStats()
    expect(stats.switches.a).toBeUndefined()
    expect(stats.seconds.a).toBeUndefined()
    expect(stats.tryOns).toBe(0)
    expect(stats.applies).toBe(0)
    expect(stats.__v).toBe(1)
  })

  it('formatDuration 三个量级', () => {
    expect(formatDuration(30)).toBe('30 秒')
    expect(formatDuration(90)).toBe('1 分钟')
    expect(formatDuration(3600 + 120)).toBe('1 小时 2 分')
  })
})
