#!/usr/bin/env node
/**
 * check-bundle-size.mjs — client bundle 体积门禁（v1.0 架构与性能）。
 *
 * 插件 client 是单文件契约（DSH ModuleLoader），体积只会单向增长；
 * gzip 后超过阈值即失败，防止无意识的回归（语录外置后基线 ~63KB，
 * 阈值定 80KB，留 ~27% 余量；需要上调时必须在 PR 里说明理由）。
 *
 * 注意：lib/client.js 只在「有 DSH 宿主检出」的环境由官方 clientBundle
 * 预设产出（本机接线构建）；CI 的回退配置只重打包 node 半边、不生成
 * client.js —— 此时明确提示并跳过（exit 0），真门禁在接线构建时生效。
 */
import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUNDLE = resolve(__dirname, '..', 'packages', 'gallery', 'lib', 'client.js')
const MAX_GZIP_KB = 80

if (!existsSync(BUNDLE)) {
  console.log('· 未找到 lib/client.js（无 DSH 宿主 preset 的环境不产出 client bundle），跳过体积门禁')
  process.exit(0)
}

const raw = readFileSync(BUNDLE)
const gzipKb = gzipSync(raw).length / 1024
const rawKb = raw.length / 1024

if (gzipKb > MAX_GZIP_KB) {
  console.error(`✗ client bundle gzip ${gzipKb.toFixed(1)}KB 超过阈值 ${MAX_GZIP_KB}KB（raw ${rawKb.toFixed(0)}KB）`)
  console.error('  检查是否有大块数据被静态打进 bundle（语录走 quotes.json、上传链路保持按需）')
  process.exit(1)
}
console.log(`✓ client bundle gzip ${gzipKb.toFixed(1)}KB / 阈值 ${MAX_GZIP_KB}KB（raw ${rawKb.toFixed(0)}KB）`)
