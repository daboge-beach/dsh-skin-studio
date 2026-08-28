#!/usr/bin/env node
/**
 * gen-quotes.mjs — 把 quotes/ 源数据生成为各皮肤 assets/quotes.json。
 *
 * 背景：DSH ModuleLoader 是单文件 client bundle 契约，动态 import 会被
 * 内联、无法真正懒加载；语录（~160KB 源码）改为运行时按需 fetch 的
 * JSON 资产（quotePool.ts），bundle 直减 ~120KB。
 *
 * 用法：
 *   node --experimental-strip-types scripts/gen-quotes.mjs          # 生成
 *   node --experimental-strip-types scripts/gen-quotes.mjs --check  # CI 漂移检查
 *
 * 源数据唯一真源：packages/gallery/src/client/quotes.ts（同步装配）。
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const SKINS_DIR = join(REPO, 'packages', 'skins')

const { QUOTE_SKIN_IDS, TARGET_LINES, quotesForSkin, greetingsForSkin } = await import(
  '../packages/gallery/src/client/quotes.ts'
)

const check = process.argv.includes('--check')
let written = 0
let drifted = 0

for (const skinId of QUOTE_SKIN_IDS) {
  const payload = {
    zh: [...quotesForSkin(skinId, 'zh')],
    en: [...quotesForSkin(skinId, 'en')],
    greetings: {
      zh: [...greetingsForSkin(skinId, 'zh')],
      en: [...greetingsForSkin(skinId, 'en')],
    },
  }
  for (const lang of ['zh', 'en']) {
    if (payload[lang].length !== TARGET_LINES) {
      console.error(`✗ [${skinId}] ${lang} 语录 ${payload[lang].length} 句 ≠ ${TARGET_LINES}`)
      process.exit(1)
    }
    if (new Set(payload[lang]).size !== TARGET_LINES) {
      console.error(`✗ [${skinId}] ${lang} 语录有重复`)
      process.exit(1)
    }
  }

  const target = join(SKINS_DIR, skinId, 'assets', 'quotes.json')
  const content = JSON.stringify(payload, null, 0) + '\n'
  await mkdir(dirname(target), { recursive: true })
  if (existsSync(target) && (await readFile(target, 'utf8')) === content) continue
  if (check) {
    console.error(`✗ [${skinId}] quotes.json 与源数据漂移（重跑 gen-quotes）`)
    drifted++
  } else {
    await writeFile(target, content, 'utf8')
    console.log(`✓ [${skinId}] quotes.json（${TARGET_LINES}×2 句 + 问候）`)
    written++
  }
}

if (check) {
  if (drifted > 0) process.exit(1)
  console.log(`✓ quotes.json 全部与源数据一致（${QUOTE_SKIN_IDS.length} 款）`)
} else {
  console.log(drifted === 0 && written === 0 ? '（源数据无变化，0 个文件写入）' : `共写入 ${written} 个文件`)
}
