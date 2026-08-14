/**
 * 全局浮层（吉祥物 + 切换特效）挂载到独立的 React root + 全局样式注入。
 *
 * 浮层必须活在画廊面板之外（皮肤应用后主界面右下角仍要显示）。
 * 样式用 data-plugin 标签注入（与 DSH clientBundle 的 CSS 注入约定一致，
 * 宿主 loader 卸载插件时会移除同标签样式）。
 */
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { MascotFloat } from './MascotFloat.tsx'
import { TransitionFx } from './TransitionFx.tsx'

/** docs/FANREN_SKINS_DESIGN.md §三：切换时整体淡入淡出（400ms）+ 吉祥物帧动画。 */
const GLOBAL_CSS = [
  'body { transition: background-color 400ms ease, color 400ms ease; }',
  '@media (prefers-reduced-motion: reduce) { body { transition: none; } }',
  // 吉祥物 4 帧步进（全局未哈希名 —— MascotFloat 用内联 style 引用，
  // 规避个别环境对 class 规则里 animation 的清覆）
  '@keyframes xl-mascot-frames {',
  '  0%   { background-position: 0% 0%; }',
  '  25%  { background-position: 100% 0%; }',
  '  50%  { background-position: 0% 100%; }',
  '  75%  { background-position: 100% 100%; }',
  '}',
].join('\n')

/** 注入全局样式标签（幂等；返回移除函数）。 */
function injectGlobalStyle(): () => void {
  if (typeof document === 'undefined') return () => {}
  const tagId = '@dsh-skin-studio/gallery/global'
  if (document.querySelector(`style[data-plugin-css='${tagId}']`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = '@dsh-skin-studio/gallery'
  tag.dataset.pluginCss = tagId
  tag.textContent = GLOBAL_CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

/**
 * 挂载全局浮层（吉祥物 + 切换特效）+ 全局样式。
 * @param ctx - 插件上下文（浮层内部各自订阅 theme/change）。
 * @returns 卸载函数（unmount + 清理 DOM，无内存泄漏）。
 */
export function mountOverlays(ctx: ClientContext): () => void {
  if (typeof document === 'undefined') return () => {}
  const disposeStyle = injectGlobalStyle()

  const container = document.createElement('div')
  container.dataset.dshSkinStudio = 'overlays'
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(createElement(() => createElement('div', null,
    createElement(MascotFloat, { ctx }),
    createElement(TransitionFx, { ctx }),
  )))

  return () => {
    root.unmount()
    container.remove()
    disposeStyle()
  }
}
