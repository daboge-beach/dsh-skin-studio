#!/usr/bin/env node
/**
 * download-assets.mjs — 从 GitHub Releases 下载皮肤生图资产。
 *
 * 用法: node scripts/download-assets.mjs [version]
 * 缺省下载最新 Release 的 dsh-skin-assets-*.zip 并解压到 packages/skins/。
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPO = 'daboge-beach/dsh-skin-studio'
const VERSION = process.argv[2] ?? 'latest'

/** 解析目标 Release：具名 tag 直接取；latest = 遍历列表取最新的「含资产包」的 Release（纯代码 Release 不打断 setup）。 */
async function resolveRelease() {
  if (VERSION !== 'latest') {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${VERSION}`)
    if (!res.ok) throw new Error(`GitHub API ${res.status}（tag ${VERSION}）`)
    return res.json()
  }
  for (let page = 1; page <= 5; page += 1) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30&page=${page}`)
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const releases = await res.json()
    if (releases.length === 0) break
    for (const release of releases) {
      const hasAsset = (release.assets ?? []).some(a => /^dsh-skin-assets-\d+\.zip$/.test(a.name))
      if (hasAsset) {
        console.log(`→ 最新的含资产 Release：${release.tag_name}（其后的代码版 Release 不携带资产）`)
        return release
      }
    }
  }
  throw new Error('所有 Release 都没有 dsh-skin-assets-*.zip 附件（检查 https://github.com/' + REPO + '/releases）')
}

async function main() {
  // 已有资产则跳过
  const skinsDir = join(ROOT, 'packages', 'skins')
  const hasAssets = existsSync(skinsDir) && readdirSync(skinsDir).some(d => {
    try { return existsSync(join(skinsDir, d, 'assets', 'hero.png')) } catch { return false }
  })
  if (hasAssets) {
    console.log('✓ 皮肤资产已存在，跳过（如需重新下载请先删除 packages/skins/*/assets/ 下的 PNG）')
    return
  }

  const release = await resolveRelease()

  // 按编号排序的 asset chunks（dsh-skin-assets-1.zip, -2.zip, ...）
  const assets = (release.assets ?? [])
    .filter(a => /^dsh-skin-assets-\d+\.zip$/.test(a.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  if (assets.length === 0) {
    console.error(`✗ Release "${release.tag_name}" 无 dsh-skin-assets-*.zip 附件`)
    console.error('  请到 https://github.com/' + REPO + '/releases 检查')
    process.exit(1)
  }

  console.log(`→ 找到 ${assets.length} 个资产包（共 ${(assets.reduce((s, a) => s + a.size, 0) / 1024 / 1024).toFixed(0)}MB）`)
  mkdirSync(skinsDir, { recursive: true })

  for (const asset of assets) {
    console.log(`→ 下载 ${asset.name}（${(asset.size / 1024 / 1024).toFixed(1)}MB）...`)
    const zipPath = join(ROOT, asset.name)
    const dl = await fetch(asset.browser_download_url)
    await pipeline(dl.body, createWriteStream(zipPath))

    console.log(`→ 解压 ${asset.name}...`)
    if (process.platform === 'win32') {
      spawnSync('powershell', ['-NoProfile', '-Command',
        `Expand-Archive -Path "${zipPath}" -DestinationPath "${skinsDir}" -Force`], { stdio: 'inherit' })
    } else {
      spawnSync('unzip', ['-o', zipPath, '-d', skinsDir], { stdio: 'inherit' })
    }
    unlinkSync(zipPath)
  }

  console.log('✓ 资产下载完成')
}

main().catch(e => { console.error('✗', e.message); process.exit(1) })
