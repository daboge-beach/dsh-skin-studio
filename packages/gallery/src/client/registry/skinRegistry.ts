/**
 * SkinRegistry — 皮肤注册表（单例服务）。
 *
 * 内置 7 款来自 builtinSkins.ts；上传皮肤解析 zip 内的 skin.json + assets/，
 * 图片转 object URL。install() 起落入 IndexedDB（skinStore），刷新后启动
 * 恢复（#ready）；remove() 同步卸载持久化记录并释放 object URL；exportSkin()
 * 把已安装皮肤重新打包为 .zip（上传的逆操作）。
 */
import type { ThemeDefinition } from '@dsh-skin-studio/types'
import { BUILTIN_SKINS, paletteCssGradient } from './builtinSkins.ts'
import type { GalleryTab, SkinEntry, UploadedSkin, UploadedSkinManifest, ValidationResult } from './types.ts'
import { DEFAULT_ZIP_LIMITS, findEntry, unzip } from './unzip.ts'
import { assertImageBounds, imageDimensions } from './imageGuard.ts'
import { skinStore, type StoredSkin } from './skinStore.ts'
import { zipStore } from './zipWriter.ts'
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

  // 包统计（安装审阅 + 导出入口展示）
  const imageStats = [...skin.images.entries()].map(([path, bytes]) => {
    const dims = path.endsWith('.svg') ? null : imageDimensions(bytes)
    return { path, bytes: bytes.length, ...(dims !== null ? { width: dims.width, height: dims.height } : {}) }
  })
  const packageStats = {
    files: skin.images.size,
    bytes: imageStats.reduce((n, img) => n + img.bytes, 0),
    images: imageStats,
  }

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
    packageStats,
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
 * 内置款只读；上传款在 install() 后进入「已上传」列表并持久化。
 * object URL 随 remove / 覆盖安装释放，无泄漏。#ready 完成持久化恢复，
 * list()/get() 先等它，保证刷新后上传款可见。
 */
class SkinRegistryImpl {
  #uploaded: SkinEntry[] = []
  #npm: SkinEntry[] = []
  /** upload() 时的原始 manifest，validate() 必须检查 zip 里的原样数据而不是归一化后的条目。 */
  #rawManifests = new WeakMap<SkinEntry, UploadedSkinManifest>()
  /** upload() 解析产物（install 持久化用；WeakMap 随条目生命周期）。 */
  #pending = new WeakMap<SkinEntry, UploadedSkin>()
  /** 已安装的持久化记录（导出 / 更新用）。 */
  #stored = new Map<string, StoredSkin>()
  #ready: Promise<void>

  constructor() {
    this.#ready = skinStore.loadAll()
      .then(rows => {
        for (const row of rows) {
          const images = new Map(row.images.map(img => [img.path, img.bytes]))
          const entry = toSkinEntry({ manifest: row.manifest, images })
          this.#rawManifests.set(entry, row.manifest)
          this.#uploaded.push(entry)
          this.#stored.set(row.id, row)
        }
        if (rows.length > 0) console.log(`[skin-studio] 已恢复 ${rows.length} 款上传皮肤`)
      })
      .catch(e => {
        console.warn(`[skin-studio] 上传皮肤恢复失败（忽略）：${e instanceof Error ? e.message : String(e)}`)
      })
  }

  /** 等待持久化恢复完成（list/get 内部等待；client 入口注册恢复主题也用它）。 */
  async restored(): Promise<SkinEntry[]> {
    await this.#ready
    return [...this.#uploaded]
  }

  async list(tab: GalleryTab): Promise<SkinEntry[]> {
    await this.#ready
    switch (tab) {
      case 'builtin': return [...BUILTIN_SKINS]
      case 'mine': return [...this.#npm]
      case 'uploaded': return [...this.#uploaded]
    }
  }

  /** 按 id 查条目（内置 + npm + 上传；同步读当前内存态，恢复完成前上传款可能尚未入表）。 */
  get(id: string): SkinEntry | undefined {
    return [...BUILTIN_SKINS, ...this.#npm, ...this.#uploaded].find(s => s.id === id)
  }

  /** 各来源数量（同步读；诊断信息用）。 */
  counts(): { builtin: number; uploaded: number } {
    return { builtin: BUILTIN_SKINS.length, uploaded: this.#uploaded.length }
  }

  /**
   * 解析上传的 zip：体积预检 → 安全解压 → 定位 skin.json → 图片尺寸守卫 →
   * 组装条目（未入表）。
   * @throws 文件类型 / 体积 / zip 结构 / zip bomb / 路径穿越 / 像素超限 /
   *   skin.json JSON 语法错误（可读信息直达上传 toast）。
   */
  async upload(file: File, opts?: { onProgress?: (p: number) => void }): Promise<SkinEntry> {
    if (!file.name.endsWith('.zip')) {
      throw new Error('请上传 .zip 格式的皮肤包')
    }
    if (file.size > DEFAULT_ZIP_LIMITS.maxArchiveBytes) {
      throw new Error(`皮肤包 ${Math.round(file.size / 1048576)}MB 超过 ${Math.round(DEFAULT_ZIP_LIMITS.maxArchiveBytes / 1048576)}MB 上限`)
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
      throw new Error(`skin.json 解析失败: ${e instanceof Error ? e.message : String(e)}`, { cause: e })
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

    // 图片像素守卫：头解析（不解码），拒绝超大像素图
    assertImageBounds(images)

    report(1)
    const entry = toSkinEntry({ manifest, images })
    this.#rawManifests.set(entry, manifest)
    this.#pending.set(entry, { manifest, images })
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

  /**
   * 载入注册表（不自动启用）。已存在同 id 的上传款按「更新安装」处理：
   * 释放旧 object URL、原位替换、覆盖持久化记录。与内置款撞 id 仍拒绝。
   */
  async install(entry: SkinEntry): Promise<void> {
    if (BUILTIN_SKINS.some(s => s.id === entry.id) || this.#npm.some(s => s.id === entry.id)) {
      throw new Error(`皮肤 id "${entry.id}" 与内置皮肤冲突`)
    }
    const pending = this.#pending.get(entry)
    if (pending === undefined) {
      throw new Error('该条目没有待安装的解析产物（刷新后请重新上传）')
    }
    const prev = this.#uploaded.find(s => s.id === entry.id)
    if (prev !== undefined) {
      for (const url of [prev.previewUrl, prev.heroUrl, prev.mascotUrl]) {
        if (url !== undefined) URL.revokeObjectURL(url)
      }
    }
    this.#uploaded = prev !== undefined
      ? this.#uploaded.map(s => s.id === entry.id ? entry : s)
      : [...this.#uploaded, entry]

    const record: StoredSkin = {
      id: entry.id,
      installedAt: Date.now(),
      manifest: pending.manifest,
      images: [...pending.images.entries()].map(([path, bytes]) => ({ path, bytes })),
    }
    this.#stored.set(entry.id, record)
    await skinStore.save(record)
  }

  /** 删除上传款（内置不可删），释放 object URL 并卸载持久化记录。 */
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
    this.#stored.delete(id)
    await skinStore.delete(id)
  }

  /**
   * 导出已安装的上传皮肤为 .zip（manifest + 图片，STORE 打包）。
   * @returns 下载用 Blob；未安装过的 id 返回 undefined。
   */
  async exportSkin(id: string): Promise<Blob | undefined> {
    await this.#ready
    const record = this.#stored.get(id)
    if (record === undefined) return undefined
    const encoder = new TextEncoder()
    const entries = [
      { name: 'skin.json', bytes: encoder.encode(JSON.stringify(record.manifest, null, 2)) },
      ...record.images.map(img => ({ name: img.path, bytes: img.bytes })),
    ]
    return new Blob([zipStore(entries) as BlobPart], { type: 'application/zip' })
  }
}

/** 皮肤注册表单例（模块级，跨组件共享）。 */
export const skinRegistry = new SkinRegistryImpl()
