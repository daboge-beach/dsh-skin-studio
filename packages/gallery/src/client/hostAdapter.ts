/**
 * hostAdapter — 宿主适配层（v0.12 稳定性）。
 *
 * 皮肤运行时对宿主的一切 DOM 观察集中在这里（此前散在 tierPower /
 * ComposerDock / taskNotify / index 四处）：官方 aria-label 语义、
 * data-phase 阶段标记、发送按钮忙碌态。上游 DSH 改 UI 时只改这一层，
 * 并通过能力检测做局部降级而不是整个插件失效。
 *
 * 原则：
 * - 适配器只做「寻址 + 读取」，业务判定（等级词表、上升沿逻辑）留在
 *   各消费方——保证可独立测试。
 * - 任何探测都可能失败（返回 null/false），调用方必须自带降级路径。
 * - 诊断出口（describeCapabilities / collectDiagnostics）供设置面板
 *   一键复制，用户报障时能看到宿主到底暴露了哪些能力。
 */

/** 插件版本（release 时同步 package.json；诊断信息用）。 */
export const SKIN_STUDIO_VERSION = '0.15.0'

/** 宿主能力面（启动探测 + 按需重探）。 */
export interface HostCapabilities {
  /** 官方模型触发按钮可寻址（境界观察 / 模型菜单代理依赖）。 */
  modelButton: boolean
  /** 发送按钮可寻址（任务完成提醒依赖）。 */
  sendButton: boolean
  /** data-phase 阶段标记可观察（欢迎页 dock 依赖）。 */
  heroPhase: boolean
}

/** 安全模式判定：URL ?safe-theme=1 开启（记忆到 sessionStorage）、=0 显式清除并关闭；无参数看记忆。 */
export function isSafeMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const url = new URL(window.location.href)
    const param = url.searchParams.get('safe-theme')
    if (param === '1') {
      try { window.sessionStorage.setItem('dsh-skin-studio.safe', '1') } catch { /* 隐私模式忽略 */ }
      return true
    }
    if (param === '0') {
      try { window.sessionStorage.removeItem('dsh-skin-studio.safe') } catch { /* 同上 */ }
      return false
    }
    return window.sessionStorage.getItem('dsh-skin-studio.safe') === '1'
  } catch {
    return false
  }
}

/** 退出安全模式（恢复正常视觉；清除记忆并重载）。 */
export function exitSafeMode(): void {
  try {
    window.sessionStorage.removeItem('dsh-skin-studio.safe')
    const url = new URL(window.location.href)
    url.searchParams.delete('safe-theme')
    window.location.replace(url.href)
  } catch {
    window.location.reload()
  }
}

/** 官方模型触发按钮（aria-label「选择模型，当前 …」/ "Select model, current …"）。 */
export function findModelButton(): HTMLButtonElement | null {
  if (typeof document === 'undefined') return null
  for (const btn of document.querySelectorAll<HTMLButtonElement>('button[aria-label]')) {
    const v = btn.getAttribute('aria-label') ?? ''
    if (v.startsWith('选择模型') || /^select model/i.test(v)) return btn
  }
  return null
}

/** 官方模型按钮的完整 aria-label（含当前模型与推理等级；无则 null）。 */
export function readModelLabel(): string | null {
  return findModelButton()?.getAttribute('aria-label') ?? null
}

/** 代理点击官方模型按钮打开原菜单（寻址失败静默）。 */
export function openModelMenu(): void {
  findModelButton()?.click()
}

/** 推理等级名（模型按钮 aria-label 的「推理等级 X」段；无则 null）。 */
export function readReasoningEffort(): string | null {
  const label = readModelLabel()
  if (label === null) return null
  return /(?:推理等级|reasoning effort)\s+([A-Za-z\u4e00-\u9fa5]+)/i.exec(label)?.[1] ?? null
}

/** DSH 发送按钮（aria-label/title/text 随界面语言变化，中英都认）。 */
export function findSendButton(): HTMLButtonElement | null {
  if (typeof document === 'undefined') return null
  for (const btn of document.querySelectorAll<HTMLButtonElement>('button')) {
    const label = btn.getAttribute('aria-label') ?? btn.title ?? btn.textContent ?? ''
    if (/发送消息|发送|send message/i.test(label)) return btn
  }
  return null
}

/** 按钮当前是否禁用（disabled 属性或 aria-disabled）。 */
export function isButtonBusy(btn: HTMLButtonElement | null): boolean {
  if (btn === null) return false
  return btn.disabled || btn.getAttribute('aria-disabled') === 'true'
}

/** 当前是否欢迎页（hero 阶段：ConversationRoot 根节点带 data-phase="hero"）。 */
export function readHeroPhase(): boolean {
  if (typeof document === 'undefined') return false
  return document.querySelector('[data-phase="hero"]') !== null
}

/** 宿主构建号（标题栏 commit hash，如 "141eb6f"；探测不到 null）。 */
export function readHostCommit(): string | null {
  if (typeof document === 'undefined') return null
  for (const el of document.querySelectorAll<HTMLElement>('header [class*="header"] *, header *')) {
    const text = (el.textContent ?? '').trim()
    if (/^[0-9a-f]{7,40}$/.test(text)) return text
  }
  return null
}

/** 探测当前宿主能力面（对 DOM 的一次完整寻址；各消费方按能力降级）。 */
export function detectCapabilities(): HostCapabilities {
  return {
    modelButton: findModelButton() !== null,
    sendButton: findSendButton() !== null,
    heroPhase: typeof document !== 'undefined'
      && document.querySelector('[data-phase]') !== null,
  }
}
