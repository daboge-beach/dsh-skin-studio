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
  /**
   * 境界档位（推理等级联动）：'auto' 跟随 DSH 推理等级（DOM 读取，见
   * tierPower.ts）；'t0'~'t3' 手动锁定。档位驱动吉祥物造型 / 光标配色 /
   * 背景装饰强度（凡人系=修为境界、LOL 系=皮肤等级，逐级递进）。
   */
  powerTier: 'auto' | 't0' | 't1' | 't2' | 't3'
  /**
   * 磨玻璃工作区（默认开）：皮肤背景图铺满窗口，界面面板半透明 +
   * backdrop-blur，背景图从工作区透出。关闭则回到实色面板。
   */
  glass: boolean
  /**
   * 皮肤光标（默认开）：三态自定义光标。部分皮肤光标热点偏移影响点击
   * 精度时可关闭，回退系统光标。
   */
  cursorFx: boolean
  /**
   * 滑条同步推理等级（默认关）：开启后手动拉动境界滑条会真实修改当前
   * 会话的推理等级（走官方 modelDirectories.selectModel 接口）。注意
   * 这会改变实际推理强度/token 消耗，故默认关闭。
   */
  tierSyncEffort: boolean
}

const DEFAULTS: SkinStudioSettings = { mascotEnabled: true, activeSkin: null, quoteLang: 'zh', animations: 'system', notifyTaskDone: 'both', powerTier: 'auto', glass: true, cursorFx: true, tierSyncEffort: true }

type Listener = (settings: SkinStudioSettings) => void
const listeners = new Set<Listener>()

/**
 * 设置存储版本：升级时对存量数据做一次性迁移（新引入字段的默认值对齐）。
 * v2：tierSyncEffort 默认改开 —— 早期版本拖滑条时曾把旧默认 false 一并
 * 持久化，无版本号无法区分「显式关闭」与「被动写入的旧默认」，迁移时
 * 统一对齐新默认；用户此后显式操作以 __v=2 落盘，不再被覆盖。
 */
const SETTINGS_VERSION = 2

function read(): SkinStudioSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<SkinStudioSettings> & { __v?: number }
    const merged = { ...DEFAULTS, ...parsed } as SkinStudioSettings
    if (parsed.__v !== SETTINGS_VERSION) {
      // 一次性迁移：版本间新增/改默认的字段在此对齐
      if (parsed.tierSyncEffort === undefined || parsed.__v === undefined) {
        merged.tierSyncEffort = DEFAULTS.tierSyncEffort
      }
    }
    return merged
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, __v: SETTINGS_VERSION }))
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
  getPowerTier(): 'auto' | 't0' | 't1' | 't2' | 't3' {
    return current.powerTier
  },
  setPowerTier(tier: 'auto' | 't0' | 't1' | 't2' | 't3'): void {
    if (current.powerTier === tier) return
    write({ ...current, powerTier: tier })
  },
  getGlass(): boolean {
    return current.glass
  },
  setGlass(on: boolean): void {
    if (current.glass === on) return
    write({ ...current, glass: on })
  },
  getCursorFx(): boolean {
    return current.cursorFx
  },
  setCursorFx(on: boolean): void {
    if (current.cursorFx === on) return
    write({ ...current, cursorFx: on })
  },
  getTierSyncEffort(): boolean {
    return current.tierSyncEffort
  },
  setTierSyncEffort(on: boolean): void {
    if (current.tierSyncEffort === on) return
    write({ ...current, tierSyncEffort: on })
  },
  /**
   * 一键还原出厂：全部设置回默认值、清除皮肤偏好与试穿态
   * （主题本身由调用方切回原生偏好，见 GalleryPanel 的还原入口）。
   */
  resetAll(): void {
    tryOn = null
    write({ ...DEFAULTS })
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
