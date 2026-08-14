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
}

const DEFAULTS: SkinStudioSettings = { mascotEnabled: true, activeSkin: null }

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
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
