/**
 * demo 宿主开发服务器（pnpm dev）。
 *
 * - root = dev/（mock DSH 宿主：mock ClientContext + 侧边栏 shell）
 * - /skins/{id}/assets/* 中间件直接映射到 packages/skins/{id}/assets/，
 *   与真实 DSH 的静态资源路径约定一致（builtinSkins.ts 里的 URL 原样可用）。
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const skinsDir = resolve(here, '../skins')

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  json: 'application/json',
}

/** 把 /skins/{skinId}/assets/{file} 映射到仓库内真实皮肤包资源。 */
function dshSkinsAssets(): Plugin {
  return {
    name: 'dsh-skins-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = /^\/skins\/([a-z0-9-]+)\/assets\/([a-zA-Z0-9_./-]+)$/.exec(req.url ?? '')
        if (match === null) { next(); return }
        const skinId = match[1] ?? ''
        const file = match[2] ?? ''
        if (skinId === '' || file === '') { next(); return }
        const full = resolve(skinsDir, skinId, 'assets', file)
        if (!full.startsWith(skinsDir)) {
          res.statusCode = 403
          res.end()
          return
        }
        void stat(full).then(info => {
          if (!info.isFile()) throw new Error('not a file')
          res.statusCode = 200
          const ext = file.split('.').pop() ?? ''
          res.setHeader('content-type', MIME[ext] ?? 'application/octet-stream')
          createReadStream(full).pipe(res)
        }, () => {
          res.statusCode = 404
          res.end('skin asset not found')
        })
      })
    },
  }
}

export default defineConfig({
  root: 'dev',
  plugins: [dshSkinsAssets()],
  server: {
    port: 5173,
    fs: { allow: [resolve(here, '../..')] }, // 允许引用 packages/skins 下的资源
  },
})
