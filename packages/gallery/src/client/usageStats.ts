/**
 * usageStats — 纯本地使用统计（v0.14，战略 review 第 12 条）。
 *
 * 只在本机 localStorage 记四个计数：各皮肤激活次数 / 累计使用时长 /
 * 试穿次数 / 试穿转应用次数。不上传任何服务器；设置面板可一键清除；
 * 安全模式下整个插件不启动，自然零采集。
 *
 * 时长采集：1s tick（复用 poll 调度器）且 document.visibilityState 为
 * visible 才累计（后台标签页自动暂停）；内存累计、每 30s 才落盘一次，
 * pagehide 时兜底落盘。
 */
import { skinStudioSettings } from './settings.ts'

export interface UsageStats {
  __v: 1
  /** 统计起点（ms）。 */
  firstAt: number
  /** 各皮肤激活次数。 */
  switches: Record<string, number>
  /** 各皮肤累计使用秒数。 */
  seconds: Record<string, number>
  /** 试穿次数。 */
  tryOns: number
  /** 试穿转「应用并保存」次数。 */
  applies: number
}

const KEY = 'dsh-skin-studio.stats'
/** 落盘前内存累计的秒数阈值（写放大控制）。 */
const PERSIST_EVERY_SECONDS = 30
/** 单文件条目上限（按 总量=秒数+次数 剪枝到 top N，防无限增长）。 */
const MAX_SKIN_ENTRIES = 50

function empty(): UsageStats {
  return { __v: 1, firstAt: Date.now(), switches: {}, seconds: {}, tryOns: 0, applies: 0 }
}

function load(): UsageStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as UsageStats
      if (parsed.__v === 1) return parsed
    }
  } catch { /* 损坏/隐私模式：从零开始 */ }
  return empty()
}

const stats: UsageStats = load()
let unpersistedSeconds = 0

function persist(): void {
  try { localStorage.setItem(KEY, JSON.stringify(prune(stats))) } catch { /* 隐私模式忽略 */ }
}

/** 条目超限时按活跃度剪枝（保 top N，统计语义仍成立）。 */
function prune(s: UsageStats): UsageStats {
  const ids = new Set([...Object.keys(s.seconds), ...Object.keys(s.switches)])
  if (ids.size <= MAX_SKIN_ENTRIES) return s
  const ranked = [...ids].sort((a, b) =>
    (s.seconds[b] ?? 0) + (s.switches[b] ?? 0) * 60 - ((s.seconds[a] ?? 0) + (s.switches[a] ?? 0) * 60))
  const keep = new Set(ranked.slice(0, MAX_SKIN_ENTRIES))
  const out: UsageStats = { ...s, switches: {}, seconds: {} }
  for (const id of keep) {
    if (s.switches[id] !== undefined) out.switches[id] = s.switches[id]
    if (s.seconds[id] !== undefined) out.seconds[id] = s.seconds[id]
  }
  return out
}

/** 皮肤激活（setActiveSkin 到非空新值即一次激活；恢复/清除不计数）。 */
export function recordSwitch(skinId: string): void {
  if (skinId === '') return
  stats.switches[skinId] = (stats.switches[skinId] ?? 0) + 1
  persist()
}

/** 一次试穿开始。 */
export function recordTryOn(): void {
  stats.tryOns += 1
  persist()
}

/** 试穿转应用。 */
export function recordApply(): void {
  stats.applies += 1
  persist()
}

/**
 * 1s 时长心跳（poll 调度器调用）：前台且当前有激活皮肤才累计；
 * 累计满 PERSIST_EVERY_SECONDS 秒落盘一次。
 */
export function tick(activeSkinId: string, visible: boolean = typeof document === 'undefined' || document.visibilityState === 'visible'): void {
  if (!visible || activeSkinId === '') return
  stats.seconds[activeSkinId] = (stats.seconds[activeSkinId] ?? 0) + 1
  unpersistedSeconds += 1
  if (unpersistedSeconds >= PERSIST_EVERY_SECONDS) {
    unpersistedSeconds = 0
    persist()
  }
}

/** 只读快照（面板渲染用）。 */
export function getStats(): Readonly<UsageStats> {
  return stats
}

/** 清空全部统计（设置面板按钮；不可恢复）。 */
export function clearStats(): void {
  const fresh = empty()
  Object.assign(stats, fresh)
  unpersistedSeconds = 0
  persist()
}

// 页面隐藏/关闭时兜底落盘（一次性安装）
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persist)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist()
  })
}

/** 秒数 → 紧凑时长文案（「3 小时 12 分」/「45 分钟」/「30 秒」）。 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} 秒`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  return `${hours} 小时 ${minutes % 60} 分`
}

/** 当前激活皮肤 id（时长归属用；设置模块的活跃值）。 */
export function currentSkinId(): string {
  return skinStudioSettings.getActiveSkin() ?? ''
}
