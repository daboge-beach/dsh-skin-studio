# 前端开发需求 · DSH Skin Studio 皮肤中心

> **📌 文档状态（2026-08-29）**：本文是 v0.1 时期的**历史设计稿**，其中的
> 需求清单与勾选项**不再维护**。当前已实现能力以根目录 `CHANGELOG.md`、
> `README.md` 和 `docs/verification-matrix.md`（自动测试/真实验证/待手测
> 三分档）为准；验收入口为 `pnpm verify`。请勿按本文未勾选项判断项目现状。

> **给前端 AI 的话**：本文档是 DeepSeek Harness 皮肤中心（Skin Studio）的前端开发需求。请基于 React + TypeScript 实现，遵循 DSH 官方 UI 设计语言。所有交互细节、组件结构、状态管理、API 调用方式都在本文档中明确给出。如有疑问直接问我，不要自己脑补设计。

---

## 项目背景

- **宿主**：DeepSeek Harness（DSH），一个基于 Cordis 插件框架的 Agent 运行时
- **本模块**：DSH 的皮肤中心插件（`@dsh-skin-studio/gallery`），作为 Cordis 客户端插件运行
- **核心目标**：让用户浏览、试穿、应用、上传皮肤
- **技术栈**：React 18 + TypeScript + 官方 Cordis 客户端 SDK（`@deepseek-ai/dsh-client-runtime`）

## 关键技术约束（必读）

### 1. 皮肤接入 DSH 的方式

皮肤不是独立的 React 组件，而是通过官方 **`ctx.theme`** API 注册：

```typescript
ctx.theme.register({
  id: 'skin-id',
  colorScheme: 'light' | 'dark',
  tokens: { '--dsw-alias-bg-base': '#fff', /* ... */ }
})
```

我们的皮肤中心 UI 要做的就是：**把这套 API 包装成可视化界面**。

### 2. CSS 变量命名

DSH 官方主题系统用 `--dsw-*` 前缀的 CSS 变量。我们的 UI 必须用这些变量做配色，这样皮肤中心自己也会跟着用户的皮肤变色：

```css
.gallery-card {
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-primary);
}
```

### 3. 不要做的事

- ❌ 不要自己实现 ThemePresenter 或直接操作 `body.style`（官方已有 ThemePresenter 处理）
- ❌ 不要用 Tailwind / styled-components 等第三方 CSS 方案（DSH 用原生 CSS Modules）
- ❌ 不要硬编码颜色值，必须用 `var(--dsw-*)`
- ❌ 不要用 emoji 做图标，用 SVG 或官方图标系统

---

## 界面一：画廊主界面（Gallery）

### 布局

```
┌─────────────────────────────────────────────────────┐
│  Skin Studio                       [搜索]  [上传皮肤] │
│  选一张皮肤，让 agent 也有自己的脸                    │
├─────────────────────────────────────────────────────┤
│  [内置] [我的] [已上传]              共 8 款 · 启用 1 │
├─────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │预览图│  │预览图│  │预览图│                        │
│  │      │  │      │  │      │                      │
│  │Aurora│  │Midn. │  │Sunset│                      │
│  └──────┘  └──────┘  └──────┘                      │
│  ┌──────┐  ┌──────┐  ┌──────────┐                  │
│  │预览图│  │预览图│  │ + 上传   │                  │
│  └──────┘  └──────┘  └──────────┘                  │
└─────────────────────────────────────────────────────┘
```

### 组件结构

```typescript
// packages/gallery/src/client/index.tsx
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

export function apply(ctx: ClientContext) {
  // 注册 Skin Studio 入口到侧边栏（通过官方 slot 系统）
  ctx.inject(['slots', 'theme'], (slotCtx) => {
    slotCtx.slots.sidebar.register({
      id: 'skin-studio',
      title: 'Skin Studio',
      icon: <PaletteIcon />,
      panel: <GalleryPanel ctx={slotCtx} />
    })
  })
}
```

### `GalleryPanel` 组件

```typescript
interface GalleryPanelProps {
  ctx: ClientContext
}

function GalleryPanel({ ctx }: GalleryPanelProps) {
  const [activeTab, setActiveTab] = useState<'builtin' | 'mine' | 'uploaded'>('builtin')
  const [skins, setSkins] = useState<SkinEntry[]>([])
  const [selectedSkin, setSelectedSkin] = useState<SkinEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tryOnSkinId, setTryOnSkinId] = useState<string | null>(null)

  // 订阅官方 theme 服务获取当前主题
  const snapshot = useThemeSnapshot(ctx)
  const activeSkinId = snapshot?.active.id

  // 加载皮肤列表
  useEffect(() => {
    skinRegistry.list(activeTab).then(setSkins)
  }, [activeTab])

  // 过滤搜索
  const filtered = skins.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.keywords?.some(k => k.includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="gallery-panel">
      <header className="gallery-header">
        <div>
          <h1>Skin Studio</h1>
          <p className="subtitle">选一张皮肤，让 agent 也有自己的脸</p>
        </div>
        <div className="header-actions">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="搜索皮肤..." />
          <UploadButton onUpload={(file) => handleUpload(file, ctx)} />
        </div>
      </header>

      <nav className="gallery-tabs">
        <Tab active={activeTab === 'builtin'} onClick={() => setActiveTab('builtin')}>内置</Tab>
        <Tab active={activeTab === 'mine'} onClick={() => setActiveTab('mine')}>我的</Tab>
        <Tab active={activeTab === 'uploaded'} onClick={() => setActiveTab('uploaded')}>已上传</Tab>
        <span className="count">
          共 {filtered.length} 款{activeSkinId && ` · 已启用 ${activeSkinId}`}
        </span>
      </nav>

      <div className="gallery-grid">
        {filtered.map(skin => (
          <SkinCard
            key={skin.id}
            skin={skin}
            active={skin.id === activeSkinId}
            tryOn={skin.id === tryOnSkinId}
            onClick={() => setSelectedSkin(skin)}
            onTryOn={() => handleTryOn(skin, ctx, setTryOnSkinId)}
          />
        ))}
        <UploadDropZone onUpload={(file) => handleUpload(file, ctx)} />
      </div>

      {selectedSkin && (
        <SkinDetailModal
          skin={selectedSkin}
          ctx={ctx}
          onClose={() => setSelectedSkin(null)}
        />
      )}
    </div>
  )
}
```

### `SkinCard` 组件

```typescript
interface SkinCardProps {
  skin: SkinEntry
  active: boolean      // 是否是当前应用的主题
  tryOn: boolean       // 是否正在试穿
  onClick: () => void
  onTryOn: () => void
}

function SkinCard({ skin, active, tryOn, onClick, onTryOn }: SkinCardProps) {
  return (
    <div
      className={`skin-card ${active ? 'skin-card--active' : ''} ${tryOn ? 'skin-card--try-on' : ''}`}
      onClick={onClick}
    >
      <div className="skin-card__preview">
        {/* 预览图：优先用皮肤包的 preview.png（真实渲染图），无则回退配色渐变 */}
        {skin.previewUrl ? (
          <img
            className="skin-card__preview-img"
            src={skin.previewUrl}
            alt={skin.name}
            loading="lazy"
          />
        ) : (
          <div className="skin-card__preview-fallback" style={{ background: skin.paletteCssGradient }} />
        )}
        {/* 吉祥物：若皮肤提供 sprite_anim.png，右下角播放 4 帧循环动画 */}
        {skin.mascotUrl && (
          <div
            className="skin-card__mascot"
            style={{ backgroundImage: `url(${skin.mascotUrl})` }}
            role="img"
            aria-label={`${skin.name} mascot animation`}
          />
        )}
        {active && <span className="skin-card__badge skin-card__badge--active">启用中</span>}
        {tryOn && <span className="skin-card__badge skin-card__badge--try-on">试穿中</span>}
      </div>
      <div className="skin-card__info">
        <div className="skin-card__title">{skin.name}</div>
        <div className="skin-card__meta">{skin.author} · v{skin.version}</div>
        <div className="skin-card__desc">{skin.description}</div>
        <div className="skin-card__variant">
          <ColorDot color={skin.palette.primary} />
          <span>{skin.colorScheme}</span>
        </div>
      </div>
      <button
        className="skin-card__try-on-btn"
        onClick={(e) => { e.stopPropagation(); onTryOn() }}
      >
        {tryOn ? '退出试穿' : '试穿'}
      </button>
    </div>
  )
}
```

#### 吉祥物动画 CSS（多帧 sprite sheet 播放）

`sprite_anim.png` 是 **2×2 网格的 4 帧动画**（1536×1536，每帧 768×768）。用 `background-position` 步进切帧，`steps(1)` 硬切不补间：

```css
/* SkinCard.module.css */
.skin-card__mascot {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 72px;
  height: 72px;
  background-size: 144px 144px;   /* 2x2 网格整体缩放到 2 倍显示尺寸 */
  background-repeat: no-repeat;
  animation: mascot-loop 1.2s steps(1) infinite;
  pointer-events: none;
}

@keyframes mascot-loop {
  0%   { background-position: 0% 0%; }    /* 左上 帧1 */
  25%  { background-position: 100% 0%; }  /* 右上 帧2 */
  50%  { background-position: 0% 100%; }  /* 左下 帧3 */
  75%  { background-position: 100% 100%; }/* 右下 帧4 */
}

/* 无障碍：用户系统开启 reduce-motion 时只显示第一帧 */
@media (prefers-reduced-motion: reduce) {
  .skin-card__mascot { animation: none; }
}

.skin-card__preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

### 关键交互逻辑

#### 试穿（Try-on）

```typescript
async function handleTryOn(skin: SkinEntry, ctx: ClientContext, setTryOn: (id: string | null) => void) {
  const snapshot = ctx.theme.getTheme()
  const previousId = snapshot.preference  // 记住原偏好

  try {
    // 即时切换到目标皮肤
    ctx.theme.setTheme(skin.id)
    setTryOn(skin.id)

    // 显示底部 toast：「满意？点应用保存 · 不满意点退出还原」
    showToast({
      message: `正在试穿 ${skin.name}`,
      actionLabel: '应用并保存',
      onAction: () => {
        // 用户确认 → 偏好已写入，清除试穿态
        setTryOn(null)
      },
      onCancel: () => {
        // 用户取消 → 切回原偏好
        ctx.theme.setTheme(previousId)
        setTryOn(null)
      },
      duration: 0  // 不自动消失，等用户决策
    })
  } catch (e) {
    showToast({ message: `试穿失败：${e.message}`, type: 'error' })
    setTryOn(null)
  }
}
```

#### 上传皮肤

```typescript
async function handleUpload(file: File, ctx: ClientContext) {
  // 1. 校验文件类型
  if (!file.name.endsWith('.zip')) {
    showToast({ message: '请上传 .zip 格式的皮肤包', type: 'error' })
    return
  }

  // 2. 解压并校验
  const progress = showProgress('正在解析皮肤包...')
  try {
    const entry = await skinRegistry.upload(file, { onProgress: progress.update })

    // 3. 校验 skin.json
    const validation = await skinRegistry.validate(entry)
    if (!validation.passed) {
      showValidationErrors(validation.errors)
      return
    }

    // 4. 加载到注册表（但不自动启用）
    await skinRegistry.install(entry)

    // 5. 切到「已上传」tab 让用户看到
    setActiveTab('uploaded')
    showToast({ message: `${entry.name} 已添加，点击卡片试用` })
  } catch (e) {
    showToast({ message: `上传失败：${e.message}`, type: 'error' })
  } finally {
    progress.close()
  }
}
```

---

## 界面二：皮肤详情面板（SkinDetailModal）

点卡片后弹出的模态面板。

### 布局

```
┌──────────────────────────────────────────────────┐
│  [大预览图区，占顶部 220px]               [dark]  │  ← 右上角色系徽章
│                                                   │
│              Midnight                             │
│         深邃夜空配色 · 护眼专注                    │
│                                                   │
├──────────────────────────────────────────────────┤
│  Midnight                                         │
│  作者 DSH Skin Studio · MIT · 来源 GitHub ↗       │
│                                                   │
│  配色预览                                         │
│  [■ bg] [■ l1] [■ l2] [■ brand] [■ label] ...     │
│                                                   │
│  Token 覆盖                          展开 ▾        │
│  --dsw-alias-bg-base         #0F172A        ■    │
│  --dsw-alias-brand-primary   #60A5FA        ■    │
│  --dsw-alias-label-primary   #F1F5F9        ■    │
│  ...                                              │
│                                                   │
├──────────────────────────────────────────────────┤
│  [取消]      [试穿（即时生效）]  [应用并保存]      │
└──────────────────────────────────────────────────┘
```

### 组件实现

```typescript
interface SkinDetailModalProps {
  skin: SkinEntry
  ctx: ClientContext
  onClose: () => void
}

function SkinDetailModal({ skin, ctx, onClose }: SkinDetailModalProps) {
  const [tokenExpanded, setTokenExpanded] = useState(false)
  const snapshot = useThemeSnapshot(ctx)
  const isActive = snapshot?.active.id === skin.id

  return (
    <Modal onClose={onClose} size="large">
      <div className="skin-detail">

        {/* 顶部大预览区：有 hero.png 立绘时用图片，否则回退纯色 */}
        <div
          className={`skin-detail__hero ${skin.heroUrl ? 'skin-detail__hero--image' : ''}`}
          style={skin.heroUrl ? undefined : {
            background: skin.palette.background,
            color: skin.palette.text
          }}
        >
          {skin.heroUrl && (
            <img
              className="skin-detail__hero-img"
              src={skin.heroUrl}
              alt={skin.name}
            />
          )}
          <button className="skin-detail__close" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
          <h1 className="skin-detail__hero-name" style={{ color: skin.palette.primary }}>
            {skin.name}
          </h1>
          <p className="skin-detail__hero-desc">{skin.description}</p>
          <div className="skin-detail__hero-badge">
            <ColorDot color={skin.palette.primary} size={6} />
            {skin.colorScheme} · v{skin.version}
          </div>
        </div>

        {/* 元信息 */}
        <div className="skin-detail__meta">
          <h2>{skin.name}</h2>
          <p className="skin-detail__author">
            作者 {formatAuthor(skin.author)} · {skin.license ?? 'MIT'}
            {skin.homepage && <> · <a href={skin.homepage} target="_blank">来源 ↗</a></>}
          </p>
        </div>

        {/* 配色 swatch 预览 */}
        <section className="skin-detail__palette">
          <h3>配色预览</h3>
          <div className="palette-swatches">
            {skin.paletteEntries.map(([name, color]) => (
              <div key={name} className="palette-swatch">
                <div className="palette-swatch__color" style={{ background: color }} />
                <span className="palette-swatch__label">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Token 覆盖列表 */}
        <section className="skin-detail__tokens">
          <div className="tokens-header">
            <h3>Token 覆盖</h3>
            <button onClick={() => setTokenExpanded(!tokenExpanded)}>
              {tokenExpanded ? '收起 ▴' : `展开 ▾ · 共 ${skin.tokenCount} 项`}
            </button>
          </div>
          <div className="tokens-list">
            {skin.tokens.slice(0, tokenExpanded ? undefined : 3).map(([name, value]) => (
              <div key={name} className="token-row">
                <code className="token-row__name">{name}</code>
                <code className="token-row__value">{value}</code>
                <span className="token-row__color" style={{ background: value }} />
              </div>
            ))}
            {!tokenExpanded && skin.tokenCount > 3 && (
              <div className="tokens-more">还有 {skin.tokenCount - 3} 项...</div>
            )}
          </div>
        </section>

        {/* 底部操作栏 */}
        <footer className="skin-detail__actions">
          <button className="btn btn--ghost" onClick={onClose}>取消</button>
          <button
            className="btn btn--primary"
            onClick={() => handleTryOn(skin, ctx, () => {})}
            disabled={isActive}
          >
            {isActive ? '当前启用' : '试穿（即时生效）'}
          </button>
          <button
            className="btn btn--outline-primary"
            onClick={() => {
              ctx.theme.setTheme(skin.id)
              showToast({ message: `${skin.name} 已应用` })
              onClose()
            }}
            disabled={isActive}
          >
            应用并保存
          </button>
        </footer>
      </div>
    </Modal>
  )
}
```

---

## 数据结构

```typescript
/** 皮肤列表项 */
interface SkinEntry {
  id: string
  name: string
  version: string
  author: string | { name: string; url?: string }
  description: string
  colorScheme: 'light' | 'dark'
  license?: string
  homepage?: string
  keywords?: string[]
  preview?: string

  /** 图片资源 URL（由皮肤包提供，SkinRegistry 解析后填充；可选） */
  previewUrl?: string    // preview.png  画廊缩略图 800x600（4:3）
  heroUrl?: string       // hero.png     竖版主立绘 1024x1536（详情页大图）
  mascotUrl?: string     // sprite_anim.png  2x2 网格 4 帧动画（卡片右下角吉祥物）

  /** 配色摘要（用于卡片背景渐变） */
  palette: {
    primary: string
    background: string
    surface: string
    text: string
    border: string
  }

  /** 完整 token 覆盖（详情面板用） */
  tokens: Array<[name: string, value: string]>
  tokenCount: number

  /** 卡片背景渐变 CSS（由 palette 生成） */
  paletteCssGradient: string

  /** 来源：内置 / npm 安装 / 用户上传 */
  source: 'builtin' | 'npm' | 'upload'

  /** 是否可删除（内置不可删） */
  removable: boolean
}

/** 皮肤注册表（单例服务） */
interface SkinRegistry {
  list(tab: 'builtin' | 'mine' | 'uploaded'): Promise<SkinEntry[]>
  upload(file: File, opts?: { onProgress?: (p: number) => void }): Promise<SkinEntry>
  validate(entry: SkinEntry): Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
  install(entry: SkinEntry): Promise<void>
  remove(id: string): Promise<void>
}
```

---

## React Hooks

```typescript
/** 订阅官方主题快照，主题变化时自动 re-render */
function useThemeSnapshot(ctx: ClientContext): ThemeSnapshot | null {
  const [snapshot, setSnapshot] = useState<ThemeSnapshot | null>(
    () => ctx.theme?.getTheme() ?? null
  )

  useEffect(() => {
    if (!ctx.theme) return
    const dispose = ctx.on('theme/change', (snap: ThemeSnapshot) => setSnapshot(snap))
    return dispose
  }, [ctx])

  return snapshot
}
```

---

## 样式规范

### CSS Modules 文件结构

```
packages/gallery/src/client/
├── index.tsx                    # 入口
├── GalleryPanel.tsx
├── GalleryPanel.module.css
├── SkinCard.tsx
├── SkinCard.module.css
├── SkinDetailModal.tsx
├── SkinDetailModal.module.css
├── UploadDropZone.tsx
├── UploadDropZone.module.css
└── hooks.ts                     # useThemeSnapshot 等
```

### 关键样式（全部用官方 dsw 变量）

```css
/* GalleryPanel.module.css */
.panel {
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.header h1 {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.header .subtitle {
  font-size: 13px;
  color: var(--dsw-alias-label-secondary);
  margin: 4px 0 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.tab {
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  cursor: pointer;
  border: 0.5px solid var(--dsw-alias-border-l1);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
}

.tab--active {
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-base);
  border-color: transparent;
}
```

```css
/* SkinCard.module.css */
.card {
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.card:hover {
  border-color: var(--dsw-alias-border-l2);
  transform: translateY(-2px);
}

.card--active {
  border: 1.5px solid var(--dsw-alias-brand-primary);
}

.card--try-on {
  border: 1.5px solid var(--dsw-alias-state-success-primary);
}

.preview {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-name {
  font-size: 18px;
  font-weight: 500;
}

.badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.badge--active { background: var(--dsw-alias-brand-primary); }
.badge--try-on { background: var(--dsw-alias-state-success-primary); }

.try-on-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.15s;
}

.card:hover .try-on-btn {
  opacity: 1;
}
```

---

## 验收标准

### 功能验收

- [ ] 画廊正确显示内置皮肤列表（aurora、midnight + 凡人修仙传 5 款）
- [ ] 有 preview.png 的皮肤显示真实缩略图，无图的回退配色渐变
- [ ] 卡片右下角吉祥物动画正常播放（4 帧循环，1.2s 周期）
- [ ] 详情页有 hero.png 时显示大立绘
- [ ] 应用皮肤后主界面右下角出现吉祥物浮层
- [ ] 开启 prefers-reduced-motion 时吉祥物停止动画
- [ ] 三个 Tab 切换正常（内置/我的/已上传）
- [ ] 搜索框可按名称/关键词过滤
- [ ] 点击卡片弹出详情面板
- [ ] 详情面板显示配色 swatch + token 列表
- [ ] 试穿按钮即时切换主题，底部 toast 提示确认
- [ ] 应用按钮持久化偏好（写入 settings）
- [ ] 上传 zip 自动校验 skin.json 格式
- [ ] 校验失败显示具体错误信息
- [ ] 当前启用的皮肤卡片有蓝色边框 + "启用中" 徽章

### 视觉验收

- [ ] 所有颜色用 `var(--dsw-*)`，不用硬编码值
- [ ] 卡片 hover 有轻微上抬效果（translateY -2px）
- [ ] 试穿中的卡片有绿色边框
- [ ] 暗色皮肤启用时，皮肤中心自己也跟着变暗
- [ ] 响应式：窄屏单列，宽屏多列
- [ ] 无 emoji，图标全部 SVG

### 代码验收

- [ ] TypeScript 严格模式无报错
- [ ] 组件拆分清晰（GalleryPanel / SkinCard / SkinDetailModal / UploadDropZone）
- [ ] CSS Modules 文件分离
- [ ] 所有 ctx 调用都在 `ctx.inject(['theme'], ...)` 内
- [ ] 卸载时正确 disposer（无内存泄漏）

---

## 联调说明

前端实现完成后，按以下方式接入 DSH：

1. 把 `packages/gallery/` 加到 monorepo 的 `pnpm-workspace.yaml`
2. 在 DSH profile 中注册：`dsh plugin --profile web add @dsh-skin-studio/gallery`
3. 启动 DSH：`dsh --profile web`，浏览器访问 `http://127.0.0.1:3080`
4. 左侧栏应出现 Skin Studio 入口

如有 Cordis 插件注册相关的疑问，参考 DSH 官方源码：
- `deepseek-harness/packages/client/ui-settings/`（一个完整的设置面板插件范例）
- `deepseek-harness/packages/client/ui-sidebar/`（侧边栏 slot 注册方式）

---

## 内置皮肤资源清单（凡人修仙传系列）

首批内置 7 款皮肤：aurora、midnight（基础款）+ 凡人修仙传 5 款角色皮肤。图片资源已生成完毕，位于 `assets/skins/{id}/`，前端直接引用：

### 资源文件规格

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `hero.png` | 1024×1536 竖版 | 详情页大图（`heroUrl`） |
| `preview.png` | 800×600 4:3 | 画廊卡片缩略图（`previewUrl`） |
| `sprite.png` | 1024×1024 透明 | 单帧静态吉祥物（备用） |
| `sprite_anim.png` | 1536×1536 2×2 网格 | 4 帧循环动画吉祥物（`mascotUrl`） |

### 五款皮肤清单

| id | name | colorScheme | 主题 | mascot 动作 |
|----|------|-------------|------|------------|
| `mupeiling-blossom` | 慕沛灵 · 桃夭 | light | 粉白国风 · 桃花薄雾 | 饮茶（端杯→吹茶→抿茶→放下） |
| `hanli-daoist` | 韩立 · 青竹 | light | 青绿道风 · 翠竹雷光 | 舞剑（起手→举剑→挥砍→收势） |
| `yinyue-lunar` | 银月 · 月华 | dark | 银蓝仙光 · 月华冷辉 | 跳舞（展袖→旋转→抛袖→收势） |
| `nangongwan-moon` | 南宫婉 · 寒梅 | light | 月白清辉 · 朱雀赤纹 | 抚琴（抬手→按弦→拨弦→抬手） |
| `ziling-mystic` | 紫灵 · 紫霞 | dark | 暗紫妖魅 · 紫纱流霞 | 打坐（闭目→结印→灵气升→睁眼） |

### 皮肤包内的资源映射

SkinRegistry 扫描皮肤包时应把以下路径映射到 `SkinEntry` 字段：

```
packages/skins/{pkg}/assets/
├── preview.png      → skin.previewUrl
├── hero.png         → skin.heroUrl
└── sprite_anim.png  → skin.mascotUrl
```

### 皮肤激活时的吉祥物浮层（增强需求）

当凡人修仙传皮肤被**应用**（非试穿）时，在 DSH 主界面右下角渲染一个更大的吉祥物浮层（160×160），动画规格同上：

```css
.skin-mascot-float {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 160px;
  height: 160px;
  background-size: 320px 320px;
  background-repeat: no-repeat;
  animation: mascot-loop 1.2s steps(1) infinite;
  opacity: 0.9;
  z-index: 999;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.skin-mascot-float:hover {
  transform: scale(1.08);
}

@media (prefers-reduced-motion: reduce) {
  .skin-mascot-float { animation: none; }
}
```

吉祥物浮层要求：
- 点击浮层弹出一个小气泡，随机显示该角色的一句台词（台词表在 `packages/types/src/quotes.ts`，本迭代可不实现，先留 TODO）
- 切换皮肤时浮层淡出淡入（`opacity` 过渡 300ms）
- 用户可在皮肤中心设置里关闭浮层（`settings.mascotEnabled`，默认 true）

---

## 待澄清问题（前端 AI 实现前问我）

1. DSH 的 Modal 组件在哪个包里？还是需要自己实现？
2. `ctx.slots.sidebar.register` 的确切 API 签名是什么？（参考 ui-sidebar 源码）
3. 文件上传走哪个 API？是写到本地 `~/.dsh/skins/` 还是有官方 attachment 服务？
4. 皮肤注册表（SkinRegistry）是前端 mock 还是有后端？目前先按前端 in-memory 实现，后续接 DSH 的插件清单服务
