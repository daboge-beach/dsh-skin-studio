/**
 * SkinComposerModal — 皮肤工坊（v0.15 无代码编辑器，战略 review 第 4 条）。
 *
 * 左表单右预览：名称/色系/品牌色 → 自动推导 14 token（5 个核心 token
 * 可微调，支持「重新推导」）；可选上传 preview/hero/mascot（像素守卫
 * 复用 imageGuard）；实时预览迷你聊天界面 + WCAG 对比度检查（<3 阻止
 * 安装）；「安装到本机」走 registry 的 installFromParts（与 zip 上传同
 * 一条管线：审阅语义/更新替换/回滚快照/持久化），「导出 .zip」用
 * zipWriter 打包分享。
 */
import { useMemo, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { Modal } from './Modal.tsx'
import { showToast } from './Toast.tsx'
import { t } from './i18n.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import { validateSkinManifest } from './registry/validate.ts'
import { zipStore } from './registry/zipWriter.ts'
import type { UploadedSkinManifest } from './registry/types.ts'
import { assertImageBounds } from './registry/imageGuard.ts'
import { checkReadability, contrastLevel, deriveTheme } from './composer/derive.ts'
import { gradientPng } from './composer/pngEncoder.ts'
import styles from './SkinDetailModal.module.css'
import panelStyles from './GalleryPanel.module.css'

const ID_REGEX = /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/
/** 中文名 → 兜底 kebab-case id（非 ASCII 全部转连字符）。 */
function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base.length >= 3 ? base.slice(0, 62) : `skin-${Date.now().toString(36)}`
}

const CORE_TOKENS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-brand-primary',
  '--dsw-alias-label-primary',
  '--dsw-alias-border-l1',
] as const

interface ImageSlot {
  path: string
  bytes: Uint8Array
}

const kb = (n: number): string => `${Math.max(1, Math.round(n / 1024))} KB`
const LEVEL_COLOR: Record<string, string> = { good: '#10b981', ok: '#f59e0b', poor: '#dc2626' }

export interface SkinComposerModalProps {
  ctx: ClientContext
  onClose: () => void
  /** 安装成功后回调（画廊刷新 + 切到已上传 tab）。 */
  onInstalled: (id: string, name: string) => void
}

export function SkinComposerModal({ ctx, onClose, onInstalled }: SkinComposerModalProps): JSX.Element {
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [description, setDescription] = useState('')
  const [scheme, setScheme] = useState<'light' | 'dark'>('dark')
  const [primary, setPrimary] = useState('#6366f1')
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [images, setImages] = useState<Record<'preview' | 'hero' | 'mascot', ImageSlot | null>>({ preview: null, hero: null, mascot: null })
  const [busy, setBusy] = useState(false)

  const finalId = (id.trim() !== '' ? id.trim() : slugify(name)) || 'my-skin'
  const derived = useMemo(() => deriveTheme(primary, scheme), [primary, scheme])
  const tokens = useMemo(() => ({ ...derived.tokens, ...overrides }), [derived, overrides])
  const readability = useMemo(() => checkReadability(tokens), [tokens])
  const hasUnreadable = readability.some(c => c.level === 'poor')
  const idValid = ID_REGEX.test(finalId) && finalId !== id.toLowerCase() ? ID_REGEX.test(finalId) : ID_REGEX.test(finalId)
  const idTaken = skinRegistry.get(finalId) !== undefined && skinRegistry.get(finalId)?.source === 'builtin'

  const onImagePicked = (slot: 'preview' | 'hero' | 'mascot') => (file: File | undefined): void => {
    if (file === undefined) return
    void (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        assertImageBounds([[file.name, bytes]])
        setImages(prev => ({ ...prev, [slot]: { path: `assets/${file.name.replace(/[^\w.-]/g, '_')}`, bytes } }))
        showToast({ message: `${file.name}（${kb(bytes.length)}）已加入`, type: 'info' })
      } catch (e) {
        showToast({ message: e instanceof Error ? e.message : String(e), type: 'error' })
      }
    })()
  }

  const buildManifest = (): UploadedSkinManifest => ({
    id: finalId,
    name: name.trim() !== '' ? name.trim() : finalId,
    version: '0.1.0',
    author: { name: 'Skin Studio 用户' },
    description: description.trim() !== '' ? description.trim() : `${name.trim() || finalId} — 皮肤工坊生成`,
    colorScheme: scheme,
    license: 'MIT',
    keywords: ['community', 'composed', scheme],
    palette: derived.palette,
    specVersion: '0.2.0',
    tokens,
    assets: {
      ...(images.preview !== null ? { preview: images.preview.path } : {}),
      ...(images.hero !== null ? { hero: images.hero.path } : {}),
      ...(images.mascot !== null ? { mascot: images.mascot.path } : {}),
    },
  })

  const install = (): void => {
    if (name.trim() === '') { showToast({ message: t('composerNameRequired'), type: 'error' }); return }
    if (!idValid) { showToast({ message: t('composerIdInvalid'), type: 'error' }); return }
    if (hasUnreadable || idTaken) return
    setBusy(true)
    void (async () => {
      try {
        const manifest = buildManifest()
        const validation = validateSkinManifest(manifest)
        if (!validation.passed) {
          showToast({ message: `${t('validateFailed')}：\n${validation.errors.join('\n')}`, type: 'error', duration: 0 })
          return
        }
        const imagesMap = new Map<string, Uint8Array>()
        for (const slot of [images.preview, images.hero, images.mascot]) {
          if (slot !== null) imagesMap.set(slot.path, slot.bytes)
        }
        if (images.preview === null) {
          // 没传预览图 → 用品牌色渐变占位（validate 要求 assets/preview.png 存在）
          imagesMap.set('assets/preview.png', await gradientPng(primary, tokens['--dsw-alias-bg-base'] ?? '#0f172a'))
          manifest.assets = { ...manifest.assets, preview: 'assets/preview.png' }
        }
        await skinRegistry.installFromParts(manifest, imagesMap)
        ensureRegisteredAndApply(manifest.id)
        onInstalled(manifest.id, manifest.name)
        onClose()
      } catch (e) {
        showToast({ message: `生成失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
      } finally {
        setBusy(false)
      }
    })()
  }

  const ensureRegisteredAndApply = (skinId: string): void => {
    const entry = skinRegistry.get(skinId)
    if (entry === undefined) return
    try {
      ctx.theme.register({ id: entry.id, colorScheme: entry.colorScheme, tokens: Object.fromEntries(entry.tokens) })
    } catch { /* 已注册时部分宿主会抛错，忽略 */ }
    skinStudioSettingsApply(skinId)
  }

  const skinStudioSettingsApply = (skinId: string): void => {
    void import('./themeBridge.ts').then(m => {
      const entry = skinRegistry.get(skinId)
      if (entry !== undefined) m.ensureThemeRegistered(ctx, entry)
    })
  }

  const exportZip = (): void => {
    void (async () => {
      const manifest = buildManifest()
      const parts: Array<{ name: string; bytes: Uint8Array }> = [
        { name: 'skin.json', bytes: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) },
      ]
      for (const slot of [images.preview, images.hero, images.mascot]) {
        if (slot !== null) parts.push({ name: slot.path, bytes: slot.bytes })
      }
      if (images.preview === null) {
        parts.push({ name: 'assets/preview.png', bytes: await gradientPng(primary, tokens['--dsw-alias-bg-base'] ?? '#0f172a') })
      }
      const blob = new Blob([zipStore(parts) as BlobPart], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${finalId}-skin.zip`
      a.click()
      window.setTimeout(() => { URL.revokeObjectURL(url) }, 10_000)
      showToast({ message: `${t('exported')}（${kb(blob.size)}）`, type: 'success' })
    })()
  }

  // ── 迷你预览（token 实时渲染） ──
  const pv = {
    bg: tokens['--dsw-alias-bg-base'] ?? '#000',
    surface: tokens['--dsw-alias-bg-layer-1'] ?? '#111',
    text: tokens['--dsw-alias-label-primary'] ?? '#fff',
    secondary: tokens['--dsw-alias-label-secondary'] ?? '#888',
    brand: tokens['--dsw-alias-brand-primary'] ?? '#66f',
    border: tokens['--dsw-alias-border-l1'] ?? '#333',
  }

  return (
    <Modal onClose={onClose} size="large" labelledBy="composer-title">
      <div className={styles.detail}>
        <div className={styles.meta}>
          <h2 id="composer-title">🎨 {t('composerTitle')}</h2>
          <p className={styles.author}>{t('composerHint')}</p>
        </div>

        <section className={styles.tokens}>
          <h3>{t('composerBasics')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={{ fontSize: 12 }}>
              {t('composerName')}
              <input
                value={name} placeholder="我的皮肤" maxLength={20}
                onChange={e => { setName(e.target.value) }}
                style={{ width: '100%', marginTop: 2, padding: '4px 8px', borderRadius: 6, border: `1px solid ${pv.border}`, background: pv.surface, color: pv.text }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              {t('composerId')}
              <input
                value={id} placeholder={slugify(name)} maxLength={64}
                onChange={e => { setId(e.target.value) }}
                style={{ width: '100%', marginTop: 2, padding: '4px 8px', borderRadius: 6, border: `1px solid ${idTaken ? '#dc2626' : pv.border}`, background: pv.surface, color: pv.text }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12 }}>
              {t('composerScheme')}{' '}
              <button type="button" className={panelStyles.mascotToggle} style={{ padding: '2px 10px' }} onClick={() => { setScheme(scheme === 'dark' ? 'light' : 'dark') }}>
                {scheme === 'dark' ? t('composerDark') : t('composerLight')}
              </button>
            </label>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {t('composerPrimary')}
              <input type="color" value={primary} onChange={e => { setPrimary(e.target.value) }} style={{ width: 36, height: 24, border: 0, background: 'none' }} />
              <code style={{ fontSize: 11 }}>{primary}</code>
            </label>
            {(Object.keys(overrides).length > 0) && (
              <button type="button" className={panelStyles.mascotToggle} style={{ padding: '2px 10px' }} onClick={() => { setOverrides({}) }}>
                {t('composerRederive')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {CORE_TOKENS.map(token => (
              <label key={token} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                {token.replace('--dsw-alias-', '').replace('--dsh-specific-', '')}
                <input
                  type="color"
                  value={tokens[token] ?? '#000000'}
                  onChange={e => { setOverrides(prev => ({ ...prev, [token]: e.target.value })) }}
                  style={{ width: 28, height: 22, border: 0, background: 'none' }}
                />
              </label>
            ))}
          </div>
        </section>

        <section className={styles.tokens}>
          <h3>{t('composerImages')}</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['preview', 'hero', 'mascot'] as const).map(slot => (
              <label key={slot} className={panelStyles.mascotToggle} style={{ padding: '4px 10px', cursor: 'pointer' }}>
                {slot === 'preview' ? 'preview 800×600' : slot === 'hero' ? 'hero 1024×1536' : 'mascot 2×2'}
                <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; onImagePicked(slot)(f) }} />
              </label>
            ))}
          </div>
          <p style={{ fontSize: 11, opacity: 0.65, margin: '6px 0 0' }}>
            {images.preview !== null ? `preview: ${images.preview.path}（${kb(images.preview.bytes.length)}）` : t('composerAutoPreview')}
          </p>
        </section>

        <section className={styles.tokens}>
          <h3>{t('composerPreview')}</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            {/* 迷你聊天界面预览 */}
            <div style={{ flex: 1, minWidth: 220, borderRadius: 10, border: `1px solid ${pv.border}`, overflow: 'hidden', background: pv.bg }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: 64, padding: 8, background: tokens['--dsh-specific-sidebar-fill'] ?? pv.surface, fontSize: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: pv.brand, marginBottom: 6 }} />
                  {[1, 2, 3].map(i => <div key={i} style={{ height: 5, borderRadius: 3, background: pv.secondary, opacity: 0.6, marginBottom: 5 }} />)}
                </div>
                <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ alignSelf: 'flex-end', maxWidth: '80%', padding: '4px 8px', borderRadius: 8, background: pv.brand, color: pv.bg, fontSize: 10 }}>
                    {t('composerBubbleMe')}
                  </div>
                  <div style={{ alignSelf: 'flex-start', maxWidth: '80%', padding: '4px 8px', borderRadius: 8, background: pv.surface, color: pv.text, border: `1px solid ${pv.border}`, fontSize: 10 }}>
                    {t('composerBubbleAgent')}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 22, borderRadius: 6, background: pv.surface, border: `1px solid ${pv.border}` }} />
                    <div style={{ width: 40, height: 22, borderRadius: 6, background: pv.brand }} />
                  </div>
                </div>
              </div>
            </div>
            {/* 对比度检查 */}
            <div style={{ width: 190, fontSize: 11 }}>
              <strong>{t('composerContrast')}</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 14, lineHeight: 1.7 }}>
                {readability.map(c => (
                  <li key={c.pair} style={{ color: LEVEL_COLOR[c.level] }}>
                    {c.pair}：{c.ratio.toFixed(1)}:1 {c.level === 'poor' ? `— ${t('contrastPoor')}` : c.level === 'ok' ? `— ${t('contrastOk')}` : ''}
                  </li>
                ))}
              </ul>
              {hasUnreadable && <p style={{ color: '#dc2626', margin: '4px 0 0' }}>{t('contrastBlock')}</p>}
            </div>
          </div>
        </section>

        <footer className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles['btn--ghost']}`} onClick={onClose}>{t('cancel')}</button>
          <button type="button" className={`${styles.btn} ${styles['btn--ghost']}`} onClick={exportZip}>{t('exportZip')}</button>
          <button
            type="button" className={`${styles.btn} ${styles['btn--primary']}`}
            onClick={install} disabled={busy || hasUnreadable || !idValid || idTaken || name.trim() === ''}
          >
            {busy ? t('parsing') : t('composerInstall')}
          </button>
        </footer>
      </div>
    </Modal>
  )
}
