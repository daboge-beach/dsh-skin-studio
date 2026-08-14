/**
 * demo 宿主的 mock ClientContext。
 *
 * 只在 demo（pnpm dev）里使用 —— 真实 DSH 提供官方 ClientContext。
 * mock 面向官方语义（deepseek-harness/packages/client/ui-theme）：
 *   - ThemeRuntime：register / setTheme / getTheme + theme/change 事件，
 *     偏好持久化到 localStorage（模拟官方 settings scope 持久化）。
 *   - ThemePresenter：订阅 theme/change，把 active.tokens 投射到 body.style
 *     的 --dsw-alias-* 变量 + body[data-ds-dark-theme]（官方做法的镜像）。
 *   - slots.sidebar.register：收集侧边栏入口，shell 渲染成左边栏。
 */
import type { ClientContext, SidebarEntry } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeDefinition, ThemePreference, ThemeRuntime, ThemeSnapshot } from '@dsh-skin-studio/types'

type ThemeChangeListener = (snapshot: ThemeSnapshot) => void
type DisposeListener = () => void

const PREFERENCE_KEY = 'dsh-skin-studio-demo:theme-preference'

/** 官方设计语言的基础调色板（light/dark 两档，--dsw-alias-* 兜底值）。 */
const BASE_LIGHT: Record<string, string> = {
  '--dsw-alias-bg-base': '#f8fafc',
  '--dsw-alias-bg-layer-1': '#ffffff',
  '--dsw-alias-bg-layer-2': '#f1f5f9',
  '--dsw-alias-bg-overlay': '#ffffff',
  '--dsw-alias-border-l1': '#e2e8f0',
  '--dsw-alias-border-l2': '#cbd5e1',
  '--dsw-alias-brand-primary': '#3b82f6',
  '--dsw-alias-brand-hover': '#2563eb',
  '--dsw-alias-label-primary': '#0f172a',
  '--dsw-alias-label-secondary': '#64748b',
  '--dsw-alias-state-error-primary': '#ef4444',
  '--dsw-alias-state-success-primary': '#10b981',
  '--dsw-alias-state-warn-primary': '#f59e0b',
  '--dsw-specific-sidebar-fill': '#f1f5f9',
}

const BASE_DARK: Record<string, string> = {
  '--dsw-alias-bg-base': '#0f172a',
  '--dsw-alias-bg-layer-1': '#1e293b',
  '--dsw-alias-bg-layer-2': '#334155',
  '--dsw-alias-bg-overlay': '#1e293b',
  '--dsw-alias-border-l1': '#334155',
  '--dsw-alias-border-l2': '#475569',
  '--dsw-alias-brand-primary': '#60a5fa',
  '--dsw-alias-brand-hover': '#93c5fd',
  '--dsw-alias-label-primary': '#f1f5f9',
  '--dsw-alias-label-secondary': '#94a3b8',
  '--dsw-alias-state-error-primary': '#f87171',
  '--dsw-alias-state-success-primary': '#34d399',
  '--dsw-alias-state-warn-primary': '#fbbf24',
  '--dsw-specific-sidebar-fill': '#0f172a',
}

class MockThemeRuntime implements ThemeRuntime {
  #themes: ThemeDefinition[] = [
    { id: 'light', colorScheme: 'light', tokens: {} },
    { id: 'dark', colorScheme: 'dark', tokens: {} },
  ]
  #preference: ThemePreference = 'light'
  #revision = 0
  #snapshot: ThemeSnapshot
  #listeners = new Set<ThemeChangeListener>()

  constructor() {
    this.#snapshot = this.#build()
    this.#present()
  }

  /** demo 专用：内置皮肤主题注册完后，采纳上次会话持久化的偏好。 */
  adoptSavedPreference(): void {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(PREFERENCE_KEY) : null
    if (saved === null) return
    if (saved === 'light' || saved === 'dark' || saved === 'system' || this.#themes.some(t => t.id === saved)) {
      this.#preference = saved as ThemePreference
      this.#publish()
    }
  }

  #build(): ThemeSnapshot {
    const activeId = this.#preference === 'system'
      ? (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : this.#preference
    const fallback: ThemeDefinition = { id: 'light', colorScheme: 'light', tokens: {} }
    const active = this.#themes.find(t => t.id === activeId) ?? this.#themes[0] ?? fallback
    return { preference: this.#preference, active, themes: [...this.#themes], revision: this.#revision }
  }

  /** demo 的 ThemePresenter：snapshot → DOM（官方 ui-layout 的镜像）。 */
  #present(): void {
    if (typeof document === 'undefined') return
    const { active } = this.#snapshot
    const base = active.colorScheme === 'dark' ? BASE_DARK : BASE_LIGHT
    for (const [name, value] of Object.entries({ ...base, ...active.tokens })) {
      document.body.style.setProperty(name, value)
    }
    document.body.style.colorScheme = active.colorScheme
    document.body.toggleAttribute('data-ds-dark-theme', active.colorScheme === 'dark')
  }

  #publish(): void {
    this.#revision += 1
    this.#snapshot = this.#build()
    this.#present()
    for (const listener of [...this.#listeners]) listener(this.#snapshot)
  }

  getTheme(): ThemeSnapshot {
    return this.#snapshot
  }

  setTheme(id: string): void {
    if (id !== 'system' && !this.#themes.some(t => t.id === id)) {
      throw new Error(`theme "${id}" is not registered`)
    }
    if (this.#preference === id) return
    this.#preference = id as ThemePreference
    try { localStorage.setItem(PREFERENCE_KEY, id) } catch { /* 忽略 */ }
    this.#publish()
  }

  register(definition: ThemeDefinition): () => void {
    if (this.#themes.some(t => t.id === definition.id)) {
      throw new Error(`theme "${definition.id}" already registered`)
    }
    this.#themes = [...this.#themes, definition]
    this.#publish()
    return () => {
      this.#themes = this.#themes.filter(t => t.id !== definition.id)
      if (this.#preference === definition.id) this.#preference = 'light'
      this.#publish()
    }
  }

  overrideTokens(_source: string, _tokens: never): () => void {
    throw new Error('demo 不支持 overrideTokens')
  }

  exportInspectTokens(): never[] {
    return []
  }

  /** demo 专用：theme/change 订阅（正式通道是 ctx.on）。 */
  subscribe(listener: ThemeChangeListener): () => void {
    this.#listeners.add(listener)
    return () => { this.#listeners.delete(listener) }
  }
}

export interface MockHost {
  ctx: ClientContext
  /** 侧边栏入口的 React 订阅面。 */
  sidebarEntries: () => readonly SidebarEntry[]
  subscribeEntries: (listener: () => void) => () => void
  dispose: () => void
}

/** 造一个最小可用的 mock ClientContext + 宿主壳。 */
export function createMockHost(initialThemes: readonly ThemeDefinition[]): MockHost {
  const runtime = new MockThemeRuntime()
  for (const def of initialThemes) runtime.register(def)
  runtime.adoptSavedPreference()

  let entries: SidebarEntry[] = []
  const entryListeners = new Set<() => void>()
  const disposeListeners = new Set<DisposeListener>()
  const cleanups: Array<() => void> = []

  const onThemeChange = (listener: ThemeChangeListener): (() => void) => runtime.subscribe(listener)

  const ctx: ClientContext = {
    theme: runtime,
    slots: {
      sidebar: {
        register(entry) {
          entries = [...entries, entry]
          for (const l of [...entryListeners]) l()
          return () => {
            entries = entries.filter(e => e.id !== entry.id)
            for (const l of [...entryListeners]) l()
          }
        },
      },
      register(_options, _component) {
        throw new Error('demo 宿主走简化 sidebar 契约，不支持通用 slots.register')
      },
      inject(_name, _factory) {
        throw new Error('demo 宿主走简化 sidebar 契约，不支持通用 slots.inject')
      },
    },
    inject(_deps, callback) {
      // demo：服务同步就绪，直接执行
      callback(ctx)
    },
    effect(setup, _label) {
      cleanups.push(setup())
    },
    on(event, listener) {
      if (event === 'theme/change') return onThemeChange(listener as ThemeChangeListener)
      if (event === 'dispose') {
        disposeListeners.add(listener as DisposeListener)
        return () => { disposeListeners.delete(listener as DisposeListener) }
      }
      return () => {}
    },
  }

  return {
    ctx,
    sidebarEntries: () => entries,
    subscribeEntries(listener) {
      entryListeners.add(listener)
      return () => { entryListeners.delete(listener) }
    },
    dispose() {
      for (const fn of [...disposeListeners]) fn()
      for (const cleanup of cleanups.splice(0)) {
        try { cleanup() } catch { /* demo 容错 */ }
      }
    },
  }
}
