/**
 * SkinRegistry — 皮肤注册表（单例服务，前端 in-memory 实现）。
 *
 * docs/FRONTEND_REQUIREMENTS.md「待澄清问题」#4：目前先按前端 in-memory
 * 实现，后续接 DSH 的插件清单服务。内置 7 款来自 builtinSkins.ts；
 * 上传皮肤解析 zip 内的 skin.json + assets/，图片转 object URL。
 */
import type { ThemeDefinition } from '@dsh-skin-studio/types'
import { BUILTIN_SKINS, paletteCssGradient } from './builtinSkins.ts'
import type { GalleryTab, SkinEntry, UploadedSkin, UploadedSkinManifest, ValidationResult } from './types.ts'
import { findEntry, unzip } from './unzip.ts'
import { validateSkinManifest } from './validate.ts'

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

function imageMime(path: string): string {
  const ext = path.split('.').pop() ?? ''
  return IMAGE_MIME[ext] ?? 'application/octet-stream'
}

/** palette 缺省时的兜底：直接从 alias token 取，再兜到中性灰。 */
function derivePalette(manifest: UploadedSkinManifest): SkinEntry['palette'] {
  const t = manifest.tokens ?? {}
  return {
    primary: manifest.palette?.primary ?? t['--dsw-alias-brand-primary'] ?? '#3b82f6',
    background: manifest.palette?.background ?? t['--dsw-alias-bg-base'] ?? '#f8fafc',
    surface: manifest.palette?.surface ?? t['--dsw-alias-bg-layer-1'] ?? '#ffffff',
    text: manifest.palette?.text ?? t['--dsw-alias-label-primary'] ?? '#0f172a',
    border: manifest.palette?.border ?? t['--dsw-alias-border-l1'] ?? '#e2e8f0',
  }
}

/** palette 缺省、tokens 也缺省时的最小 token 表（让 setTheme 仍有意义）。 */
function deriveTokens(manifest: UploadedSkinManifest): Record<string, string> {
  if (manifest.tokens !== undefined && Object.keys(manifest.tokens).length > 0) return manifest.tokens
  const p = derivePalette(manifest)
  return {
    '--dsw-alias-bg-base': p.background,
    '--dsw-alias-bg-layer-1': p.surface,
    '--dsw-alias-border-l1': p.border,
    '--dsw-alias-brand-primary': p.primary,
    '--dsw-alias-label-primary': p.text,
  }
}

/** 把上传解析产物组装成画廊条目（图片转 object URL）。 */
function toSkinEntry(skin: UploadedSkin): SkinEntry {
  const manifest = skin.manifest
  const palette = derivePalette(manifest)
  const tokens = deriveTokens(manifest)

  const objectUrl = (declared: string | undefined): string | undefined => {
    if (declared === undefined) return undefined
    const bytes = skin.images.get(declared) ?? skin.images.get(declared.replace(/^\.\//, ''))
    return bytes === undefined ? undefined : URL.createObjectURL(new Blob([bytes as BlobPart], { type: imageMime(declared) }))
  }
  const previewUrl = objectUrl(manifest.assets?.preview)
  const heroUrl = objectUrl(manifest.assets?.hero)
  const mascotUrl = objectUrl(manifest.assets?.mascot)

  const tokenList = Object.entries(tokens) as Array<[string, string]>
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    colorScheme: manifest.colorScheme,
    license: manifest.license,
    homepage: manifest.homepage,
    keywords: manifest.keywords ?? [],
    preview: manifest.assets?.preview ?? manifest.preview,
    previewUrl,
    heroUrl,
    mascotUrl,
    palette,
    tokens: tokenList,
    tokenCount: tokenList.length,
    paletteCssGradient: paletteCssGradient(palette),
    source: 'upload',
    removable: true,
  }
}

/** 条目 → 官方 ThemeDefinition（上传皮肤的运行时注册用）。 */
export function toThemeDefinition(skin: SkinEntry): ThemeDefinition {
  return {
    id: skin.id,
    colorScheme: skin.colorScheme,
    tokens: Object.fromEntries(skin.tokens),
  }
}

/**
 * 皮肤注册表单例。
 *
 * 内置款只读；上传款在 install() 后进入「已上传」列表。object URL 随
 * remove 释放，无泄漏。
 */
class SkinRegistryImpl {
  #uploaded: SkinEntry[] = []
  #npm: SkinEntry[] = []
  /** upload() 时的原始 manifest，validate() 必须检查 zip 里的原样数据而不是归一化后的条目。 */
  #rawManifests = new WeakMap<SkinEntry, UploadedSkinManifest>()

  async list(tab: GalleryTab): Promise<SkinEntry[]> {
    switch (tab) {
      case 'builtin': return [...BUILTIN_SKINS]
      case 'mine': return [...this.#npm]
      case 'uploaded': return [...this.#uploaded]
    }
  }

  /** 按 id 查条目（内置 + npm + 上传）。 */
  get(id: string): SkinEntry | undefined {
    return [...BUILTIN_SKINS, ...this.#npm, ...this.#uploaded].find(s => s.id === id)
  }

  /**
   * 解析上传的 zip：读字节 → 解压 → 定位 skin.json → 组装条目（未入表）。
   * @throws 文件类型 / zip 结构 / skin.json JSON 语法错误。
   */
  async upload(file: File, opts?: { onProgress?: (p: number) => void }): Promise<SkinEntry> {
    if (!file.name.endsWith('.zip')) {
      throw new Error('请上传 .zip 格式的皮肤包')
    }
    const report = (p: number): void => opts?.onProgress?.(p)

    report(0.1)
    const bytes = new Uint8Array(await file.arrayBuffer())
    report(0.4)
    const files = await unzip(bytes)
    report(0.7)

    const manifestPath = findEntry(files, 'skin.json')
    if (manifestPath === undefined) {
      throw new Error('皮肤包内找不到 skin.json')
    }
    let manifest: UploadedSkinManifest
    try {
      manifest = JSON.parse(new TextDecoder().decode(files.get(manifestPath))) as UploadedSkinManifest
    } catch (e) {
      throw new Error(`skin.json 解析失败: ${e instanceof Error ? e.message : String(e)}`)
    }

    // zip 内路径统一剥掉 skin.json 所在目录前缀，让 assets/preview.png 之类的
    // 相对引用无论写在包根还是子目录都能命中。
    const strip = manifestPath.includes('/') ? `${manifestPath.slice(0, manifestPath.lastIndexOf('/') + 1)}` : ''
    const images = new Map<string, Uint8Array>()
    for (const [name, data] of files) {
      const ext = name.split('.').pop() ?? ''
      if (IMAGE_MIME[ext] !== undefined) {
        images.set(strip === '' ? name : name.replace(strip, ''), data)
      }
    }
    if (strip !== '' && manifest.assets !== undefined) {
      const rel = (p: string): string => p.startsWith(strip) ? p.slice(strip.length) : p
      manifest = {
        ...manifest,
        assets: Object.fromEntries(
          Object.entries(manifest.assets).map(([k, v]) => [k, v === undefined ? undefined : rel(v)]),
        ),
      }
    }

    report(1)
    const entry = toSkinEntry({ manifest, images })
    this.#rawManifests.set(entry, manifest)
    return entry
  }

  /** 校验一个已解析的条目（数据来自 zip 内 skin.json 的原样内容）。 */
  async validate(entry: SkinEntry): Promise<ValidationResult & { skinId: string }> {
    const manifest = this.#rawManifests.get(entry) ?? {
      ...entry,
      palette: entry.palette,
      tokens: Object.fromEntries(entry.tokens),
    }
    return { skinId: entry.id, ...validateSkinManifest(manifest) }
  }

  /** 载入注册表（不自动启用）。 */
  async install(entry: SkinEntry): Promise<void> {
    const dup = [...BUILTIN_SKINS, ...this.#uploaded, ...this.#npm].some(s => s.id === entry.id)
    if (dup) throw new Error(`皮肤 id "${entry.id}" 已存在`)
    this.#uploaded = [...this.#uploaded, entry]
  }

  /** 删除上传款（内置不可删），释放 object URL。 */
  async remove(id: string): Promise<void> {
    const target = this.#uploaded.find(s => s.id === id)
    if (target === undefined) {
      if (BUILTIN_SKINS.some(s => s.id === id)) throw new Error('内置皮肤不可删除')
      return
    }
    for (const url of [target.previewUrl, target.heroUrl, target.mascotUrl]) {
      if (url !== undefined) URL.revokeObjectURL(url)
    }
    this.#uploaded = this.#uploaded.filter(s => s.id !== id)
  }
}

/** 皮肤注册表单例（模块级，跨组件共享）。 */
export const skinRegistry = new SkinRegistryImpl()
