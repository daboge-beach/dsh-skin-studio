#!/usr/bin/env node
/**
 * clean.mjs — 跨平台清理构建产物（替代 `rm -rf`，Windows 原生 shell 不可靠）。
 *
 * 清理范围：各 workspace 包的 lib/、dist/、coverage/ 与根目录 tsconfig 暂存。
 * 不删 node_modules（用 pnpm install 重装即可，删了反而拖慢下次安装）。
 */
import { rmSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspaces = ['packages/*', 'packages/skins/*']

const dirs = []
for (const pattern of workspaces) {
  const base = join(root, pattern.slice(0, pattern.indexOf('*')))
  if (!existsSync(base)) continue
  for (const name of readdirSync(base)) {
    dirs.push(join(base, name, 'lib'), join(base, name, 'dist'), join(base, name, 'coverage'))
  }
}
dirs.push(join(root, 'coverage'), join(root, 'dist'))

let removed = 0
for (const dir of dirs) {
  if (!existsSync(dir)) continue
  rmSync(dir, { recursive: true, force: true })
  console.log(`✓ 已清理 ${dir}`)
  removed++
}
console.log(removed === 0 ? '（无构建产物需要清理）' : `共清理 ${removed} 个目录`)
