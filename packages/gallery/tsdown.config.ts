/**
 * 库构建：产出 DSH 加载的 lib/index.js（node 半边）+ lib/client.js（浏览器
 * 半边，__ModuleLoader__ 包装 + CSS Modules 内联）。
 *
 * 本机有 deepseek-harness 检出时复用官方 clientBundle 预设（bundle 契约
 * 零漂移）；CI 等未检出环境回退最小配置（完整构建在本机接线时执行，
 * CI 仅做 typecheck/test 校验）。
 */
import { existsSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const officialPreset = resolve(here, '../../../deepseek-harness/packages/client/tsdown.client.ts')

export default existsSync(officialPreset)
  ? await import(pathToFileURL(officialPreset).href).then(m => m.clientBundle(
      '@dsh-skin-studio/gallery',
      ['lib/types/index.js'],
    ))
  : { entry: [resolve(here, 'lib/index.js')], outDir: resolve(here, 'lib'), format: 'esm', skipNodeModulesBundle: true }
