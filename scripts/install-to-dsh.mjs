#!/usr/bin/env node
/**
 * install-to-dsh.mjs — 把皮肤中心接入本机 DSH（推荐安装方式的第 2 步）。
 *
 * 做三件事（全部幂等）：
 *   1. 定位 DSH web profile（~/.dsh/profiles/web/package.json，可用
 *      DSH_PROFILE_DIR 覆盖）；
 *   2. 在其 dependencies 里加入本仓库 gallery 的 link: 依赖；
 *   3. 在 profile 目录跑 pnpm install。
 *
 * 前置：本仓库根目录已执行过 pnpm setup（依赖与皮肤资产就绪）。
 * 之后重启 DSH（dsh web）即可在 设置 → 皮肤中心 看到。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GALLERY = join(REPO, 'packages', 'gallery')
const PROFILE_DIR = process.env.DSH_PROFILE_DIR !== undefined
  ? resolve(process.env.DSH_PROFILE_DIR)
  : join(homedir(), '.dsh', 'profiles', 'web')
const PROFILE_PKG = join(PROFILE_DIR, 'package.json')

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

// 0. 前置检查：本仓库已 setup（node_modules + 至少一款皮肤资产）
if (!existsSync(join(REPO, 'node_modules'))) {
  fail('本仓库尚未安装依赖：请先在仓库根目录执行 pnpm setup')
}
if (!existsSync(join(GALLERY, 'lib', 'client.js'))) {
  console.log('· gallery 尚未构建，先执行 pnpm build …')
  const build = spawnSync('pnpm', ['--filter', '@dsh-skin-studio/gallery', 'build'], { cwd: REPO, stdio: 'inherit', shell: process.platform === 'win32' })
  if (build.status !== 0) fail('gallery 构建失败，请先手动执行 pnpm build')
}

// 1. profile 定位（不存在则创建骨架——首装用户）
if (!existsSync(PROFILE_PKG)) {
  console.log(`· 未找到 DSH web profile（${PROFILE_PKG}），创建骨架 …`)
  const { mkdirSync } = await import('node:fs')
  mkdirSync(PROFILE_DIR, { recursive: true })
  writeFileSync(PROFILE_PKG, JSON.stringify({
    name: 'dsh-profile-web',
    private: true,
    dependencies: {},
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] } },
  }, null, 2) + '\n', 'utf8')
}

// 2. 写入 link 依赖（幂等）
const pkg = JSON.parse(readFileSync(PROFILE_PKG, 'utf8'))
const linkValue = `link:${GALLERY.replaceAll('\\', '/')}`
pkg.dependencies = pkg.dependencies ?? {}
const already = pkg.dependencies['@dsh-skin-studio/gallery']
if (already === linkValue) {
  console.log('✓ profile 已接入本仓库（无需改动）')
} else {
  if (already !== undefined) console.log(`· 更新依赖：${already} → ${linkValue}`)
  pkg.dependencies['@dsh-skin-studio/gallery'] = linkValue
  writeFileSync(PROFILE_PKG, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log(`✓ 已写入依赖 @dsh-skin-studio/gallery → ${linkValue}`)
}

// 3. profile 内安装
console.log('· 安装 profile 依赖（pnpm install）…')
const install = spawnSync('pnpm', ['install'], { cwd: PROFILE_DIR, stdio: 'inherit', shell: process.platform === 'win32' })
if (install.status !== 0) fail('profile pnpm install 失败：请确认已安装 pnpm ≥9 与 Node ≥20，然后手动重试')

console.log('')
console.log('✅ 安装完成。重启 DSH 即可生效：')
console.log('   dsh web          # 启动后打开 设置 → 皮肤中心')
console.log('   如遇界面异常：地址栏加 ?safe-theme=1 进入安全模式')
