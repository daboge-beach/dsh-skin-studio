#!/usr/bin/env node
/**
 * sync-host-manifest.mjs — 把 gallery 的 package.json 镜像到 DSH 宿主仓库的
 * packages/skin-studio/gallery/（rc.8 起 tsdown 的 clientBundle 预设扫描
 * DSH 仓库的 workspace 清单，插件包必须在那有一份 manifest 才能构建）。
 *
 * 宿主仓库解析顺序：
 *   1. 环境变量 DSH_HOST_ROOT（绝对路径）
 *   2. 本仓库的兄弟目录 deepseek-harness（monorepo 并排布局）
 * 缺省找不到时打印原因并正常退出（CI / 贡献者环境未接线，跳过同步）；
 * 找到宿主但复制失败则非零退出——接线环境里同步失败必须挡住构建，
 * 不能静默吞掉产出坏产物。
 */
import { createRequire } from 'node:module'
import { mkdirSync, copyFileSync, statSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const galleryDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'gallery')
const repoRoot = join(galleryDir, '..', '..')

const hostRoot = process.env.DSH_HOST_ROOT !== undefined
  ? resolve(process.env.DSH_HOST_ROOT)
  : join(repoRoot, '..', 'deepseek-harness')

// 宿主存在性标记：DSH 仓库一定有 packages/client/tsdown.client.ts
const hostMarker = join(hostRoot, 'packages', 'client', 'tsdown.client.ts')
if (!existsSync(hostMarker)) {
  console.log(`· 未检测到 DSH 宿主（${hostRoot}），跳过 manifest 同步（CI/未接线环境正常）`)
  process.exit(0)
}

const target = join(hostRoot, 'packages', 'skin-studio', 'gallery')
try {
  mkdirSync(target, { recursive: true })
  copyFileSync(join(galleryDir, 'package.json'), join(target, 'package.json'))
  const pkg = require(join(galleryDir, 'package.json'))
  const copied = statSync(join(target, 'package.json'))
  console.log(`✓ manifest 已同步到宿主：${target}（v${pkg.version}，${copied.size}B）`)
} catch (e) {
  console.error(`✗ 宿主 manifest 同步失败（宿主已检测到，不允静默跳过）：${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
}
