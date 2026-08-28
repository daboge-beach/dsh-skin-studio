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
  json: 'application/json',
}

/** 皮肤包资源根：packages/gallery/../skins（import.meta.url 位于包内 lib/）。 */
// SKINS_ROOT：优先环境变量 DSH_SKIN_STUDIO_ROOT；缺省相对包内 lib/ 的
// ../../skins（monorepo 结构）——npm 安装时用户通过环境变量指向皮肤目录
const SKINS_ROOT = process.env.DSH_SKIN_STUDIO_ROOT !== undefined
  ? resolve(process.env.DSH_SKIN_STUDIO_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '../../skins')

const SKIN_ASSET_PATH = /^\/skins\/([a-z0-9-]+)\/assets\/([A-Za-z0-9_./-]+)$/

/**
 * 注册皮肤静态资源路由。
 * @param ctx - 宿主插件上下文（webServer 服务）。
 */
export function apply(ctx: HostContext): void {
  // 自定义背景上传：POST /skins/upload-bg { skinId, tier, dataBase64 }
  // 存为 tiers/t{n}/bg.custom.png（不覆盖生图资产，GET 优先返回）。
  ctx.webServer.register({
    kind: 'exact',
    path: '/skins/upload-bg',
    handler: async (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405)
        res.end()
        return
      }
      try {
        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
          if (chunks.reduce((n, c) => n + c.length, 0) > 15 * 1024 * 1024) throw new Error('payload too large')
        }
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
          skinId?: unknown; tier?: unknown; dataBase64?: unknown
        }
        const skinId = String(body.skinId ?? '')
        const tier = Number(body.tier)
        const dataBase64 = String(body.dataBase64 ?? '')
        if (!/^[a-z0-9-]+$/.test(skinId) || !Number.isInteger(tier) || tier < 0 || tier > 4) {
          res.writeHead(400); res.end('bad skinId/tier'); return
        }
        const buf = Buffer.from(dataBase64, 'base64')
        if (buf.length < 100 || buf.length > 12 * 1024 * 1024) {
          res.writeHead(400); res.end('bad image size'); return
        }
        const dir = resolve(SKINS_ROOT, skinId, 'assets', 'tiers', `t${tier}`)
        const { mkdir } = await import('node:fs/promises')
        await mkdir(dir, { recursive: true })
        const { writeFile } = await import('node:fs/promises')
        await writeFile(resolve(dir, 'bg.custom.png'), buf)
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' })
        res.end(JSON.stringify({ ok: true, bytes: buf.length }))
      } catch (e) {
        res.writeHead(500)
        res.end(String(e))
      }
    },
  })

  // 恢复原图：POST /skins/reset-bg { skinId, tier } 删除该档自定义背景
  ctx.webServer.register({
    kind: 'exact',
    path: '/skins/reset-bg',
    handler: async (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405)
        res.end()
        return
      }
      try {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { skinId?: unknown; tier?: unknown }
        const skinId = String(body.skinId ?? '')
        const tier = Number(body.tier)
        if (!/^[a-z0-9-]+$/.test(skinId) || !Number.isInteger(tier) || tier < 0 || tier > 4) {
          res.writeHead(400); res.end('bad skinId/tier'); return
        }
        const custom = resolve(SKINS_ROOT, skinId, 'assets', 'tiers', `t${tier}`, 'bg.custom.png')
        if (custom.startsWith(SKINS_ROOT)) {
          const { unlink } = await import('node:fs/promises')
          await unlink(custom).catch(() => undefined) // 无自定义图时幂等成功
        }
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(500)
        res.end(String(e))
      }
    },
  })

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
      // 境界档位资产（tiers/t{n}/x）缺失时回退到原资产（x），避免档位
      // 资产生成不完整时吉祥物/光标整体消失；背景图优先用户上传的
      // bg.custom.png（/skins/upload-bg 写入，不覆盖生图资产）
      const tierMatch = /^tiers\/t\d\/(.+)$/.exec(file)
      const customMatch = tierMatch !== null && tierMatch[1] === 'bg.png'
        ? resolve(SKINS_ROOT, skinId, 'assets', `tiers/t${file.slice('tiers/t'.length, 'tiers/t'.length + 1)}`, 'bg.custom.png')
        : null
      if (customMatch !== null && customMatch.startsWith(SKINS_ROOT)) {
        try {
          const st = await stat(customMatch)
          if (st.isFile()) {
            res.writeHead(200, {
              'content-type': 'image/png',
              'cache-control': 'no-cache',
            })
            if (req.method === 'HEAD') { res.end(); return }
            createReadStream(customMatch).pipe(res)
            return
          }
        } catch { /* 无自定义图，走正常链 */ }
      }
      const full = resolve(SKINS_ROOT, skinId, 'assets', file)
      if (!full.startsWith(SKINS_ROOT)) {
        res.writeHead(403)
        res.end()
        return
      }
      let realFile = full
      try {
        const info = await stat(full)
        if (!info.isFile()) throw new Error('not a file')
      } catch {
        if (tierMatch === null) {
          res.writeHead(404)
          res.end('skin asset not found')
          return
        }
        realFile = resolve(SKINS_ROOT, skinId, 'assets', tierMatch[1] ?? '')
        try {
          const fallback = await stat(realFile)
          if (!fallback.isFile()) throw new Error('not a file')
        } catch {
          res.writeHead(404)
          res.end('skin asset not found')
          return
        }
      }
      try {
        const ext = realFile.split('.').pop() ?? ''
        res.writeHead(200, {
          'content-type': MIME[ext] ?? 'application/octet-stream',
          // 皮肤资产（尤其分档 bg）会原地更新，禁强缓存避免换图后仍见旧图
          'cache-control': 'no-cache',
        })
        if (req.method === 'HEAD') {
          res.end()
          return
        }
        createReadStream(realFile).pipe(res)
      } catch {
        res.writeHead(404)
        res.end('skin asset not found')
      }
    },
  })
}

export const name = '@dsh-skin-studio/gallery'
