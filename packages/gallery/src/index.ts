/**
 * @dsh-skin-studio/gallery · Node 半边（宿主插件）。
 *
 * 职责：在 DSH webServer 上注册 `/skins/{id}/assets/*` 静态路由，把仓库内
 * packages/skins 各皮肤包 assets/ 目录的图片资源提供给浏览器（画廊缩略图 / 详情
 * 立绘 / 吉祥物 sprite）。路径约定与 docs/FANREN_SKINS_DESIGN.md 的光标
 * 资源路径一致。浏览器半边在 src/client/（见 package.json 的 ./client 出口）。
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HostContext } from '@dsh-skin-studio/gallery/host'

/** 服务哪个插件包的静态资源（webServer 卸载本插件时一并撤掉路由）。 */
export const inject = ['webServer']

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

/** 皮肤包资源根：packages/gallery/../skins（import.meta.url 位于包内 lib/）。 */
const SKINS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../skins')

const SKIN_ASSET_PATH = /^\/skins\/([a-z0-9-]+)\/assets\/([A-Za-z0-9_./-]+)$/

/**
 * 注册皮肤静态资源路由。
 * @param ctx - 宿主插件上下文（webServer 服务）。
 */
export function apply(ctx: HostContext): void {
  ctx.webServer.register({
    kind: 'prefix',
    path: '/skins',
    handler: async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405)
        res.end()
        return
      }
      const url = new URL(req.url ?? '/', 'http://skins.local')
      const match = SKIN_ASSET_PATH.exec(url.pathname)
      const skinId = match?.[1]
      const file = match?.[2]
      if (skinId === undefined || file === undefined || file.includes('..')) {
        res.writeHead(404)
        res.end()
        return
      }
      const full = resolve(SKINS_ROOT, skinId, 'assets', file)
      if (!full.startsWith(SKINS_ROOT)) {
        res.writeHead(403)
        res.end()
        return
      }
      try {
        const info = await stat(full)
        if (!info.isFile()) throw new Error('not a file')
        const ext = file.split('.').pop() ?? ''
        res.writeHead(200, {
          'content-type': MIME[ext] ?? 'application/octet-stream',
          'cache-control': 'public, max-age=3600',
        })
        if (req.method === 'HEAD') {
          res.end()
          return
        }
        createReadStream(full).pipe(res)
      } catch {
        res.writeHead(404)
        res.end('skin asset not found')
      }
    },
  })
}

export const name = '@dsh-skin-studio/gallery'
