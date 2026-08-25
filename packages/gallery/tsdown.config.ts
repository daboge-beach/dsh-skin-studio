/**
 * 库构建：产出 DSH 加载的 lib/index.js（node 半边）+ lib/client.js（浏览器
 * 半边，__ModuleLoader__ 包装 + CSS Modules 内联）。
 *
 * 本机有 deepseek-harness 检出时复用官方 clientBundle 预设（bundle 契约
 * 零漂移）；CI 等未检出环境 tsc 已产出 lib/index.js，直接打包该产物
 *（ESM 直通；完整宿主 bundle 仍在本机接线时执行）。
 */
import { existsSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const officialPreset = resolve(here, '../../../deepseek-harness/packages/client/tsdown.client.ts')
const built = resolve(here, 'lib/index.js')

export default existsSync(officialPreset)
  ? await import(pathToFileURL(officialPreset).href).then(m => m.clientBundle(
      '@dsh-skin-studio/gallery',
      ['lib/types/index.js'],
    ))
  : existsSync(built)
    ? { entry: [built], outDir: resolve(here, 'lib'), format: 'esm', skipNodeModulesBundle: true }
    : { entry: [], outDir: resolve(here, 'lib') }
