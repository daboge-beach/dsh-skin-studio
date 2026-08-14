/**
 * skin.json 校验（上传流程第 3 步）。
 *
 * 规则与 scripts/validate-skins.mjs、docs/SKIN_SPEC.md §8「校验规则」对齐，
 * 并补充 §10「安全约束」的 token 值注入检查。
 */
import type { UploadedSkinManifest, ValidationResult } from './types.ts'

const ID_REGEX = /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/**
 * token 值只允许纯 CSS 颜色语法（hex / 函数 / var 引用 / color-mix），
 * 拒绝 `url()`、引号、分号、大括号等可借机注入任意 CSS 的字符。
 */
const TOKEN_VALUE_REGEX = /^[#a-zA-Z0-9(),.%\s/-]+$/
const TOKEN_VALUE_FORBIDDEN = [/url\s*\(/i, /expression\s*\(/i, /javascript\s*:/i, /[{};'"<>&\\]/]

/** 校验一份上传解析出的皮肤 manifest。 */
export function validateSkinManifest(manifest: UploadedSkinManifest): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 必填字段（与 validate-skins.mjs 一致）
  const required: Array<[keyof UploadedSkinManifest, string]> = [
    ['id', 'id'],
    ['name', 'name'],
    ['version', 'version'],
    ['author', 'author'],
    ['description', 'description'],
    ['colorScheme', 'colorScheme'],
  ]
  for (const [field, label] of required) {
    const value = manifest[field]
    if (value === undefined || value === null || value === '') {
      errors.push(`缺少必填字段: ${label}`)
    }
  }

  if (manifest.id !== undefined) {
    if (typeof manifest.id !== 'string' || !ID_REGEX.test(manifest.id)) {
      errors.push(`id "${String(manifest.id)}" 不符合 kebab-case 规则`)
    } else if (['system', 'light', 'dark'].includes(manifest.id)) {
      errors.push(`id "${manifest.id}" 是内置主题保留字，不可占用`)
    }
  }

  if (manifest.version !== undefined && (typeof manifest.version !== 'string' || !SEMVER_REGEX.test(manifest.version))) {
    errors.push(`version "${String(manifest.version)}" 不符合 SemVer`)
  }

  if (manifest.colorScheme !== undefined && manifest.colorScheme !== 'light' && manifest.colorScheme !== 'dark') {
    errors.push(`colorScheme "${String(manifest.colorScheme)}" 必须是 light 或 dark`)
  }

  // palette 摘要：给了就必须是合法 hex（画廊渐变 / swatch 直接吃这些值）
  if (manifest.palette !== undefined) {
    for (const [key, value] of Object.entries(manifest.palette)) {
      if (value !== undefined && !HEX_COLOR_REGEX.test(value)) {
        errors.push(`palette.${key} "${value}" 不是合法的十六进制颜色`)
      }
    }
    if (manifest.palette.primary === undefined) {
      warnings.push('palette.primary 未提供，卡片回退渐变将缺少主色')
    }
  } else {
    warnings.push('palette 未提供，详情面板将不显示配色预览')
  }

  // token 覆盖表（SKIN_SPEC §4/§10）
  if (manifest.tokens !== undefined) {
    for (const [name, value] of Object.entries(manifest.tokens)) {
      if (!name.startsWith('--dsw-alias-') && !name.startsWith('--dsw-specific-')) {
        errors.push(`token "${name}" 必须以 --dsw-alias-* 或 --dsw-specific-* 开头`)
        continue
      }
      if (typeof value !== 'string' || value.length === 0) {
        errors.push(`token "${name}" 的值不能为空`)
        continue
      }
      if (!TOKEN_VALUE_REGEX.test(value) || TOKEN_VALUE_FORBIDDEN.some(re => re.test(value))) {
        errors.push(`token "${name}" 的值 "${value}" 不是合法的 CSS 颜色值`)
      }
    }
  } else {
    warnings.push('tokens 未提供，该皮肤将只改变元数据不改配色')
  }

  return { passed: errors.length === 0, errors, warnings }
}
