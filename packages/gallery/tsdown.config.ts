/**
 * 库构建：产出 DSH 加载的 lib/index.js（node 半边）+ lib/client.js（浏览器
 * 半边，__ModuleLoader__ 包装 + CSS Modules 内联）。
 *
 * 直接复用 deepseek-harness 的官方 clientBundle 预设（同一仓库检出，
 * 相对路径引入），保证与 DSH 宿主的 bundle 契约零漂移。
 */
import { clientBundle } from '../../../deepseek-harness/packages/client/tsdown.client.ts'

export default clientBundle(
  '@dsh-skin-studio/gallery',
  ['lib/types/index.js'],
)
