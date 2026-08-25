#!/usr/bin/env node
/**
 * download-assets.mjs — 从 GitHub Releases 下载皮肤生图资产。
 *
 * 用法: node scripts/download-assets.mjs [version]
 * 缺省下载最新 Release 的 dsh-skin-assets.zip 并解压到 packages/skins/。
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPO = 'daboge-beach/dsh-skin-studio'
const VERSION = process.argv[2] ?? 'latest'
const API = VERSION === 'latest'
  ? `https://api.github.com/repos/${REPO}/releases/latest`
  : `https://api.github.com/repos/${REPO}/releases/tags/${VERSION}`

async function main() {
  // 已有资产则跳过
  const skinsDir = join(ROOT, 'packages', 'skins')
  const hasAssets = existsSync(skinsDir) && readdirSync(skinsDir).some(d => {
    try { return statSync(join(skinsDir, d, 'assets', 'hero.png')).isFile() } catch { return false }
  })
  if (hasAssets) {
    console.log('✓ 皮肤资产已存在，跳过下载（如需重新下载请先删除 packages/skins/*/assets/ 下的 PNG）')
    return
  }

  console.log(`→ 获取 Release ${VERSION}...`)
  const res = await fetch(API)
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const release = await res.json()

  const asset = release.assets?.find(a => a.name === 'dsh-skin-assets.zip')
  if (asset === undefined) {
    console.error(`✗ Release "${release.tag_name}" 无 dsh-skin-assets.zip 附件`)
    console.error('  请到 https://github.com/' + REPO + '/releases 检查')
    process.exit(1)
  }

  console.log(`→ 下载 ${asset.name}（${(asset.size / 1024 / 1024).toFixed(1)}MB）...`)
  const zipPath = join(ROOT, 'dsh-skin-assets.zip')
  const dl = await fetch(asset.browser_download_url)
  await pipeline(dl.body, createWriteStream(zipPath))

  console.log('→ 解压...')
  mkdirSync(skinsDir, { recursive: true })
  // PowerShell Expand-Archive（Windows）或 unzip（Unix）
  if (process.platform === 'win32') {
    spawnSync('powershell', ['-NoProfile', '-Command',
      `Expand-Archive -Path "${zipPath}" -DestinationPath "${skinsDir}" -Force`], { stdio: 'inherit' })
  } else {
    spawnSync('unzip', ['-o', zipPath, '-d', skinsDir], { stdio: 'inherit' })
  }
  const { unlinkSync } = await import('node:fs')
  unlinkSync(zipPath)

  console.log('✓ 资产下载完成')
}

main().catch(e => { console.error('✗', e.message); process.exit(1) })
