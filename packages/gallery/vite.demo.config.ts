/**
 * 静态演示构建（GitHub Pages 用；开发服务器配置见 vite.config.ts）。
 *
 * - root = dev/（mock 宿主壳），base = 仓库 Pages 子路径
 * - 产物 dist-demo/：壳 + 插件 bundle；皮肤资产由 scripts/build-demo.mjs
 *   按 `/skins/{id}/assets/*` 原路径拷入（客户端 URL 约定不变）
 * - 单页无前端路由：Pages 刷新无需 SPA fallback
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import baseConfig from './vite.config.ts'

export default defineConfig({
  ...baseConfig,
  base: '/dsh-skin-studio/',
  build: {
    outDir: resolve(dirname(fileURLToPath(import.meta.url)), 'dist-demo'),
    emptyOutDir: true,
  },
})
