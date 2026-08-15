/**
 * React Hooks（docs/FRONTEND_REQUIREMENTS.md · React Hooks 一节）。
 */
import { useEffect, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeSnapshot } from '@dsh-skin-studio/types'
import { skinStudioSettings } from './settings.ts'

/** 订阅官方主题快照，主题变化时自动 re-render。 */
export function useThemeSnapshot(ctx: ClientContext): ThemeSnapshot | null {
  const [snapshot, setSnapshot] = useState<ThemeSnapshot | null>(
    () => ctx.theme?.getTheme() ?? null,
  )

  useEffect(() => {
    if (!ctx.theme) return
    const dispose = ctx.on('theme/change', (snap: ThemeSnapshot) => setSnapshot(snap))
    return dispose
  }, [ctx])

  return snapshot
}

/**
 * 系统开启「减少动态效果」时不播动画（含首帧判定，SSR 安全）。
 *
 * 皮肤中心设置 animations: 'always' 时忽略系统偏好、始终返回 false ——
 * 系统动画被全局关闭但用户仍想看皮肤动效的场景（见 settings.ts）。
 */
export function usePrefersReducedMotion(): boolean {
  const [systemReduced, setSystemReduced] = useState<boolean>(
    () => typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  const [overrideAlways, setOverrideAlways] = useState<boolean>(
    () => skinStudioSettings.get().animations === 'always',
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (): void => setSystemReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => { mq.removeEventListener('change', onChange) }
  }, [])
  useEffect(() => skinStudioSettings.subscribe(s => {
    setOverrideAlways(s.animations === 'always')
  }), [])
  return systemReduced && !overrideAlways
}
