/**
 * assetBase — 皮肤静态资产 URL 的基地址（宿主差异集中处）。
 *
 * - 真实 DSH：资产由宿主 webServer 挂在站点根 `/skins/…`，基址为空串。
 * - 静态演示（GitHub Pages）：站点在子路径 `/dsh-skin-studio/` 下，
 *   demo 壳（dev/main.tsx）在加载插件前把 Vite 的 BASE_URL 写进
 *   `globalThis.__SKIN_STUDIO_ASSET_BASE__`；插件侧零依赖 Vite 环境，
 *   缺省回退空串——同一份 client bundle 在两种宿主下都正确。
 *
 * 所有 GET 型 `/skins/…` URL 必须经本模块构造（upload-bg/reset-bg 等
 * DSH 服务端 POST 路由除外——静态演示无后端，天然降级）。
 */

/** 演示壳注入的基址（无注入 = 真实 DSH = 站点根）。 */
const base: string = (() => {
  const injected = (globalThis as { __SKIN_STUDIO_ASSET_BASE__?: string }).__SKIN_STUDIO_ASSET_BASE__
  if (injected === undefined || injected === '/') return ''
  return injected.endsWith('/') ? injected.slice(0, -1) : injected
})()

/** 皮肤资产路径 → 带基址的完整 URL（path 形如 `/skins/x/assets/y.png`）。 */
export function assetUrl(path: string): string {
  return `${base}${path}`
}
