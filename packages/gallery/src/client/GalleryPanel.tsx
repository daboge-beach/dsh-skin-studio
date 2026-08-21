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
  const [mascotEnabled, setMascotEnabled] = useState<boolean>(() => skinStudioSettings.get().mascotEnabled)
  const [quoteLang, setQuoteLang] = useState<'zh' | 'en'>(() => skinStudioSettings.get().quoteLang)
  const [animations, setAnimations] = useState<'system' | 'always'>(() => skinStudioSettings.get().animations)
  const [notifyTaskDone, setNotifyTaskDone] = useState<'off' | 'sound' | 'motion' | 'both'>(() => skinStudioSettings.get().notifyTaskDone)
  const [powerTier, setPowerTier] = useState<'auto' | 't0' | 't1' | 't2' | 't3' | 't4'>(() => skinStudioSettings.get().powerTier)
  const [glass, setGlass] = useState<boolean>(() => skinStudioSettings.get().glass)
  const [cursorFx, setCursorFx] = useState<boolean>(() => skinStudioSettings.get().cursorFx)
  const [tierSync, setTierSync] = useState<boolean>(() => skinStudioSettings.get().tierSyncEffort)
  const [effective, setEffective] = useState<number>(() => effectiveTier())
  useEffect(() => subscribeTier(t => setEffective(t)), [])

  // 订阅官方 theme 服务获取当前主题
  const snapshot = useThemeSnapshot(ctx)
  const activeSkinId = snapshot?.active.id

  // 吉祥物浮层开关 + 语录语言 + 动画策略 + 任务提醒 + 境界档位（settings.*）
  useEffect(() => skinStudioSettings.subscribe(s => {
    setMascotEnabled(s.mascotEnabled)
    setQuoteLang(s.quoteLang)
    setAnimations(s.animations)
    setNotifyTaskDone(s.notifyTaskDone)
    setPowerTier(s.powerTier)
    setGlass(s.glass)
    setCursorFx(s.cursorFx)
    setTierSync(s.tierSyncEffort)
  }), [])

  /** 试穿前的用户偏好已并入模块级试穿态（skinStudioSettings.getTryOn）。 */

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
      showToast({ message: `试穿失败：${e instanceof Error ? e.message : String(e)}`, type: 'error' })
      setTryOnSkinId(null)
    }
  }, [ctx, tryOnSkinId, revertTryOn])

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
        <button
          type="button"
          className={styles.mascotToggle}
          title="切换吉祥物语录语言（中文 / English），每款皮肤每种语言各 200 句"
          onClick={() => skinStudioSettings.setQuoteLang(quoteLang === 'zh' ? 'en' : 'zh')}
        >
          语录语言：{quoteLang === 'zh' ? '中文' : 'English'}
        </button>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={animations === 'always'}
          title="动画播放策略：跟随系统「减少动态效果」（默认，无障碍友好）或忽略系统设置始终播放。系统关闭了动画效果时，吉祥物/特效静止的话切到「始终播放」即可。"
          onClick={() => skinStudioSettings.setAnimations(animations === 'always' ? 'system' : 'always')}
        >
          动画：{animations === 'always' ? '始终播放' : '跟随系统'}
        </button>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={notifyTaskDone !== 'off'}
          title="任务完成后提醒：提示音（音色随皮肤系列）与/或吉祥物庆祝动作。点击循环切换：关 → 声音 → 动作 → 声音+动作。"
          onClick={() => {
            const next = notifyTaskDone === 'off' ? 'sound' : notifyTaskDone === 'sound' ? 'motion' : notifyTaskDone === 'motion' ? 'both' : 'off'
            skinStudioSettings.setNotifyTaskDone(next)
          }}
        >
          任务提醒：{notifyTaskDone === 'off' ? '关' : notifyTaskDone === 'sound' ? '声音' : notifyTaskDone === 'motion' ? '动作' : '声音+动作'}
        </button>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={glass}
          title="背景透出：皮肤背景图铺满窗口，界面面板半透明直接透出背景（无磨砂模糊）。有背景图的皮肤生效。"
          onClick={() => skinStudioSettings.setGlass(!glass)}
        >
          背景透出：{glass ? '开' : '关'}
        </button>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={cursorFx}
          title="皮肤光标：三态自定义光标（默认/悬停/点击）。若光标热点偏移导致点击不准，可关闭回退系统光标。"
          onClick={() => skinStudioSettings.setCursorFx(!cursorFx)}
        >
          光标：{cursorFx ? '开' : '关'}
        </button>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={tierSync}
          title="滑条同步推理等级：开启后手动拉动境界滑条会真实修改当前会话的推理等级（官方接口，与模型菜单同路径）。注意会改变实际推理强度与 token 消耗，默认关闭。"
          onClick={() => skinStudioSettings.setTierSyncEffort(!tierSync)}
        >
          等级同步：{tierSync ? '开' : '关'}
        </button>
        <button
          type="button"
          className={styles.factoryReset}
          title="一键还原出厂设置：清除皮肤偏好与全部皮肤中心设置，界面回到 DSH 原生外观（跟随系统的明暗主题）。皮肤中心本身保留，随时可以再换皮肤。"
          onClick={() => {
            skinStudioSettings.resetAll()
            try { ctx.theme.setTheme('system') } catch { /* 主题服务不可用时仅还原设置 */ }
            showToast({ message: '已还原出厂设置 — 界面回到 DSH 原生外观', type: 'success' })
          }}
        >
          还原出厂
        </button>
      </nav>

      {/* 试穿决策条：试穿期间的常驻决策入口（取代旧的常驻 toast） */}
      {tryOnSkinEntry !== null && (
        <div className={styles.tryOnBar} role="status">
          <span className={styles.tryOnBarText}>
            正在试穿：{tryOnSkinEntry.name}（临时预览，刷新自动还原）
          </span>
          <span className={styles.tryOnBarActions}>
            <button
              type="button"
              className={styles.tryOnBarPrimary}
              onClick={() => confirmTryOn(tryOnSkinEntry)}
            >
              应用并保存
            </button>
            <button
              type="button"
              className={styles.tryOnBarGhost}
              onClick={() => {
                revertTryOn(tryOnSkinEntry)
                showToast({ message: `已退出试穿 ${tryOnSkinEntry.name}`, type: 'info' })
              }}
            >
              退出还原
            </button>
          </span>
        </div>
      )}

      {/* 境界滑条：拉动改变档位（auto 时跟随 DSH 推理等级） */}
      <div className={styles.tierRow} role="group" aria-label="境界档位">
        <span className={styles.tierLabel}>境界</span>
        <button
          type="button"
          className={styles.mascotToggle}
          aria-pressed={powerTier === 'auto'}
          title="跟随 DSH 推理等级自动升降档（推荐）；再点恢复手动滑条控制"
          onClick={() => skinStudioSettings.setPowerTier(powerTier === 'auto' ? `t${effective}` as 't0' | 't1' | 't2' | 't3' | 't4' : 'auto')}
        >
          {powerTier === 'auto' ? `跟随推理（${effective + 1}档）` : '手动'}
        </button>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={powerTier === 'auto' ? effective : Number(powerTier.slice(1))}
          aria-label={`境界档位，当前第 ${effective + 1} 档 ${tierLabel(activeSkinId ?? '', effective as 0 | 1 | 2 | 3)}`}
          title="境界档位：推理等级越高，角色修为/皮肤等级越高（造型、光标、背景随之变化）"
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
          title={`上传自定义背景：替换当前皮肤（${activeSkinId ?? '未选皮肤'}）第 ${effective + 1} 档的背景图（仅本机生效，不覆盖生图资产，可反复覆盖上传）`}
        >
          上传背景(第{effective + 1}档)
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
