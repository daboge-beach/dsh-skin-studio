/**
 * GalleryPanel — 皮肤中心主界面（docs/FRONTEND_REQUIREMENTS.md · 界面一）。
 *
 * 结构：header（标题 + 搜索 + 上传）→ tabs（内置/我的/已上传 + 计数）→
 * 卡片网格 + 上传格 → 详情模态。试穿/应用通过官方 ctx.theme.setTheme，
 * 偏好持久化由官方 ThemeRuntime 的 settings scope 完成（应用并保存）。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { SearchIcon, UploadIcon } from './icons.tsx'
import { SkinCard } from './SkinCard.tsx'
import { SkinDetailModal } from './SkinDetailModal.tsx'
import { InstallReviewModal } from './InstallReviewModal.tsx'
import { SettingsDrawer } from './SettingsDrawer.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { t } from './i18n.ts'
import { ToastHost, showToast } from './Toast.tsx'
import { UploadDropZone } from './UploadDropZone.tsx'
import { useThemeSnapshot } from './hooks.ts'
import { skinStudioSettings } from './settings.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import type { GalleryTab, SkinEntry } from './registry/types.ts'
import { ensureThemeRegistered, unregisterGalleryTheme } from './themeBridge.ts'
import { effectiveTier, subscribeTier, tierLabel, effortTier } from './tierPower.ts'
import { syncTierToEffort } from './tierSync.ts'
import styles from './GalleryPanel.module.css'

export interface GalleryPanelProps {
  ctx: ClientContext
}

/** 搜索输入框（header 用）。 */
function SearchInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}): JSX.Element {
  return (
    <div className={styles.search}>
      <SearchIcon />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        aria-label={placeholder}
        className={styles.searchInput}
      />
    </div>
  )
}

/** 上传按钮（header 用；点击触发隐藏 file input）。 */
function UploadButton({ onUpload, busy }: { onUpload: (file: File) => void; busy: boolean }): JSX.Element {
  const inputId = 'skin-studio-upload-input'
  return (
    <>
      <label htmlFor={inputId} className={`${styles.uploadBtn} ${busy ? styles['uploadBtn--busy'] : ''}`}>
        <UploadIcon />
        上传皮肤
      </label>
      <input
        id={inputId}
        type="file"
        accept=".zip"
        className={styles.uploadInput}
        onChange={e => {
          const file = e.target.files?.item(0) ?? null
          if (file !== null) onUpload(file)
          e.target.value = ''
        }}
      />
    </>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }): JSX.Element {
  return (
    <button
      type="button"
      className={`${styles.tab} ${active ? styles['tab--active'] : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function GalleryPanel({ ctx }: GalleryPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<GalleryTab>('builtin')
  const [skins, setSkins] = useState<SkinEntry[]>([])
  const [selectedSkin, setSelectedSkin] = useState<SkinEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tryOnSkinId, setTryOnSkinId] = useState<string | null>(() => skinStudioSettings.getTryOn()?.skinId ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | undefined>(undefined)
  /** 安装审阅态：upload 校验通过后挂起，等用户在弹窗里确认。 */
  const [review, setReview] = useState<{ entry: SkinEntry; validation: Awaited<ReturnType<typeof skinRegistry.validate>> } | null>(null)
  /** 设置面板（v0.9：顶部按钮群收拢于此）。 */
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** 删除确认态（危险操作确认）。 */
  const [pendingRemove, setPendingRemove] = useState<SkinEntry | null>(null)
  const [powerTier, setPowerTier] = useState<'auto' | 't0' | 't1' | 't2' | 't3' | 't4'>(() => skinStudioSettings.get().powerTier)
  const [effective, setEffective] = useState<number>(() => effectiveTier())
  useEffect(() => subscribeTier(t => setEffective(t)), [])

  // 订阅官方 theme 服务获取当前主题
  const snapshot = useThemeSnapshot(ctx)
  const activeSkinId = snapshot?.active.id

  // 境界档位（settings.*；其余开关已收进 SettingsDrawer 自管）
  useEffect(() => skinStudioSettings.subscribe(s => {
    setPowerTier(s.powerTier)
  }), [])

  /** 试穿前的用户偏好已并入模块级试穿态（skinStudioSettings.getTryOn）。 */

  const refreshList = useCallback((tab: GalleryTab): void => {
    skinRegistry.list(tab).then(setSkins).catch((e: unknown) => {
      showToast({ message: `${t('listLoadFailed')}：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    })
  }, [])

  // 加载皮肤列表
  useEffect(() => {
    refreshList(activeTab)
  }, [activeTab, refreshList])

  // 搜索：名称 / 描述 / 关键词（描述含中英双语，天然兼容两种语言检索）
  const filtered = useMemo(() => skins.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
    || s.description.toLowerCase().includes(searchQuery.toLowerCase())
    || s.keywords?.some(k => k.includes(searchQuery.toLowerCase())),
  ), [skins, searchQuery])

  /** 当前试穿款对应的条目（面板决策条显示用）。 */
  const tryOnSkinEntry = tryOnSkinId !== null
    ? skins.find(s => s.id === tryOnSkinId) ?? null
    : null

  // ── 试穿：即时预览（不落记忆，刷新还原）+ 面板内决策条 ────
  // 试穿态存模块级单例（skinStudioSettings.getTryOn）：面板关闭重开后预览与决策条延续。
  /** 确认试穿：保持当前皮肤并写入偏好（跨会话）。 */
  const confirmTryOn = useCallback((skin: SkinEntry): void => {
    skinStudioSettings.setTryOn(null)
    skinStudioSettings.setActiveSkin(skin.id)
    setTryOnSkinId(null)
    showToast({ message: `${skin.name} 已应用并保存`, type: 'success' })
  }, [])

  /** 退出试穿：切回原偏好，不写记忆。 */
  const revertTryOn = useCallback((skin: SkinEntry): void => {
    const previous = skinStudioSettings.getTryOn()?.previousPreference
    skinStudioSettings.setTryOn(null)
    try {
      if (previous !== undefined && previous !== skin.id) ctx.theme.setTheme(previous)
    } finally {
      setTryOnSkinId(null)
    }
  }, [ctx])

  const handleTryOn = useCallback((skin: SkinEntry): void => {
    // 已在试穿同一款 → 退出还原
    if (tryOnSkinId === skin.id) {
      revertTryOn(skin)
      showToast({ message: `已退出试穿 ${skin.name}`, type: 'info' })
      return
    }

    // 从已试穿款直接换穿另一款：以首次试穿前的偏好为还原基准
    const previousId = tryOnSkinId !== null
      ? skinStudioSettings.getTryOn()?.previousPreference
      : ctx.theme.getTheme().preference

    try {
      ensureThemeRegistered(ctx, skin)
      // 试穿态：theme 监听跳过记忆跟随（试穿不落 activeSkin）
      skinStudioSettings.setTryOn({ skinId: skin.id, previousPreference: previousId })
      ctx.theme.setTheme(skin.id)
      setTryOnSkinId(skin.id)

      // 短提示自动消失；常驻决策入口在面板内的试穿条（不再用常驻 toast）
      showToast({
        message: `正在试穿 ${skin.name} —— 满意点「应用并保存」，或等刷新自动还原`,
        type: 'info',
        duration: 3500,
      })
    } catch (e) {
      skinStudioSettings.setTryOn(null)
      showToast({ message: `${t('tryOnFailed')}：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
      setTryOnSkinId(null)
    }
  }, [ctx, tryOnSkinId, revertTryOn])

  // ── 上传：校验 zip → 安全解压 → validate → 安装审阅 → install ──
  const handleUpload = useCallback(async (file: File): Promise<void> => {
    // 1. 校验文件类型
    if (!file.name.endsWith('.zip')) {
      showToast({ message: t('zipOnly'), type: 'error' })
      return
    }

    // 2. 解压并校验
    setUploading(true)
    setUploadProgress(t('parsing'))
    try {
      const entry = await skinRegistry.upload(file, {
        onProgress: p => setUploadProgress(p < 1 ? `${t('parsing')} ${Math.round(p * 100)}%` : t('validating')),
      })

      // 3. 校验 skin.json
      const validation = await skinRegistry.validate(entry)
      if (!validation.passed) {
        showToast({ message: `${entry.name} ${t('validateFailed')}：\n${validation.errors.join('\n')}`, type: 'error', duration: 0 })
        return
      }

      // 4. 安装审阅：展示能力面（token/图片/体积/警告），用户确认后才 install
      setReview({ entry, validation })
    } catch (e) {
      showToast({ message: `${t('uploadFailed')}：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress(undefined)
    }
  }, [])

  // ── 审阅确认 → 载入注册表（不自动启用）并持久化 ──
  const handleInstallConfirmed = useCallback(async (entry: SkinEntry): Promise<void> => {
    setReview(null)
    try {
      await skinRegistry.install(entry)
      setActiveTab('uploaded')
      showToast({ message: `${entry.name} 已安装（刷新后保留），点击卡片试用`, type: 'success' })
    } catch (e) {
      showToast({ message: `安装失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    }
  }, [])

  // ── 删除上传皮肤（危险操作：先确认再执行）─────────────────
  const handleRemove = useCallback((skin: SkinEntry): void => {
    setPendingRemove(null)
    skinRegistry.remove(skin.id)
      .then(() => {
        unregisterGalleryTheme(ctx, skin)
        if (selectedSkin?.id === skin.id) setSelectedSkin(null)
        if (tryOnSkinId === skin.id) setTryOnSkinId(null)
        refreshList(activeTab)
        showToast({ message: `${skin.name} ${t('removed')}`, type: 'info' })
      })
      .catch((e: unknown) => {
        showToast({ message: `${t('removeFailed')}：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
      })
  }, [activeTab, ctx, refreshList, selectedSkin?.id, tryOnSkinId])

  /** 还原出厂（设置面板注入；确认已在面板内完成）。 */
  const handleFactoryReset = useCallback((): void => {
    skinStudioSettings.resetAll()
    try { ctx.theme.setTheme('system') } catch { /* 主题服务不可用时仅还原设置 */ }
    showToast({ message: t('resetDone'), type: 'success' })
  }, [ctx])

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h1>Skin Studio</h1>
          <p className={styles.subtitle}>{t('panelTitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t('searchPlaceholder')} />
          <UploadButton onUpload={file => { void handleUpload(file) }} busy={uploading} />
          <button
            type="button"
            className={styles.mascotToggle}
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            title={t('settingsOpen')}
            onClick={() => { setSettingsOpen(true) }}
          >
            ⚙ {t('settingsTitle')}
          </button>
        </div>
      </header>

      <nav className={styles.tabs}>
        <Tab active={activeTab === 'builtin'} onClick={() => setActiveTab('builtin')}>{t('tabBuiltin')}</Tab>
        <Tab active={activeTab === 'mine'} onClick={() => setActiveTab('mine')}>{t('tabMine')}</Tab>
        <Tab active={activeTab === 'uploaded'} onClick={() => setActiveTab('uploaded')}>{t('tabUploaded')}</Tab>
        <span className={styles.count}>
          {t('countOf')} {filtered.length} 款{activeSkinId && ` · ${t('activeSkin')} ${activeSkinId}`}
        </span>
      </nav>

      {/* 试穿决策条：试穿期间的常驻决策入口（取代旧的常驻 toast） */}
      {tryOnSkinEntry !== null && (
        <div className={styles.tryOnBar} role="status">
          <span className={styles.tryOnBarText}>
            {t('tryOnBar')}：{tryOnSkinEntry.name}（{t('tempNote')}）
          </span>
          <span className={styles.tryOnBarActions}>
            <button
              type="button"
              className={styles.tryOnBarPrimary}
              onClick={() => confirmTryOn(tryOnSkinEntry)}
            >
              {t('applySave')}
            </button>
            <button
              type="button"
              className={styles.tryOnBarGhost}
              onClick={() => {
                revertTryOn(tryOnSkinEntry)
                showToast({ message: `${t('exitedTryOn')} ${tryOnSkinEntry.name}`, type: 'info' })
              }}
            >
              {t('exitRevert')}
            </button>
          </span>
        </div>
      )}

      {/* 境界滑条：拉动改变档位（auto 时跟随 DSH 推理等级） */}
      <div className={styles.tierRow} role="group" aria-label={t('tierLabel')}>
        <span className={styles.tierLabel}>{t('tierLabel')}</span>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={powerTier === 'auto'}
          title={t('tierFollow')}
          onClick={() => skinStudioSettings.setPowerTier(powerTier === 'auto' ? `t${effective}` as 't0' | 't1' | 't2' | 't3' | 't4' : 'auto')}
        >
          {powerTier === 'auto' ? `${t('tierFollow')}（${effective + 1}${t('tierOf')}）` : t('tierManual')}
        </button>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={powerTier === 'auto' ? effective : Number(powerTier.slice(1))}
          aria-label={`${t('tierSliderAria')} ${effective + 1} ${t('tierOf')} ${tierLabel(activeSkinId ?? '', effective as 0 | 1 | 2 | 3)}`}
          title={t('tierSliderHint')}
          className={styles.tierSlider}
          onChange={e => {
            const v = Number(e.target.value)
            skinStudioSettings.setPowerTier(`t${v}` as 't0' | 't1' | 't2' | 't3' | 't4')
            if (skinStudioSettings.get().tierSyncEffort) syncTierToEffort(ctx, v as 0 | 1 | 2 | 3, effortTier)
          }}
        />
        <span className={styles.tierName}>
          {tierLabel(activeSkinId ?? '', effective as 0 | 1 | 2 | 3)}
        </span>
        <label
          className={styles.mascotToggle}
          title={t('uploadBgHint')}
        >
          {t('uploadBg')}({effective + 1})
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file === undefined) return
              if (activeSkinId === '') {
                showToast({ message: '请先选择一款皮肤再上传背景', type: 'error' })
                return
              }
              const reader = new FileReader()
              reader.onload = () => {
                const dataBase64 = String(reader.result ?? '').split(',')[1] ?? ''
                fetch('/skins/upload-bg', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ skinId: activeSkinId, tier: effective, dataBase64 }),
                })
                  .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
                  .then(() => {
                    skinStudioSettings.bumpBgRev()
                    showToast({ message: `第 ${effective + 1} 档自定义背景已更新`, type: 'success' })
                  })
                  .catch(err => {
                    showToast({ message: `上传失败：${String(err)}`, type: 'error' })
                  })
              }
              reader.readAsDataURL(file)
            }}
          />
        </label>
        <button
          type="button"
          className={styles.mascotToggle}
          title={`删除第 ${effective + 1} 档的自定义背景，恢复该档原本的生图背景（没有上传过时无影响）`}
          onClick={() => {
            if (activeSkinId === '') {
              showToast({ message: '请先选择一款皮肤', type: 'error' })
              return
            }
            fetch('/skins/reset-bg', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ skinId: activeSkinId, tier: effective }),
            })
              .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
              .then(() => {
                skinStudioSettings.bumpBgRev()
                showToast({ message: `${effective + 1} ${t('bgReset')}`, type: 'success' })
              })
              .catch(err => {
                showToast({ message: `${t('bgResetFailed')}：${String(err)}`, type: 'error' })
              })
          }}
        >
          {t('resetBg')}
        </button>
        <button
          type="button"
          className={styles.mascotToggle}
          title={t('bgFitHint')}
          onClick={() => skinStudioSettings.setBgFit(skinStudioSettings.get().bgFit === 'cover' ? 'contain' : 'cover')}
        >
          {skinStudioSettings.get().bgFit === 'cover' ? t('bgFitCover') : t('bgFitContain')}
        </button>
      </div>

      <div className={styles.grid}>
        {filtered.map(skin => (
          <SkinCard
            key={skin.id}
            skin={skin}
            active={skin.id === activeSkinId}
            tryOn={skin.id === tryOnSkinId}
            onClick={() => setSelectedSkin(skin)}
            onTryOn={() => handleTryOn(skin)}
            onRemove={setPendingRemove}
          />
        ))}
        <UploadDropZone
          onUpload={file => { void handleUpload(file) }}
          busy={uploading}
          progressText={uploadProgress}
        />
      </div>

      {activeTab !== 'builtin' && filtered.length === 0 && (
        <p className={styles.empty}>
          {activeTab === 'uploaded'
            ? t('emptyUploaded')
            : t('emptyMine')}
        </p>
      )}

      {selectedSkin && (
        <SkinDetailModal
          skin={selectedSkin}
          ctx={ctx}
          onClose={() => setSelectedSkin(null)}
          onTryOn={onTryOnSkin => handleTryOn(onTryOnSkin)}
        />
      )}

      {review !== null && (
        <InstallReviewModal
          entry={review.entry}
          validation={review.validation}
          onCancel={() => { setReview(null) }}
          onConfirm={() => { void handleInstallConfirmed(review.entry) }}
        />
      )}

      {settingsOpen && (
        <SettingsDrawer
          onClose={() => { setSettingsOpen(false) }}
          onFactoryReset={handleFactoryReset}
          activeSkinId={activeSkinId}
        />
      )}

      {pendingRemove !== null && (
        <ConfirmDialog
          title={`${t('confirmDeleteTitle')}：${pendingRemove.name}`}
          message={t('confirmDeleteMsg')}
          danger
          confirmLabel={t('confirmDeleteTitle')}
          onCancel={() => { setPendingRemove(null) }}
          onConfirm={() => { handleRemove(pendingRemove) }}
        />
      )}

      <ToastHost />
    </div>
  )
}
