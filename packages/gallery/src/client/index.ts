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
import { isSafeMode } from './hostAdapter.ts'
import { mountSafeModeBanner } from './safeMode.ts'
import { BUILTIN_SKINS } from './registry/builtinSkins.ts'
import { skinRegistry, toThemeDefinition } from './registry/skinRegistry.ts'
import { skinStudioSettings } from './settings.ts'
import { registerSettingsSection, registerSimplifiedSidebar } from './hostAdapters.ts'
import { mountOverlays } from './overlays.ts'
import { mountSkinEffects } from './skinEffects.ts'
import { mountTaskNotify } from './taskNotify.ts'
import { mountTierWatch } from './tierPower.ts'
import { ComposerDockBar, HeroDockBar } from './ComposerDock.tsx'

/** 浏览器半边需要的服务：官方主题运行时 + slot 系统。 */
export const inject = ['theme', 'slots']

/** 皮肤 id → 恢复失败时清除记忆并回原生主题（诊断标记落在 body dataset）。 */
function restoreSavedSkin(ctx: ClientContext): void {
  const saved = skinStudioSettings.getActiveSkin()
  if (saved === null || ctx.theme.getTheme().active.id === saved) return
  try {
    ctx.theme.setTheme(saved)
  } catch {
    // 恢复失败（皮肤不存在/主题服务异常）：回原生外观 + 清记忆，绝不黑屏
    skinStudioSettings.setActiveSkin(null)
    try {
      ctx.theme.setTheme('system')
      if (typeof document !== 'undefined') document.body.dataset.xlSafeFallback = '1'
    } catch { /* 主题服务整体不可用：只能清记忆等待重试 */ }
  }
}

/** 内置偏好三值（adoption 顶回与用户切换的共同特征域）。 */
const BUILT_IN_PREFERENCES = new Set(['light', 'dark', 'system'])

/**
 * 皮肤中心浏览器半边插件。
 * @param ctx - 客户端插件上下文。
 */
export function apply(ctx: ClientContext): void {
  // 0. 安全模式（?safe-theme=1）：跳过全部第三方视觉，只挂原生横幅。
  //    界面被皮肤弄到不可读时的救援通道；「恢复正常视觉」按钮清除参数重载。
  if (isSafeMode()) {
    mountSafeModeBanner()
    return
  }

  // 1+2. 内置皮肤主题注册 + 皮肤偏好的会话恢复与收敛
  ctx.effect(() => {
    const disposers = BUILTIN_SKINS.map(skin => ctx.theme.register(toThemeDefinition(skin)))

    restoreSavedSkin(ctx)

    // 上传皮肤持久化恢复：IndexedDB 里的已安装款注册主题 + 重放启动恢复
    //（#ready 完成前 setTheme(上传 id) 会因主题未注册而失败清记忆，这里补）
    void skinRegistry.restored().then(restored => {
      for (const skin of restored) disposers.push(ctx.theme.register(toThemeDefinition(skin)))
      if (restored.length > 0) restoreSavedSkin(ctx)
    })

    // 内置翻转（宿主 adoption / 换模型触发 / 用户经官方外观选择器切明暗）：
    // 有皮肤记忆一律顶回皮肤。回原生界面的唯一入口是皮肤中心的「还原出厂」
    // ——不做 userTouched 类猜测（拉境界滑条等普通点击曾被误判为切主题意图，
    // 导致换模型时皮肤记忆被清、界面黑屏）。
    const off = ctx.on('theme/change', snapshot => {
      const id = snapshot.active.id
      const saved = skinStudioSettings.getActiveSkin()
      if (id === saved) return
      // 试穿只是临时预览：不写记忆、不触发顶回（决策见皮肤中心面板的试穿条）
      if (skinStudioSettings.isTryOnActive()) return
      if (BUILT_IN_PREFERENCES.has(id)) {
        // 内置偏好翻转：有皮肤记忆 → 顶回（microtask 线性化事件序列）
        if (saved !== null) queueMicrotask(() => { restoreSavedSkin(ctx) })
        return
      }
      // 皮肤 id（官方选择器直接选了已注册皮肤）：跟随记忆
      skinStudioSettings.setActiveSkin(skinRegistry.get(id) === undefined ? null : id)
    })

    return () => {
      off()
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

  // 6. 任务完成提醒（提示音 + 吉祥物庆祝；信号源为发送按钮禁用恢复）
  ctx.effect(() => mountTaskNotify({
    getSkinId: () => ctx.theme.getTheme()?.active.id ?? '',
    getMode: () => skinStudioSettings.get().notifyTaskDone,
    reducedMotion: () => {
      const s = skinStudioSettings.get()
      return s.animations !== 'always'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
  }), '@dsh-skin-studio/gallery: task done notify')

  // 7. 境界档位观察（'auto' 模式跟随 DSH 推理等级，DOM 读取）
  ctx.effect(() => mountTierWatch(), '@dsh-skin-studio/gallery: tier watch')

  // 8. 输入区控制条：会话页走 conversation.composer.dock（输入框下方）；
  //    欢迎页被官方 footer 的 !hero 守卫排除，补注册 conversation.input.dock
  //    （hero 阶段也渲染的 additive list，输入卡上方），HeroDockBar 非 hero
  //    渲染 null，两页各一条不重复。槽位由 conversation 服务声明；
  //    modelDirectories 供等级同步（cordis 要求服务先注入才能访问）。
  //    demo/mock 宿主缺这些服务时不注册。
  ctx.inject(['conversation', 'modelDirectories', 'sessions'], injected => {
    injected.effect(() => {
      const disposers: Array<() => void> = []
      try {
        disposers.push(injected.slots.register(
          { name: 'conversation.composer.dock', id: 'skin-studio-tier', order: -1 },
          () => ComposerDockBar({ ctx: injected }),
        ))
        disposers.push(injected.slots.register(
          { name: 'conversation.input.dock', id: 'skin-studio-tier-hero', order: -1 },
          () => HeroDockBar({ ctx: injected }),
        ))
        if (typeof document !== 'undefined') document.body.dataset.xlDock = 'registered'
      } catch (e) {
        if (typeof document !== 'undefined') document.body.dataset.xlDock = 'err:' + String(e).slice(0, 80)
      }
      return () => { for (const dispose of disposers) dispose() }
    }, '@dsh-skin-studio/gallery: composer dock')
  })
}

export const name = '@dsh-skin-studio/gallery'
