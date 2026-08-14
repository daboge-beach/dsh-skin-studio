/**
 * 皮肤中心前端数据结构（docs/FRONTEND_REQUIREMENTS.md · 数据结构 一节）。
 *
 * SkinEntry 在 @dsh-skin-studio/types 的 SkinManifest（皮肤包 skin.json 的
 * 原样镜像）之上，补充了 SkinRegistry 解析后填充的运行时字段（图片 URL、
 * token 覆盖表、来源、可否删除）。
 */
import type { ColorScheme, SkinManifest } from '@dsh-skin-studio/types'

export type { ColorScheme }

/** 皮肤来源：内置 / npm 安装 / 用户上传。 */
export type SkinSource = 'builtin' | 'npm' | 'upload'

/** 画廊 Tab 与来源的对应：内置 → builtin，我的 → npm，已上传 → upload。 */
export type GalleryTab = 'builtin' | 'mine' | 'uploaded'

/** 皮肤列表项。 */
export interface SkinEntry {
  id: string
  name: string
  version: string
  author: string | { name: string; url?: string }
  description: string
  colorScheme: ColorScheme
  license?: string
  homepage?: string
  keywords?: string[]
  preview?: string

  /** 图片资源 URL（由皮肤包提供，SkinRegistry 解析后填充；可选）。 */
  previewUrl?: string   // preview.png      画廊缩略图 800x600（4:3）
  heroUrl?: string      // hero.png         竖版主立绘 1024x1536（详情页大图）
  mascotUrl?: string    // sprite_anim.png  2x2 网格 4 帧动画（卡片右下角吉祥物）

  /** 配色摘要（用于卡片背景渐变）。 */
  palette: {
    primary: string
    background: string
    surface: string
    text: string
    border: string
  }

  /** 完整 token 覆盖（详情面板用）。 */
  tokens: Array<[name: string, value: string]>
  tokenCount: number

  /** 卡片背景渐变 CSS（由 palette 生成）。 */
  paletteCssGradient: string

  /** 来源：内置 / npm 安装 / 用户上传。 */
  source: SkinSource

  /** 是否可删除（内置不可删）。 */
  removable: boolean
}

/** 上传/安装过程中的结构化 manifest（skin.json + token 表合并视图）。 */
export interface UploadedSkinManifest extends SkinManifest {
  /** alias token 覆盖表（皮肤包内 tokens.json / skin.json.tokens，可选）。 */
  tokens?: Record<string, string>
  /** assets/ 内的图片资源相对路径。 */
  assets?: {
    hero?: string
    preview?: string
    mascot?: string
  }
}

/** 上传解析产物：manifest + zip 内提取的图片字节（转 object URL 用）。 */
export interface UploadedSkin {
  manifest: UploadedSkinManifest
  /** zip 内路径 → 图片字节。 */
  images: Map<string, Uint8Array>
}

/** 校验结果（与 docs/SKIN_SPEC.md §8 校验规则、scripts/validate-skins.mjs 对齐）。 */
export interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}
