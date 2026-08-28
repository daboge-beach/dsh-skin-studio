#!/usr/bin/env node
/**
 * gen-skin-data.mjs — 皮肤数据单一真源化（v1.0 架构与性能）。
 *
 * 此前每款皮肤的数据存在三处手工同步：skin.json（manifest）、src/index.ts
 * （tokens 字面量）、packages/gallery builtinSkins.ts（23KB 手写镜像表）。
 * 本脚本把三处收敛为一处：
 *   1. 从各皮肤 src/index.ts 提取 tokens 字面量 → 合并进 skin.json；
 *   2. 由 skin.json 生成 builtinSkins.gen.ts（画廊注册表数据）。
 *
 * 用法：
 *   node scripts/gen-skin-data.mjs          # 生成（skin.json + .gen.ts）
 *   node scripts/gen-skin-data.mjs --check  # CI 漂移检查（不写文件）
 */
import { writeFileSync, readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const SKINS_DIR = join(REPO, 'packages', 'skins')
const GEN_TARGET = join(REPO, 'packages', 'gallery', 'src', 'client', 'registry', 'builtinSkins.gen.ts')

const check = process.argv.includes('--check')

/** 从皮肤包 src/index.ts 提取 theme.register 的 tokens 字面量（平衡花括号扫描）。 */
function extractTokens(srcPath) {
  if (!existsSync(srcPath)) return undefined
  const src = readFileSync(srcPath, 'utf8')
  const marker = src.indexOf('tokens:')
  if (marker === -1) return undefined
  let depth = 0
  let start = -1
  for (let i = marker; i < src.length; i += 1) {
    if (src[i] === '{') {
      if (depth === 0) start = i
      depth += 1
    } else if (src[i] === '}') {
      depth -= 1
      if (depth === 0) {
        const body = src.slice(start + 1, i)
        const tokens = {}
        const re = /['"](--[a-zA-Z0-9-]+)['"]\s*:\s*['"]([^'"]+)['"]/g
        let m
        while ((m = re.exec(body)) !== null) tokens[m[1]] = m[2]
        return Object.keys(tokens).length > 0 ? tokens : undefined
      }
    }
  }
  return undefined
}

const skins = readdirSync(SKINS_DIR).filter(name => {
  const full = join(SKINS_DIR, name)
  return statSync(full).isDirectory() && !name.startsWith('.') && existsSync(join(full, 'skin.json'))
})

const generated = []
let jsonChanged = 0

for (const skinId of skins) {
  const dir = join(SKINS_DIR, skinId)
  const manifestPath = join(dir, 'skin.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  // 1. tokens 合并进 skin.json（src/index.ts 为源；无 src 的纯资产包跳过）
  const tokens = extractTokens(join(dir, 'src', 'index.ts'))
  if (tokens !== undefined && JSON.stringify(manifest.tokens ?? null) !== JSON.stringify(tokens)) {
    manifest.tokens = tokens
    if (check) {
      console.error(`✗ [${skinId}] skin.json 缺少/漂移 tokens（重跑 gen-skin-data）`)
      process.exitCode = 1
    } else {
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
      jsonChanged++
    }
  }

  // 2. 生成注册表数据（images 按资产实际存在探测）
  const images = {}
  if (existsSync(join(dir, 'assets', 'preview.png'))) images.preview = 'preview.png'
  if (existsSync(join(dir, 'assets', 'hero.png'))) images.hero = 'hero.png'
  if (existsSync(join(dir, 'assets', 'sprite_anim.png'))) images.mascot = 'sprite_anim.png'

  generated.push({
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    colorScheme: manifest.colorScheme,
    version: manifest.version,
    keywords: manifest.keywords ?? [],
    author: manifest.author ?? { name: 'DSH Skin Studio' },
    license: manifest.license ?? 'MIT',
    homepage: manifest.homepage,
    palette: manifest.palette,
    tokens: manifest.tokens ?? {},
    ...(Object.keys(images).length > 0 ? { images } : {}),
  })
}

const header = '/** 自动生成 — 勿手改（scripts/gen-skin-data.mjs，源：packages/skins 各包 skin.json + src/index.ts tokens）。 */\n'
const body = `export interface GeneratedSkinManifest {
  id: string
  name: string
  description: string
  colorScheme: 'light' | 'dark'
  version: string
  keywords: string[]
  author: { name: string; url?: string }
  license: string
  homepage?: string
  palette: { primary: string; background: string; surface: string; text: string; border: string }
  tokens: Record<string, string>
  images?: { preview?: string; hero?: string; mascot?: string }
}

export const GENERATED_SKINS: readonly GeneratedSkinManifest[] = ${JSON.stringify(generated, null, 2)}
`
const genContent = header + body

if (check) {
  if (!existsSync(GEN_TARGET) || readFileSync(GEN_TARGET, 'utf8') !== genContent) {
    console.error('✗ builtinSkins.gen.ts 与源数据漂移（重跑 gen-skin-data）')
    process.exitCode = 1
  } else {
    console.log(`✓ 皮肤数据一致（${skins.length} 款）`)
  }
} else {
  writeFileSync(GEN_TARGET, genContent, 'utf8')
  console.log(`✓ builtinSkins.gen.ts（${skins.length} 款）${jsonChanged > 0 ? `，skin.json 补 tokens ${jsonChanged} 款` : ''}`)
}
