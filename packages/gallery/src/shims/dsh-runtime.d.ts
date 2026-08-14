/**
 * DSH 官方 SDK 的类型 shim（仅类型，编译期即被擦除）。
 *
 * 为什么存在：`@deepseek-ai/dsh-client-runtime` / `@deepseek-ai/cordis` 由
 * DSH 宿主在运行时提供（见 docs/SKIN_SPEC.md §6、docs/DEVELOPMENT.md），
 * 不随本仓库安装。插件代码里对它们只做 `import type`，构建产物中零运行时
 * 依赖；本文件按官方源码（deepseek-harness/packages/client/ui-theme、
 * ui-slots、runtime、host/webserver）的最小面重建类型，保证
 * `tsc --noEmit` 严格模式可检。接入真实 DSH 时若签名有出入，以官方类型
 * 为准（docs/FRONTEND_REQUIREMENTS.md 联调说明）。
 */
declare module '@deepseek-ai/dsh-client-runtime/client' {
  import type { ReactNode } from 'react'
  import type { ThemeRuntime, ThemeSnapshot } from '@dsh-skin-studio/types'

  // ── 官方 slot 系统（ui-slots）的最小面 ──────────────────────────────
  // 真实签名是重泛型的 SlotCore.register；此处按我们用到的注册面收窄。

  /** settings.section 槽位宿主参数（ui-settings contract）。 */
  interface SettingsSectionOwnerProps {
    /** 关闭设置面板（外壳持有开合状态）。 */
    close: () => void
  }

  /** slots.register 的注册项（我们用到的子集）。 */
  interface SlotRegisterOptions {
    /** 目标槽位 key（如 'settings.section'）。 */
    name: string
    /** list 槽位的条目 id。 */
    id?: string
    /** list 槽位排序。 */
    order?: number
    /** list 槽位显示文案。 */
    label?: string
    /** 诊断标签。 */
    registrant?: string
  }

  /** 官方 slot 服务：注册组件到已声明的槽位。 */
  interface SlotsService {
    /**
     * 注册组件到槽位。component 收到框架组装的 props（宿主参数 +
     * 标准席位）；返回反注册函数。
     */
    register(options: SlotRegisterOptions, component: (props: SettingsSectionOwnerProps) => ReactNode): () => void
    /**
     * 等待槽位被声明后注册（官方推荐的跨包注册方式）：声明出现时执行
     * factory，声明塌缩时自动撤销 factory 返回的 disposer，重新声明时重跑。
     */
    inject(name: string, factory: () => () => void): () => void
    /** 简化契约面（FRONTEND_REQUIREMENTS.md 给出的签名；demo 宿主与
     *  mock host 提供实现，真实 harness 无此面）。 */
    sidebar?: SidebarSlotService
  }

  /** 侧边栏入口注册项（docs/FRONTEND_REQUIREMENTS.md 界面一 · 组件结构）。 */
  interface SidebarEntry {
    id: string
    title: string
    icon: ReactNode
    panel: ReactNode
  }

  /** 简化契约的侧边栏面。 */
  interface SidebarSlotService {
    register(entry: SidebarEntry): () => void
  }

  /** ClientContext 事件表（cordis Events 合并面，本插件消费的子集）。 */
  interface ClientContextEvents {
    'theme/change'(snapshot: ThemeSnapshot): void
    'dispose'(): void
  }

  /**
   * DSH 客户端插件上下文（官方 ClientContext 的最小面）。
   * 与官方一致：所有服务调用都应放在 ctx.inject([...], ...) 回调内。
   */
  export interface ClientContext {
    readonly theme: ThemeRuntime
    readonly slots: SlotsService
    /** cordis 依赖注入：所需服务就绪后执行回调，回调内的 ctx 已保证服务可用。 */
    inject(deps: readonly string[], callback: (ctx: ClientContext) => void): void
    /** cordis effect：setup 返回清理函数，ctx 销毁时自动调用（无内存泄漏）。 */
    effect(setup: () => () => void, label?: string): void
    /** cordis 事件订阅，返回取消订阅函数。 */
    on<K extends keyof ClientContextEvents>(event: K, listener: ClientContextEvents[K]): () => void
  }
}

/** Node 半边（宿主插件）上下文的最小面：本插件只用 webServer 静态路由。 */
declare module '@dsh-skin-studio/gallery/host' {
  import type { IncomingMessage, ServerResponse } from 'node:http'

  /** webServer 路由（dsh-host-webserver WebRoute 的最小面）。 */
  interface WebRoute {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }

  /** 宿主 webServer 服务（ctx.webServer）。 */
  interface WebServerService {
    register(route: WebRoute): () => void
  }

  /** 宿主插件上下文（node 半边 apply 收到的 ctx）。 */
  export interface HostContext {
    readonly webServer: WebServerService
  }
}
