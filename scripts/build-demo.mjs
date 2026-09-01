#!/usr/bin/env node
/**
 * build-demo.mjs — 构建静态演示（GitHub Pages 产物）。
 *
 * 1. vite build（vite.demo.config.ts：root=dev，base=/dsh-skin-studio/）
 * 2. 拷贝 packages/skins 各包 assets → dist-demo/skins/{id}/assets
 *    （客户端的 /skins/… URL 约定不变；Pages 子路径由 assetBase 注入）
 * 3. 体积报告 + 抽样校验（index.html / 皮肤资产 / quotes.json）
 */
import { cpSync, existsSync, statSync, readdirSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const GALLERY = join(REPO, 'packages', 'gallery')
const SKINS = join(REPO, 'packages', 'skins')
const DIST = join(GALLERY, 'dist-demo')

function fail(msg) { console.error(`✗ ${msg}`); process.exit(1) }

// 1. vite build
console.log('· vite build（demo 壳）…')
const build = spawnSync('pnpm', ['exec', 'vite', 'build', '--config', 'vite.demo.config.ts'], {
  cwd: GALLERY, stdio: 'inherit', shell: process.platform === 'win32',
})
if (build.status !== 0) fail('vite build 失败')

// 2. 皮肤资产拷贝
mkdirSync(join(DIST, 'skins'), { recursive: true })
let copied = 0
let bytes = 0
for (const id of readdirSync(SKINS)) {
  const assets = join(SKINS, id, 'assets')
  if (!existsSync(assets)) continue
  cpSync(assets, join(DIST, 'skins', id, 'assets'), { recursive: true })
  copied += 1
  for (const f of walk(assets)) bytes += statSync(f).size
}
function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

// 3. 校验
const checks = [
  join(DIST, 'index.html'),
  join(DIST, 'skins', 'hanli-daoist', 'assets', 'preview.png'),
  join(DIST, 'skins', 'hanli-daoist', 'assets', 'quotes.json'),
  join(DIST, 'skins', 'hanli-daoist', 'assets', 'cursors', 'sword-default.svg'),
]
for (const f of checks) {
  if (!existsSync(f)) fail(`产物缺失：${f}`)
}
const html = readText(join(DIST, 'index.html'))
if (!html.includes('/dsh-skin-studio/')) fail('index.html 未包含 base 路径（vite base 未生效）')

console.log(`✓ 静态演示构建完成：${copied} 款皮肤资产（${(bytes / 1048576).toFixed(0)}MB）`)
console.log(`  dist-demo/ 总计 ${(dirSize(DIST) / 1048576).toFixed(0)}MB`)
console.log('  本地预览：pnpm exec serve dist-demo（或任意静态服务器，路径前缀 /dsh-skin-studio/）')

function readText(p) { return readFileSync(p, 'utf8') }
function dirSize(d) {
  let n = 0
  for (const f of walk(d)) n += statSync(f).size
  return n
}
