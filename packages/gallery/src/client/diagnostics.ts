/**
 * diagnostics — 诊断信息出口（v0.12 故障恢复）。
 *
 * 设置面板「复制诊断信息」把宿主/插件/皮肤/设置的一次性快照写进剪贴板，
 * 用户报 Issue 时贴上即可定位环境。只包含技术状态，不含对话内容。
 */
import { SKIN_STUDIO_VERSION, detectCapabilities, isSafeMode, readHostCommit, readReasoningEffort } from './hostAdapter.ts'
import { skinStudioSettings } from './settings.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import { effectiveTier } from './tierPower.ts'

/** 汇集诊断快照（格式化 JSON 字符串，可直接粘贴）。 */
export function collectDiagnostics(activeSkinId: string | null | undefined): string {
  const s = skinStudioSettings.get()
  return JSON.stringify({
    plugin: {
      name: '@dsh-skin-studio/gallery',
      version: SKIN_STUDIO_VERSION,
      settingsVersion: 2,
      safeMode: isSafeMode(),
    },
    host: {
      commit: readHostCommit(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      capabilities: detectCapabilities(),
    },
    skin: {
      active: activeSkinId ?? null,
      powerTier: s.powerTier,
      detectedEffort: readReasoningEffort(),
      effectiveTier: effectiveTier(),
      builtinCount: skinRegistry.counts().builtin,
      uploadedCount: skinRegistry.counts().uploaded,
    },
    settings: {
      mascotEnabled: s.mascotEnabled,
      quoteLang: s.quoteLang,
      animations: s.animations,
      notifyTaskDone: s.notifyTaskDone,
      glass: s.glass,
      cursorFx: s.cursorFx,
      tierSyncEffort: s.tierSyncEffort,
      bgFit: s.bgFit,
      uiLang: s.uiLang ?? 'auto',
    },
    collectedAt: new Date().toISOString(),
  }, null, 2)
}
