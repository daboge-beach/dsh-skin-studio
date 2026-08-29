#!/usr/bin/env node
/**
 * validate-skins.mjs — 校验所有内置皮肤的 skin.json 与资产完整性
 *
 * 用法：
 *   node scripts/validate-skins.mjs
 *
 * 退出码：
 *   0 = 全部通过（允许有 warning）
 *   1 = 有错误（发布门禁：CI 在 lint 前执行本脚本）
 *
 * 检查项：
 *   - skin.json 必填字段 / id 格式 / id 与目录名一致 / SemVer / colorScheme
 *   - package.json 的 dsh.client.inject 声明
 *   - 构建产物：按 package.json exports/main 检查真实入口文件（而非写死 lib/index.js）
 *   - 预览图：assets/preview.png 必须存在（内置皮肤门禁，error）
 *   - 资产引用：skin.json 中所有 assets/ 开头的字符串路径必须存在
 *   - 体积：单文件 >12MB error（与上传中心上限对齐）、>6MB warning
 *   - 像素：PNG 尺寸 >7680px error、>4096px warning（防超大图拖垮浏览器）
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKINS_DIR = resolve(__dirname, '../packages/skins');

const ID_REGEX = /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

/** 上传中心同款体积上限（字节）。 */
const SIZE_ERROR = 12 * 1024 * 1024;
const SIZE_WARN = 6 * 1024 * 1024;
/** 像素上限。 */
const PX_ERROR = 7680;
const PX_WARN = 4096;

let errorCount = 0;
let warnCount = 0;

function error(skin, msg) {
  console.error(`✗ [${skin}] ${msg}`);
  errorCount++;
}

function warn(skin, msg) {
  console.warn(`⚠ [${skin}] ${msg}`);
  warnCount++;
}

function ok(skin, msg) {
  console.log(`✓ [${skin}] ${msg}`);
}

/** 解析 PNG IHDR（前 8 字节签名 + 4 长度 + 4 "IHDR" + 宽高各 4 字节大端）。 */
function pngSize(buf) {
  if (buf.length < 24) return null;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(sig)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** 递归收集 manifest 里所有 assets/ 开头的字符串（资产引用面）。 */
function collectAssetRefs(value, out) {
  if (typeof value === 'string' && value.startsWith('assets/')) out.add(value);
  else if (Array.isArray(value)) for (const v of value) collectAssetRefs(v, out);
  else if (value !== null && typeof value === 'object') for (const v of Object.values(value)) collectAssetRefs(v, out);
}

/** 单文件体积 + 像素检查。 */
function checkFileBounds(skin, absPath, relPath) {
  const st = statSync(absPath);
  if (st.size > SIZE_ERROR) error(skin, `${relPath} 体积 ${(st.size / 1048576).toFixed(1)}MB 超过 12MB 上限`);
  else if (st.size > SIZE_WARN) warn(skin, `${relPath} 体积 ${(st.size / 1048576).toFixed(1)}MB 偏大（>6MB）`);
  if (relPath.endsWith('.png')) {
    const size = pngSize(readFileSync(absPath).subarray(0, 64));
    if (size !== null) {
      if (Math.max(size.width, size.height) > PX_ERROR) error(skin, `${relPath} 像素 ${size.width}×${size.height} 超过 ${PX_ERROR}px 上限`);
      else if (Math.max(size.width, size.height) > PX_WARN) warn(skin, `${relPath} 像素 ${size.width}×${size.height} 偏大（>${PX_WARN}px）`);
    }
  }
}

/** 按 package.json 的 main/exports 找出声明的入口产物（相对皮肤包根）。 */
function declaredEntries(pkg) {
  const out = new Set();
  if (typeof pkg.main === 'string') out.add(pkg.main);
  const walk = (v) => {
    if (typeof v === 'string') out.add(v);
    else if (v !== null && typeof v === 'object') for (const x of Object.values(v)) walk(x);
  };
  if (pkg.exports !== undefined) walk(pkg.exports);
  return [...out].filter(p => !p.startsWith('./src') && p !== './package.json' && p.includes('.'));
}

function validateSkin(skinDir, skinId) {
  const manifestPath = join(skinDir, 'skin.json');

  if (!existsSync(manifestPath)) {
    error(skinId, 'skin.json 不存在');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    error(skinId, `skin.json 解析失败: ${e.message}`);
    return;
  }

  // 必填字段
  const required = ['id', 'name', 'version', 'author', 'description', 'colorScheme'];
  for (const field of required) {
    if (!manifest[field]) {
      error(skinId, `缺少必填字段: ${field}`);
    }
  }

  // id 格式 + 与目录名一致
  if (manifest.id && !ID_REGEX.test(manifest.id)) {
    error(skinId, `id "${manifest.id}" 不符合 kebab-case 规则`);
  }

  if (manifest.id && manifest.id !== skinId) {
    error(skinId, `skin.json 的 id "${manifest.id}" 与目录名 "${skinId}" 不一致`);
  }

  // version
  if (manifest.version && !SEMVER_REGEX.test(manifest.version)) {
    error(skinId, `version "${manifest.version}" 不符合 SemVer`);
  }

  // colorScheme
  if (manifest.colorScheme && !['light', 'dark'].includes(manifest.colorScheme)) {
    error(skinId, `colorScheme "${manifest.colorScheme}" 必须是 light 或 dark`);
  }

  // package.json：inject 声明 + 真实构建产物
  const pkgPath = join(skinDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const inject = pkg.dsh?.client?.inject;
      if (!Array.isArray(inject) || !inject.includes('@deepseek-ai/dsh-client-ui-theme')) {
        error(skinId, 'package.json 缺少 dsh.client.inject: ["@deepseek-ai/dsh-client-ui-theme"]，ctx.theme 会 undefined');
      }
      // 产物检查：main/exports 声明的每个入口必须真实存在（lib/index.mjs 等）
      for (const rel of declaredEntries(pkg)) {
        const target = join(skinDir, rel);
        if (!existsSync(target)) {
          error(skinId, `package.json 声明的产物不存在: ${rel}（先 pnpm build）`);
        }
      }
    } catch (e) {
      warn(skinId, `package.json 解析失败: ${e.message}`);
    }
  } else {
    warn(skinId, '无 package.json（纯资产皮肤包，跳过产物检查）');
  }

  // 预览图（内置皮肤门禁）：客户端固定按 assets/preview.png 加载
  const previewPath = join(skinDir, 'assets', 'preview.png');
  if (!existsSync(previewPath)) {
    error(skinId, 'assets/preview.png 不存在（内置皮肤必须有预览图）');
  } else {
    checkFileBounds(skinId, previewPath, 'assets/preview.png');
  }

  // 资产引用存在性：manifest 里所有 assets/ 开头的路径
  const refs = new Set();
  collectAssetRefs(manifest, refs);
  for (const rel of refs) {
    const target = join(skinDir, rel);
    if (!existsSync(target)) {
      warn(skinId, `manifest 引用的资产不存在: ${rel}`);
    }
  }

  // 资产体积/像素抽查：assets/ 根层 + tiers/ 各档 bg/hero/sprite
  const assetRoot = join(skinDir, 'assets');
  if (existsSync(assetRoot)) {
    const scan = (dir, depth) => {
      if (depth > 3) return;
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) scan(full, depth + 1);
        else if (/\.(png|jpe?g|webp|gif)$/i.test(name)) {
          checkFileBounds(skinId, full, full.slice(skinDir.length + 1).replaceAll('\\', '/'));
        }
      }
    };
    scan(assetRoot, 0);
  }

  // 版本管理字段（v0.13）：changelog / deprecated / replaces
  if (manifest.changelog !== undefined) {
    if (!Array.isArray(manifest.changelog) || manifest.changelog.some(x => typeof x !== 'string')) {
      error(skinId, 'changelog 必须是字符串数组（每条一句话）');
    }
  }
  if (manifest.deprecated !== undefined && typeof manifest.deprecated !== 'boolean') {
    error(skinId, 'deprecated 必须是 boolean');
  }
  if (manifest.replaces !== undefined) {
    if (manifest.replaces === manifest.id) {
      error(skinId, 'replaces 不能指向自身');
    } else if (!ID_REGEX.test(manifest.replaces)) {
      error(skinId, 'replaces "' + manifest.replaces + '" 不符合 kebab-case 规则');
    }
  }

  // （旧字段已废弃提示）
  if (manifest.variants) {
    warn(skinId, 'variants 字段已废弃，改用 colorScheme: "light" | "dark"');
  }
  if (manifest.client) {
    warn(skinId, 'client 字段已废弃，入口固定为 package.json main/exports');
  }

  if (errorCount === 0) ok(skinId, `校验通过（v${manifest.version}）`);
  else console.log(`· [${skinId}] 有错误，见上`);
}

function main() {
  console.log('🔍 校验内置皮肤...\n');

  if (!existsSync(SKINS_DIR)) {
    console.error(`皮肤目录不存在: ${SKINS_DIR}`);
    process.exit(1);
  }

  const skins = readdirSync(SKINS_DIR).filter(name => {
    const full = join(SKINS_DIR, name);
    return statSync(full).isDirectory() && !name.startsWith('.');
  });

  if (skins.length === 0) {
    console.log('（没有内置皮肤需要校验）');
    process.exit(0);
  }

  const errBefore = errorCount;
  for (const skinId of skins) {
    validateSkin(join(SKINS_DIR, skinId), skinId);
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`✓ 通过: ${skins.length - (errorCount - errBefore)} / ${skins.length}`);
  if (warnCount > 0) console.log(`⚠ 警告: ${warnCount}`);
  if (errorCount > 0) {
    console.log(`✗ 错误: ${errorCount}`);
    process.exit(1);
  } else {
    console.log('全部通过');
    process.exit(0);
  }
}

main();
