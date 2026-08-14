/**
 * 皮肤中心的宿主面适配（两种运行环境，一个入口检测）。
 *
 * 1. 真实 DSH（官方 slot 系统）：把画廊注册为 `settings.section` 的一个
 *    页面（DSH 设置面板内的「皮肤中心」分节），官方推荐跨包注册方式
 *    ctx.slots.inject(name, factory)。
 * 2. 简化契约面（docs/FRONTEND_REQUIREMENTS.md 给出的
 *    ctx.slots.sidebar.register 签名）：demo 宿主 / mock host 提供。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createElement } from 'react'
import { GalleryPanel } from './GalleryPanel.tsx'
import { PaletteIcon } from './icons.tsx'

/** 用 apply 闭包里的 ctx 造出真正渲染画廊的分节组件（.ts 入口里避免 JSX）。 */
export function createSectionComponent(ctx: ClientContext): () => JSX.Element {
  return () => createElement(GalleryPanel, { ctx })
}

/** 真实 DSH 注册：settings.section 的「皮肤中心」分节。返回撤销函数。 */
export function registerSettingsSection(ctx: ClientContext): () => void {
  return ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'skin-studio',
        order: 50,
        label: '皮肤中心',
        registrant: '@dsh-skin-studio/gallery',
      },
      createSectionComponent(ctx),
    ),
  )
}

/** 简化契约面注册（demo 宿主）：侧边栏 Skin Studio 入口。 */
export function registerSimplifiedSidebar(ctx: ClientContext): () => void {
  return ctx.slots.sidebar!.register({
    id: 'skin-studio',
    title: 'Skin Studio',
    icon: PaletteIcon({ size: 20 }),
    panel: createElement(GalleryPanel, { ctx }),
  })
}
