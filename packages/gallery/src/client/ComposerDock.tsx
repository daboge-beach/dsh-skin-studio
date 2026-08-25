/**
 * ComposerDock — 输入区控制条（conversation.composer.dock 槽位）。
 *
 * 把「模型选择」和「推理档位滑条」直接放到底部输入框下方：
 * - 模型按钮：点击代理官方模型按钮（打开官方菜单），文案实时镜像官方按钮
 * - 档位滑条：数量自适应当前模型的等级列表（GLM 5 档 / DeepSeek 4 档），
 *   与皮肤中心同一套 tierPower 逻辑；⇄ 同步开=拖动真实改推理等级
 */
import { useEffect, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { skinStudioSettings } from './settings.ts'
import { effectiveTier, subscribeTier, tierLabel, effortTier, type PowerTier } from './tierPower.ts'
import { syncTierToEffort } from './tierSync.ts'
import { pollEvery } from './poll.ts'
import styles from './ComposerDock.module.css'

/** 镜像官方模型按钮的 aria-label（1s 轮询，轻量）。 */
function useModelLabel(): string {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const read = (): void => {
      for (const btn of document.querySelectorAll<HTMLButtonElement>('button[aria-label]')) {
        const v = btn.getAttribute('aria-label') ?? ''
        if (v.startsWith('选择模型') || /^select model/i.test(v)) { setLabel(v); return }
      }
    }
    return pollEvery(read)
  }, [])
  return label
}

/** 轮询当前模型的推理等级列表（经官方 directory；返回按强度排序的等级 id）。 */
function useEffortIds(ctx?: ClientContext): string[] {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => {
    if (ctx === undefined) return undefined
    let alive = true
    const strength = (id: string): number => { const v = effortTier(id); return v === null ? 1.5 : v }
    const read = (): void => {
      if (!alive) return
      try {
        const dirs = ctx.modelDirectories
        const sessions = ctx.sessions
        if (dirs === undefined || sessions === null || sessions === undefined) return
        const list = typeof sessions.list.getSnapshot === 'function'
          ? sessions.list.getSnapshot()
          : (sessions.list as unknown as { current?: { id?: string } | string | null })
        const cur0 = list?.current
        const sid = typeof cur0 === 'string' ? cur0 : cur0?.id
        if (sid === undefined || sid === null) return
        const dir = dirs.directoryFor(sid)
        const snapOf = typeof dir.getSnapshot === 'function'
          ? dir.getSnapshot()
          : (typeof dir.store?.getSnapshot === 'function' ? dir.store.getSnapshot() : undefined)
        if (snapOf === undefined) return
        const snap = snapOf as {
          current: { provider: string; model: string } | null
          groups?: Array<{ id: string; models: Array<{ id: string; reasoning?: { efforts?: Array<{ id: string }> } | undefined }> }>
        }
        const cur = snap.current
        if (cur === null) return
        const model = (snap.groups ?? []).find(g => g.id === cur.provider)?.models.find(m => m.id === cur.model)
        const efforts = model?.reasoning?.efforts
        if (efforts === undefined || efforts.length === 0) return
        setIds([...efforts].sort((a, b) => strength(a.id) - strength(b.id)).map(e => e.id))
      } catch { /* 服务未就绪时静默 */ }
    }
    const stop = pollEvery(read)
    return () => { alive = false; stop() }
  }, [ctx])
  return ids
}

/** 点击代理：触发官方模型按钮打开原菜单。 */
function openModelMenu(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('button[aria-label]')) {
    const v = btn.getAttribute('aria-label') ?? ''
    if (v.startsWith('选择模型') || /^select model/i.test(v)) { btn.click(); return }
  }
}

/** 档位控制条（dock 组件；ctx 用于可选的推理等级同步）。 */
export function ComposerDockBar({ ctx }: { ctx?: ClientContext }): JSX.Element {
  const modelLabel = useModelLabel()
  const effortIds = useEffortIds(ctx)
  const [powerTier, setPowerTier] = useState(() => skinStudioSettings.get().powerTier)
  const [tier, setTier] = useState<PowerTier>(() => effectiveTier())
  const [sync, setSync] = useState(() => skinStudioSettings.get().tierSyncEffort)
  useEffect(() => skinStudioSettings.subscribe(s => { setPowerTier(s.powerTier); setSync(s.tierSyncEffort) }), [])
  useEffect(() => subscribeTier(t => { setTier(t) }), [])

  // 滑条档位数自适应当前模型的等级列表（GLM 5 档 / DeepSeek 4 档等）
  const sliderMax = effortIds.length > 0 ? effortIds.length - 1 : 3
  const sliderValue = powerTier === 'auto' ? tier : Math.min(Number(powerTier.slice(1)), sliderMax)
  // 档名：有等级列表时显示真实等级名，否则视觉档名
  const effortName = effortIds.length > 0
    ? (effortIds[sliderValue] ?? effortIds[effortIds.length - 1] ?? '?')
    : tierLabel(skinStudioSettings.getActiveSkin() ?? '', tier)

  const onSlider = (v: string): void => {
    const n = Number(v)
    // 视觉档位 0-3（资产四档，超出档位视觉取最高）
    skinStudioSettings.setPowerTier(`t${Math.min(n, 4)}` as 't0' | 't1' | 't2' | 't3' | 't4')
    if (typeof document !== 'undefined') document.body.dataset.xlSync = sync ? 'slider-on' : 'slider-off'
    if (sync && ctx !== undefined) syncTierToEffort(ctx, n as PowerTier, effortTier)
  }

  const short = modelLabel
    .replace(/^选择模型，当前\s*/, '')
    .replace(/^Select model, current\s*/i, '')
    .replace(/,?\s*推理等级\s*.+$/, '')
    .replace(/,?\s*reasoning effort\s*.+$/i, '')

  return (
    <div className={styles.dock} data-dsh-skin-studio="composer-dock">
      <button type="button" className={styles.modelBtn} onClick={openModelMenu} title="打开模型选择（官方菜单）">
        ⚙ {short || '选择模型'}
      </button>
      <button
        type="button"
        className={styles.tierMode}
        aria-pressed={powerTier === 'auto'}
        title="跟随推理等级自动升降档 / 手动锁定（点此切换）"
        onClick={() => skinStudioSettings.setPowerTier(powerTier === 'auto' ? `t${effectiveTier()}` as 't0' | 't1' | 't2' | 't3' | 't4' : 'auto')}
      >
        {powerTier === 'auto' ? '跟随' : '手动'}
      </button>
      <button
        type="button"
        className={styles.tierMode}
        aria-pressed={sync}
        title="滑条同步推理等级：开=拖动档位滑条真实修改当前会话的推理等级（改变 token 消耗）；关=滑条仅控制视觉档位"
        onClick={() => { skinStudioSettings.setTierSyncEffort(!sync) }}
      >
        {sync ? '⇄同步' : '⇄视觉'}
      </button>
      <input
        type="range" min={0} max={sliderMax} step={1}
        className={styles.tierSlider}
        aria-label={`推理档位（共 ${sliderMax + 1} 档），当前 ${effortName}`}
        title={`推理档位：随当前模型的等级数量自适应（${sliderMax + 1} 档）；等级越高人物修为/皮肤等级越高`}
        value={sliderValue}
        onChange={e => { onSlider(e.target.value) }}
      />
      <span className={styles.tierName}>{effortName}</span>
    </div>
  )
}
