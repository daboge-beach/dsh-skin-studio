/**
 * @dsh-skin-studio/gallery · 浏览器半边入口（官方 clientBundle 的固定入口名）。
 *
 * 职责（docs/FRONTEND_REQUIREMENTS.md 界面一 · 组件结构 + 联调适配）：
 * 1. 注册内置 7 款皮肤主题（官方 ctx.theme.register；SKIN_SPEC §7.3 多主题
 *    注册模式，每款一个 disposer）。
 * 2. 皮肤偏好的会话恢复：官方 ThemeSettingsSchema.preference 只接受
 *    light/dark/system，第三方皮肤 id 不会写入宿主 settings —— 皮肤中心
 *    在自身命名空间（settings.ts 的 localStorage）记忆「应用并保存」的
 *    皮肤，启动时恢复；官方 scope 的启动 adoption 会把 preference 顶回
 *    system，因此收敛器在恢复成功前对内置三值做一次顶回（幂等，恢复
 *    成功后不再对抗用户切换）。
 * 3. 注册皮肤中心面板 —— 真实 DSH 走官方 slot 系统（settings.section 分节）；
 *    简化契约宿主（demo / mock host）走 ctx.slots.sidebar.register。
 * 4. 挂载全局浮层（吉祥物 + 切换特效）。
 *
 * 所有 ctx 调用都在本 apply 内完成；卸载时逐项 disposer。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { BUILTIN_SKINS } from './registry/builtinSkins.ts'
import { skinRegistry, toThemeDefinition } from './registry/skinRegistry.ts'
import { skinStudioSettings } from './settings.ts'
import { registerSettingsSection, registerSimplifiedSidebar } from './hostAdapters.ts'
import { mountOverlays } from './overlays.ts'
import { mountSkinEffects } from './skinEffects.ts'

/** 浏览器半边需要的服务：官方主题运行时 + slot 系统。 */
export const inject = ['theme', 'slots']

/** 皮肤 id → 恢复失败时清除记忆（皮肤已不在注册表，如上传款刷新后丢失）。 */
function restoreSavedSkin(ctx: ClientContext): void {
  const saved = skinStudioSettings.getActiveSkin()
  if (saved === null || ctx.theme.getTheme().active.id === saved) return
  try {
    ctx.theme.setTheme(saved)
  } catch {
    skinStudioSettings.setActiveSkin(null)
  }
}

/** 内置偏好三值（adoption 顶回与用户切换的共同特征域）。 */
const BUILT_IN_PREFERENCES = new Set(['light', 'dark', 'system'])

/** 启动收敛窗口：官方 scope 的 adoption 一般在连接建立后的最初几秒到达。 */
const CONVERGE_WINDOW_MS = 15_000

/**
 * 皮肤中心浏览器半边插件。
 * @param ctx - 客户端插件上下文。
 */
export function apply(ctx: ClientContext): void {
  // 1+2. 内置皮肤主题注册 + 皮肤偏好的会话恢复与收敛
  ctx.effect(() => {
    const disposers = BUILTIN_SKINS.map(skin => ctx.theme.register(toThemeDefinition(skin)))

    restoreSavedSkin(ctx)

    // adoption 顶回的判定：preference 与 active 同时变内置。时间窗口只是
    // 下限——宿主重连场景下 adoption 可能远晚于窗口到达（实测撞见过），
    // 而 adoption 是程序事件、用户换主题必先有输入：窗口外且用户从未
    // 交互过的内置翻转仍按 adoption 顶回，只有用户动过（pointer/键盘）
    // 之后的翻转才视为用户意图（皮肤 → 记忆；内置 → 清除）。
    // 判据用 snapshot.preference：试穿/应用时 preference 是皮肤 id（非内置），
    // 不会被误判为 adoption。
    let windowClosed = skinStudioSettings.getActiveSkin() === null
    let userTouched = false
    const windowTimer = windowClosed ? undefined : window.setTimeout(() => {
      windowClosed = true
    }, CONVERGE_WINDOW_MS)
    const markTouched = (): void => { userTouched = true }
    const hasWindow = typeof window !== 'undefined'
    if (hasWindow) {
      window.addEventListener('pointerdown', markTouched, { capture: true })
      window.addEventListener('keydown', markTouched, { capture: true })
    }

    const off = ctx.on('theme/change', snapshot => {
      const id = snapshot.active.id
      const saved = skinStudioSettings.getActiveSkin()
      if (id === saved) return
      const builtInFlip = BUILT_IN_PREFERENCES.has(snapshot.preference)
        && BUILT_IN_PREFERENCES.has(id)
      if (saved !== null && builtInFlip && !(windowClosed && userTouched)) {
        // 启动 adoption 竞态：顶回皮肤（皮肤失效则顺手清记忆）。
        // 必须异步执行：在本监听器内同步 setTheme 会产生嵌套 publish，
        // 后注册的订阅者（皮肤特效层 / React 监听）会先收到嵌套事件、
        // 再收到外层事件的残余，最终停在旧状态。microtask 让事件序列
        // 对所有订阅者线性化：dark → mupeiling。
        queueMicrotask(() => { restoreSavedSkin(ctx) })
        return
      }
      // 记忆跟随当前激活状态：皮肤 → 记 id；内置偏好（含试穿还原）→ 清除
      skinStudioSettings.setActiveSkin(skinRegistry.get(id) === undefined ? null : id)
    })

    return () => {
      off()
      if (windowTimer !== undefined) window.clearTimeout(windowTimer)
      if (hasWindow) {
        window.removeEventListener('pointerdown', markTouched, { capture: true })
        window.removeEventListener('keydown', markTouched, { capture: true })
      }
      for (const dispose of disposers) dispose()
    }
  }, '@dsh-skin-studio/gallery: theme registration + preference restore')

  // 3. 皮肤中心面板：真实 DSH（官方 slot 系统）或简化契约宿主
  ctx.effect(() => {
    const disposePanel = ctx.slots.sidebar !== undefined
      ? registerSimplifiedSidebar(ctx)
      : registerSettingsSection(ctx)
    return disposePanel
  }, '@dsh-skin-studio/gallery: panel registration')

  // 4. 全局浮层（吉祥物 + 切换特效）
  ctx.effect(() => mountOverlays(ctx), '@dsh-skin-studio/gallery: overlays')

  // 5. 皮肤特效层（光标三态 / 按钮特效 / 背景装饰动画，插件自管 CSS 通道）
  ctx.effect(() => mountSkinEffects(
    () => ctx.theme.getTheme(),
    listener => ctx.on('theme/change', listener),
  ), '@dsh-skin-studio/gallery: skin visual effects')
}

export const name = '@dsh-skin-studio/gallery'
