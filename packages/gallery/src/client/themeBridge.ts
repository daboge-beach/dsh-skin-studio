/**
 * themeBridge — 画廊 → 官方 ThemeRuntime 的薄封装。
 *
 * 内置 7 款皮肤的主题由各自的皮肤插件注册（DSH profile 里以插件身份装）。
 * 用户上传的皮肤没有插件载体，皮肤中心代为注册（AGENTS.md 路线图里的
 * 「皮肤加载器」职责）：首次 setTheme 前 ensureThemeRegistered，幂等；
 * 皮肤删除时用注册返回的 disposer 反注册（SKIN_SPEC §3.2）。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinEntry } from './registry/types.ts'
import { toThemeDefinition } from './registry/skinRegistry.ts'

/** 本会话内已由皮肤中心代注册的皮肤 id → 反注册函数。 */
const galleryRegistered = new Map<string, () => void>()

/** 确保皮肤的主题定义已注册（内置款通常已由皮肤插件注册，此处幂等跳过）。 */
export function ensureThemeRegistered(ctx: ClientContext, skin: SkinEntry): void {
  if (skin.source === 'builtin') return
  if (galleryRegistered.has(skin.id)) return
  if (ctx.theme.getTheme().themes.some(t => t.id === skin.id)) return
  const dispose = ctx.theme.register(toThemeDefinition(skin))
  galleryRegistered.set(skin.id, dispose)
}

/** 皮肤被删除时反注册其主题（仅皮肤中心代注册的）。 */
export function unregisterGalleryTheme(_ctx: ClientContext, skin: SkinEntry): void {
  const dispose = galleryRegistered.get(skin.id)
  if (dispose === undefined) return
  dispose()
  galleryRegistered.delete(skin.id)
}
