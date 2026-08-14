/**
 * GalleryPanel — 皮肤中心主界面（docs/FRONTEND_REQUIREMENTS.md · 界面一）。
 *
 * 结构：header（标题 + 搜索 + 上传）→ tabs（内置/我的/已上传 + 计数）→
 * 卡片网格 + 上传格 → 详情模态。试穿/应用通过官方 ctx.theme.setTheme，
 * 偏好持久化由官方 ThemeRuntime 的 settings scope 完成（应用并保存）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { SearchIcon, UploadIcon } from './icons.tsx'
import { SkinCard } from './SkinCard.tsx'
import { SkinDetailModal } from './SkinDetailModal.tsx'
import { ToastHost, showToast } from './Toast.tsx'
import { UploadDropZone } from './UploadDropZone.tsx'
import { useThemeSnapshot } from './hooks.ts'
import { skinStudioSettings } from './settings.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import type { GalleryTab, SkinEntry } from './registry/types.ts'
import { ensureThemeRegistered, unregisterGalleryTheme } from './themeBridge.ts'
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
  const [tryOnSkinId, setTryOnSkinId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | undefined>(undefined)
  const [mascotEnabled, setMascotEnabled] = useState<boolean>(() => skinStudioSettings.get().mascotEnabled)

  // 订阅官方 theme 服务获取当前主题
  const snapshot = useThemeSnapshot(ctx)
  const activeSkinId = snapshot?.active.id

  // 吉祥物浮层开关（settings.mascotEnabled，默认 true）
  useEffect(() => skinStudioSettings.subscribe(s => setMascotEnabled(s.mascotEnabled)), [])

  /** 试穿前的用户偏好（退出还原用）。 */
  const previousPreferenceRef = useRef<string | undefined>(undefined)

  const refreshList = useCallback((tab: GalleryTab): void => {
    skinRegistry.list(tab).then(setSkins).catch((e: unknown) => {
      showToast({ message: `皮肤列表加载失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    })
  }, [])

  // 加载皮肤列表
  useEffect(() => {
    refreshList(activeTab)
  }, [activeTab, refreshList])

  // 过滤搜索（名称 / 关键词，大小写不敏感）
  const filtered = useMemo(() => skins.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
    || s.keywords?.some(k => k.includes(searchQuery.toLowerCase())),
  ), [skins, searchQuery])

  // ── 试穿：即时切换 + 底部 toast 等用户决策 ────────────────
  const handleTryOn = useCallback((skin: SkinEntry): void => {
    // 已在试穿同一款 → 退出还原
    if (tryOnSkinId === skin.id) {
      const previous = previousPreferenceRef.current
      try {
        if (previous !== undefined && previous !== skin.id) ctx.theme.setTheme(previous)
      } finally {
        setTryOnSkinId(null)
      }
      showToast({ message: `已退出试穿 ${skin.name}`, type: 'info' })
      return
    }

    const snapshotNow = ctx.theme.getTheme()
    const previousId = snapshotNow.preference // 记住原偏好

    try {
      ensureThemeRegistered(ctx, skin)
      // 即时切换到目标皮肤
      ctx.theme.setTheme(skin.id)
      setTryOnSkinId(skin.id)
      previousPreferenceRef.current = previousId

      // 底部 toast：「满意？点应用保存 · 不满意点退出还原」
      showToast({
        message: `正在试穿 ${skin.name}`,
        actionLabel: '应用并保存',
        onAction: () => {
          // 用户确认 → 偏好显式写入自身命名空间（刷新后恢复），清除试穿态
          skinStudioSettings.setActiveSkin(skin.id)
          setTryOnSkinId(null)
          previousPreferenceRef.current = undefined
          showToast({ message: `${skin.name} 已应用`, type: 'success' })
        },
        cancelLabel: '退出还原',
        onCancel: () => {
          // 用户取消 → 切回原偏好
          try {
            ctx.theme.setTheme(previousId)
          } finally {
            setTryOnSkinId(null)
            previousPreferenceRef.current = undefined
          }
        },
        duration: 0, // 不自动消失，等用户决策
      })
    } catch (e) {
      showToast({ message: `试穿失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
      setTryOnSkinId(null)
    }
  }, [ctx, tryOnSkinId])

  // ── 上传：校验 zip → 解析 skin.json → validate → install ──
  const handleUpload = useCallback(async (file: File): Promise<void> => {
    // 1. 校验文件类型
    if (!file.name.endsWith('.zip')) {
      showToast({ message: '请上传 .zip 格式的皮肤包', type: 'error' })
      return
    }

    // 2. 解压并校验
    setUploading(true)
    setUploadProgress('正在解析皮肤包...')
    try {
      const entry = await skinRegistry.upload(file, {
        onProgress: p => setUploadProgress(p < 1 ? `正在解析皮肤包... ${Math.round(p * 100)}%` : '校验中...'),
      })

      // 3. 校验 skin.json
      const validation = await skinRegistry.validate(entry)
      if (!validation.passed) {
        showToast({ message: `${entry.name} 校验失败：\n${validation.errors.join('\n')}`, type: 'error', duration: 0 })
        return
      }
      if (validation.warnings.length > 0) {
        showToast({ message: `${entry.name} 有警告：\n${validation.warnings.join('\n')}`, type: 'info' })
      }

      // 4. 加载到注册表（但不自动启用）
      await skinRegistry.install(entry)

      // 5. 切到「已上传」tab 让用户看到
      setActiveTab('uploaded')
      showToast({ message: `${entry.name} 已添加，点击卡片试用`, type: 'success' })
    } catch (e) {
      showToast({ message: `上传失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
    } finally {
      setUploading(false)
      setUploadProgress(undefined)
    }
  }, [])

  // ── 删除上传皮肤 ─────────────────────────────────────────
  const handleRemove = useCallback((skin: SkinEntry): void => {
    skinRegistry.remove(skin.id)
      .then(() => {
        unregisterGalleryTheme(ctx, skin)
        if (selectedSkin?.id === skin.id) setSelectedSkin(null)
        if (tryOnSkinId === skin.id) setTryOnSkinId(null)
        refreshList(activeTab)
        showToast({ message: `${skin.name} 已删除`, type: 'info' })
      })
      .catch((e: unknown) => {
        showToast({ message: `删除失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
      })
  }, [activeTab, ctx, refreshList, selectedSkin?.id, tryOnSkinId])

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h1>Skin Studio</h1>
          <p className={styles.subtitle}>选一张皮肤，让 agent 也有自己的脸</p>
        </div>
        <div className={styles.headerActions}>
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="搜索皮肤..." />
          <UploadButton onUpload={file => { void handleUpload(file) }} busy={uploading} />
        </div>
      </header>

      <nav className={styles.tabs}>
        <Tab active={activeTab === 'builtin'} onClick={() => setActiveTab('builtin')}>内置</Tab>
        <Tab active={activeTab === 'mine'} onClick={() => setActiveTab('mine')}>我的</Tab>
        <Tab active={activeTab === 'uploaded'} onClick={() => setActiveTab('uploaded')}>已上传</Tab>
        <span className={styles.count}>
          共 {filtered.length} 款{activeSkinId && ` · 已启用 ${activeSkinId}`}
        </span>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={mascotEnabled}
          title="应用皮肤后，在主界面右下角显示吉祥物浮层"
          onClick={() => skinStudioSettings.setMascotEnabled(!mascotEnabled)}
        >
          吉祥物浮层：{mascotEnabled ? '开' : '关'}
        </button>
      </nav>

      <div className={styles.grid}>
        {filtered.map(skin => (
          <SkinCard
            key={skin.id}
            skin={skin}
            active={skin.id === activeSkinId}
            tryOn={skin.id === tryOnSkinId}
            onClick={() => setSelectedSkin(skin)}
            onTryOn={() => handleTryOn(skin)}
            onRemove={handleRemove}
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
            ? '还没有上传过皮肤 — 把皮肤包（.zip）拖到上面的上传格试试。'
            : '「我的」收录通过 npm 安装的皮肤，目前为空。'}
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

      <ToastHost />
    </div>
  )
}
