/**
 * 皮肤中心的模块级设置（settings.mascotEnabled，默认 true）。
 *
 * docs/FRONTEND_REQUIREMENTS.md「吉祥物浮层要求」：用户可在皮肤中心设置里
 * 关闭浮层。接入真实 DSH 后应迁移到官方 settingsScope 持久化；当前用
 * localStorage 的自身命名空间（SKIN_SPEC §10 允许自身命名空间）。
 */
const STORAGE_KEY = 'dsh-skin-studio:settings'

export interface SkinStudioSettings {
  mascotEnabled: boolean
  /**
   * 上次「应用并保存」的皮肤 id（null = 无皮肤偏好）。
   *
   * 官方 ThemeSettingsSchema.preference 只接受 light/dark/system，第三方
   * 皮肤 id 无法写入宿主 settings —— 皮肤中心在自身命名空间记忆用户
   * 选择，浏览器半边启动时恢复（详见 src/client/index.ts 的收敛逻辑）。
   */
  activeSkin: string | null
  /**
   * 吉祥物语录语言（quotes.ts 中/英双池，默认中文）。
   */
  quoteLang: 'zh' | 'en'
  /**
   * 动画播放策略：'system' 跟随系统「减少动态效果」（默认，无障碍友好）；
   * 'always' 忽略系统偏好、始终播放动画（部分用户系统动画被全局关闭，
   * 皮肤中心的动效被连坐静止时，用它找回）。
   */
  animations: 'system' | 'always'
  /**
   * 任务完成提醒：'off' 关 / 'sound' 提示音 / 'motion' 吉祥物庆祝 /
   * 'both' 两者（默认）。信号源是发送按钮的禁用恢复（见 taskNotify.ts）。
   */
  notifyTaskDone: 'off' | 'sound' | 'motion' | 'both'
}

const DEFAULTS: SkinStudioSettings = { mascotEnabled: true, activeSkin: null, quoteLang: 'zh', animations: 'system', notifyTaskDone: 'both' }

type Listener = (settings: SkinStudioSettings) => void
const listeners = new Set<Listener>()

function read(): SkinStudioSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<SkinStudioSettings>
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

let current: SkinStudioSettings = read()

/** 试穿态（内存级，不持久化 —— 刷新即还原到已保存皮肤）。 */
export interface TryOnState {
  skinId: string
  /** 首次试穿前的主题偏好（退出还原的基准）。 */
  previousPreference: string | undefined
}
let tryOn: TryOnState | null = null

function write(next: SkinStudioSettings): void {
  current = next
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 隐私模式等场景写入失败不致命，内存态仍然生效
    }
  }
  for (const listener of listeners) listener(current)
}

export const skinStudioSettings = {
  get(): SkinStudioSettings {
    return current
  },
  /**
   * 试穿态（内存级，不持久化）：非 null 时主题监听不写 activeSkin 记忆 ——
   * 试穿只是临时预览，刷新/重开还原到已保存皮肤；「应用并保存」才落记忆。
   * 模块级单例：皮肤中心面板关闭重开后试穿预览与决策条仍延续。
   */
  getTryOn(): TryOnState | null {
    return tryOn
  },
  setTryOn(state: TryOnState | null): void {
    tryOn = state
  },
  isTryOnActive(): boolean {
    return tryOn !== null
  },
  setMascotEnabled(enabled: boolean): void {
    write({ ...current, mascotEnabled: enabled })
  },
  getActiveSkin(): string | null {
    return current.activeSkin
  },
  setActiveSkin(id: string | null): void {
    if (current.activeSkin === id) return
    write({ ...current, activeSkin: id })
  },
  getQuoteLang(): 'zh' | 'en' {
    return current.quoteLang
  },
  setQuoteLang(lang: 'zh' | 'en'): void {
    if (current.quoteLang === lang) return
    write({ ...current, quoteLang: lang })
  },
  getAnimations(): 'system' | 'always' {
    return current.animations
  },
  setAnimations(mode: 'system' | 'always'): void {
    if (current.animations === mode) return
    write({ ...current, animations: mode })
  },
  getNotifyTaskDone(): 'off' | 'sound' | 'motion' | 'both' {
    return current.notifyTaskDone
  },
  setNotifyTaskDone(mode: 'off' | 'sound' | 'motion' | 'both'): void {
    if (current.notifyTaskDone === mode) return
    write({ ...current, notifyTaskDone: mode })
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
