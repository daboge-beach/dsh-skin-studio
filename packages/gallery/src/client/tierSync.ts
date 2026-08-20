/**
 * tierSync — 境界滑条 → 真实推理等级 双向同步（可选，默认关）。
 *
 * 走官方正式接口：ctx.modelDirectories.directoryFor(sessionId) 取当前
 * 会话的模型目录（与官方模型菜单同一条状态），select() 提交与菜单点选
 * 完全同路径（sessions.selectModel）。任何一步不可用都静默降级——
 * 视觉档位照常工作，只是不同步真实等级。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PowerTier } from './tierPower.ts'

/** 未识别等级名的排序强度（排在认识的中间档之间，保持目录原顺序）。 */
const UNKNOWN_STRENGTH = 1.5

/** 等级 id 的强度评估（复用 tierPower 的词表判定）。 */
function strengthOf(id: string, known: (id: string) => number | null): number {
  const v = known(id)
  return v === null ? UNKNOWN_STRENGTH : v
}

/**
 * 把境界档位同步为当前会话的真实推理等级。
 * @param ctx - 插件上下文（需要 modelDirectories/sessions 服务，缺省静默返回）。
 * @param tier - 目标档位（0-3，映射到当前模型 efforts 列表的对应强度位）。
 */
export function syncTierToEffort(ctx: ClientContext, tier: PowerTier, knownTier: (id: string) => number | null): void {
  const trace = (m: string): void => { if (typeof document !== 'undefined') document.body.dataset.xlSync = m }
  try {
    const dirs = ctx.modelDirectories
    const sessions = ctx.sessions
    if (dirs === undefined || sessions === null || sessions === undefined) { trace('no-service'); return }

    // 当前会话 id：list 快照的 current（防御式读，形态随版本可能收窄）
    const list = typeof sessions.list.getSnapshot === 'function'
      ? sessions.list.getSnapshot()
      : (sessions.list as unknown as { current?: { id?: string } | string | null })
    const currentRaw = list?.current
    const sessionId = typeof currentRaw === 'string' ? currentRaw : currentRaw?.id
    if (sessionId === undefined || sessionId === null) { trace('no-session'); return }

    let directory: {
      getSnapshot(): {
        current: { provider: string; model: string; reasoningEffort?: string } | null
        groups?: Array<{ id: string; models: Array<{ id: string; reasoning?: { efforts?: Array<{ id: string }> } | undefined }> }>
      }
      select(selection: { provider: string; model: string; reasoningEffort?: string }): Promise<void>
    }
    try {
      directory = dirs.directoryFor(sessionId)
    } catch (e) {
      trace('directory-err:' + String(e).slice(0, 60))
      return
    }
    const snap = directory.getSnapshot()
    const cur = snap.current
    if (cur === null) { trace('no-current'); return }

    // 当前模型的 efforts 列表（provider 组 → model → reasoning.efforts）
    const group = (snap.groups ?? []).find(g => g.id === cur.provider)
    const model = group?.models.find(m => m.id === cur.model)
    const efforts = model?.reasoning?.efforts
    if (group === undefined) { trace('no-group:' + cur.provider); return }
    if (model === undefined) { trace('no-model:' + cur.model); return }
    if (efforts === undefined || efforts.length === 0) { trace('no-efforts'); return }

    // 按强度排序后取目标档位（档位超上限则取最高档）
    const sorted = [...efforts].sort(
      (a, b) => strengthOf(a.id, knownTier) - strengthOf(b.id, knownTier))
    const picked = sorted[Math.min(tier, sorted.length - 1)]
    if (picked === undefined) { trace('no-pick'); return }
    if (picked.id === cur.reasoningEffort) { trace('same:' + picked.id); return }

    trace('sent:' + picked.id)
    void directory.select({
      provider: cur.provider,
      model: cur.model,
      reasoningEffort: picked.id,
    }).then(() => { trace('ok:' + picked.id) }).catch(e => { trace('select-err:' + String(e).slice(0, 60)) })
  } catch (e) {
    trace('err:' + String(e).slice(0, 60))
  }
}
