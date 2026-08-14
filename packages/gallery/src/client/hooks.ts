/**
 * React Hooks（docs/FRONTEND_REQUIREMENTS.md · React Hooks 一节）。
 */
import { useEffect, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeSnapshot } from '@dsh-skin-studio/types'

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

/** 系统开启「减少动态效果」时不播动画（含首帧判定，SSR 安全）。 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () => typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (): void => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => { mq.removeEventListener('change', onChange) }
  }, [])
  return reduced
}
