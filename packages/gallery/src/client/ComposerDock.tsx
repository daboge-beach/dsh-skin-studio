/**
 * ComposerDock — 输入区控制条（conversation.composer.dock 槽位）。
 *
 * 把「模型选择」和「境界档位滑条」直接放到底部输入框下方：
 * - 模型按钮：点击代理官方模型按钮（打开官方菜单，模型/等级都在里面选），
 *   文案实时镜像官方按钮（当前模型 + 推理等级）
 * - 档位滑条：与皮肤中心面板同一套 tierPower 逻辑（跟随推理/手动 + 0-3 档）
 */
import { useEffect, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { skinStudioSettings } from './settings.ts'
import { effectiveTier, subscribeTier, tierLabel, effortTier, type PowerTier } from './tierPower.ts'
import { syncTierToEffort } from './tierSync.ts'
import styles from './ComposerDock.module.css'

/** tierSync 的强度判定适配（effortTier 已在 tierPower 导出）。 */
const effortTierSafe = (id: string): number | null => effortTier(id)

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
    read()
    const t = window.setInterval(read, 1000)
    return () => { window.clearInterval(t) }
  }, [])
  return label
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
  const [powerTier, setPowerTier] = useState(() => skinStudioSettings.get().powerTier)
  const [tier, setTier] = useState<PowerTier>(() => effectiveTier())
  const [sync, setSync] = useState(() => skinStudioSettings.get().tierSyncEffort)
  useEffect(() => skinStudioSettings.subscribe(s => { setPowerTier(s.powerTier); setSync(s.tierSyncEffort) }), [])
  useEffect(() => subscribeTier(t => { setTier(t) }), [])

  const onSlider = (v: string): void => {
    skinStudioSettings.setPowerTier(`t${v}` as 't0' | 't1' | 't2' | 't3')
    if (typeof document !== 'undefined') document.body.dataset.xlSync = sync ? 'slider-on' : 'slider-off'
    if (sync && ctx !== undefined) syncTierToEffort(ctx, Number(v) as PowerTier, effortTierSafe)
  }

  const short = modelLabel
    .replace(/^选择模型，当前\s*/, '')
    .replace(/^Select model, current\s*/i, '')
    .replace(/,?\s*推理等级\s*.+$/, '')
    .replace(/,?\s*reasoning effort\s*.+$/i, '')
  const effort = /推理等级\s*(.+)$/.exec(modelLabel)?.[1] ?? ''

  return (
    <div className={styles.dock} data-dsh-skin-studio="composer-dock">
      <button type="button" className={styles.modelBtn} onClick={openModelMenu} title="打开模型选择（官方菜单）">
        ⚙ {short || '选择模型'}{effort !== '' ? ` · ${effort}` : ''}
      </button>
      <button
        type="button"
        className={styles.tierMode}
        aria-pressed={powerTier === 'auto'}
        title="跟随推理等级自动升降档 / 手动锁定（点此切换）"
        onClick={() => skinStudioSettings.setPowerTier(powerTier === 'auto' ? `t${effectiveTier()}` as 't0' | 't1' | 't2' | 't3' : 'auto')}
      >
        {powerTier === 'auto' ? '跟随' : '手动'}
      </button>
      <button
        type="button"
        className={styles.tierMode}
        aria-pressed={sync}
        title="滑条同步推理等级：开=拖动境界滑条真实修改当前会话的推理等级（改变 token 消耗）；关=滑条仅控制视觉档位"
        onClick={() => { skinStudioSettings.setTierSyncEffort(!sync) }}
      >
        {sync ? '⇄同步' : '⇄视觉'}
      </button>
      <input
        type="range" min={0} max={3} step={1}
        className={styles.tierSlider}
        aria-label={`境界档位，当前 ${tierLabel(skinStudioSettings.getActiveSkin() ?? '', tier)}`}
        title="境界档位：推理等级越高，人物修为/皮肤等级越高（背景·吉祥物·光标随之变化）"
        value={powerTier === 'auto' ? tier : Number(powerTier.slice(1))}
        onChange={e => { onSlider(e.target.value) }}
      />
      <span className={styles.tierName}>{tierLabel(skinStudioSettings.getActiveSkin() ?? '', tier)}</span>
    </div>
  )
}
