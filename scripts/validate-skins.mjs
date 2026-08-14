#!/usr/bin/env node
/**
 * validate-skins.mjs — 校验所有内置皮肤的 skin.json
 *
 * 用法：
 *   node scripts/validate-skins.mjs
 *
 * 退出码：
 *   0 = 全部通过
 *   1 = 有错误
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKINS_DIR = resolve(__dirname, '../packages/skins');

const ID_REGEX = /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

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
  const required = ['id', 'name', 'version', 'author', 'description', 'client'];
  for (const field of required) {
    if (!manifest[field]) {
      error(skinId, `缺少必填字段: ${field}`);
    }
  }

  // id 格式
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

  // client 文件
  if (manifest.client) {
    const clientPath = join(skinDir, manifest.client);
    if (!existsSync(clientPath)) {
      warn(skinId, `client 文件不存在: ${manifest.client}（构建后会生成）`);
    }
  }

  // preview
  if (manifest.preview) {
    const previewPath = typeof manifest.preview === 'string'
      ? manifest.preview
      : manifest.preview.light;
    if (!existsSync(join(skinDir, previewPath))) {
      warn(skinId, `预览图不存在: ${previewPath}`);
    }
  }

  // variants
  if (manifest.variants) {
    const validVariants = ['light', 'dark'];
    for (const v of manifest.variants) {
      if (!validVariants.includes(v)) {
        error(skinId, `未知变体: ${v}（仅支持 light/dark）`);
      }
    }
  }

  ok(skinId, `校验通过（v${manifest.version}）`);
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

  for (const skinId of skins) {
    validateSkin(join(SKINS_DIR, skinId), skinId);
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`✓ 通过: ${skins.length - errorCount} / ${skins.length}`);
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
