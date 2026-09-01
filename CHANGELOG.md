# 更新日志 · Changelog

本文件记录面向用户的显著变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

This file documents user-facing changes. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/).

---

## [0.17.0] — 2026-08-29

**简体中文**

「获客与可信安装链路」版本。

### 新增

- **真实安装链路**：新增 `pnpm install-to-dsh`（幂等接入本机 DSH：
  定位/创建 profile → 写入 link 依赖 → 安装）；README 从 507 行双语混杂
  精简为 英文 `README.md` + 中文 `README.zh-CN.md` 双档互链，首屏 30 秒
  给出定位/差异/三步 Quick Start/Star 提示；18 款图鉴与架构移
  `docs/skin-gallery.md`
- **README 命令防失效门禁**：新增 5 项测试扫描两份 README 的全部
  bash 代码块——pnpm 命令必须对应真实 script、scripts/*.mjs 必须存在、
  npx/npm/dsh-plugin 安装命令禁止出现（除非整块标注 TODO(npm-publish)），
  从根上防止再宣传不存在的包
- **安全提醒**：审计发现 npm 非同名包 `dsh-skin-studio` 系第三方发布
  （无仓库链接），README/SECURITY 均明示本项目未发 npm、勿装来路包
- **社区模板**：bug（内置诊断信息粘贴位）/ feature / **skin_submission
  （皮肤投稿：截图·下载·兼容版本·原创与授权声明）** / PR 模板 /
  SECURITY / SUPPORT / CODE_OF_CONDUCT
- **发布物料**：v0.17.0 Release 完整草稿（`docs/release-draft-v0.17.0.md`）；
  1280×640 社交预览图（`docs/social-preview.png`，纯原创渐变生成）；
  Pages 部署评估与最小方案（`docs/pages-plan.md`，gallery 需 DSH 宿主，
  不部署打不开的页面）

### 修复

- README 删除全部 4 处不存在的 npm 安装命令（`@dsh-skin-studio/gallery`/
  `studio`/`create` 均未发布）

**English**

The "acquisition & trustworthy install chain" release.

### Added

- **Real install chain**: new `pnpm install-to-dsh` (idempotent local DSH
  wiring); README split from a 507-line bilingual mix into English
  `README.md` + Chinese `README.zh-CN.md` with a 30-second first screen;
  the 18-skin gallery tables moved to `docs/skin-gallery.md`
- **README command anti-rot gate**: 5 new tests scanning every bash block
  in both READMEs — pnpm commands must map to real scripts, referenced
  scripts must exist, npx/npm/dsh-plugin install commands are banned
  unless the block carries a TODO(npm-publish) marker
- **Security note**: audit found the non-scoped npm package
  `dsh-skin-studio` is published by a third party (no repo link);
  README/SECURITY now state this project ships no npm and to avoid
  unknown same-name packages
- **Community templates**: bug (with diagnostics paste slot) / feature /
  **skin_submission** / PR template / SECURITY / SUPPORT / CODE_OF_CONDUCT
- **Release materials**: full v0.17.0 release draft, a generated
  1280×640 social preview, and a Pages deployment assessment + minimal
  plan (the gallery needs the DSH host, so no dead page deployed)

### Fixed

- Removed all 4 nonexistent npm install commands from the README

---

## [0.16.0] — 2026-08-29

**简体中文**

「发布前质量加固」版本：生命周期修复 + 零警告基线 + 验收收敛。

### 修复

- **皮肤工坊主题注册生命周期**：移除未托管的裸 `ctx.theme.register` 与
  动态 import——工坊只负责安装（安装后不自动应用、不暗中注册），主题
  注册统一由试穿路径 `ensureThemeRegistered` 与启动恢复管理，删除/替换
  经 `unregisterGalleryTheme` 反注册无残留
- **动态+静态混合导入警告清零**：themeBridge、usageStats 改为明确静态
  导入（单文件 bundle 契约下动态导入本就不产生独立 chunk）；
  `pnpm lint` 与 `pnpm build` 均 0 警告

### 新增

- **回归测试**：主题注册生命周期三例（工坊安装不自动注册/不自动应用、
  ensure 幂等 + unregister 无残留、更新后注册新版本 + 删除后同时干净）；
  测试 123 → 126
- **统一验收入口 `pnpm verify`**：lint → typecheck → test → skin-data
  漂移 → quotes 漂移 → build → 体积门禁 → validate-skins，CI 与本地
  完全同一串
- **验证矩阵文档**（`docs/verification-matrix.md`）：如实三分档——自动
  测试覆盖 / 真实 DSH 已验证（含证据日期）/ 待真实手测（给步骤），
  并列明已知未覆盖项（焦点陷阱 DOM 行为、真实 IndexedDB 路径、跨浏览器
  矩阵）
- 工坊描述补成可编辑字段（中英 i18n）

### 文档

- `FRONTEND_REQUIREMENTS.md` / `FANREN_SKINS_DESIGN.md` 标注为历史设计稿，
  现状以 CHANGELOG / verification-matrix 为准
- `CONTRIBUTING.md` / `DEVELOPMENT.md` 验收入口指向 `pnpm verify`

**English**

The "pre-release quality hardening" release: lifecycle fix + zero-warning
baseline + acceptance convergence.

### Fixed

- Skin Composer theme-registration lifecycle: removed the un-managed bare
  `ctx.theme.register` and dynamic import — the composer only installs
  (no auto-apply, no shadow registration); registration is owned by the
  try-on path (`ensureThemeRegistered`) and startup restore, with clean
  disposal via `unregisterGalleryTheme`
- Mixed dynamic+static import warnings eliminated (themeBridge, usageStats
  now plain static imports — dynamic imports never create chunks under the
  single-file bundle contract); `pnpm lint` and `pnpm build` are both
  zero-warning

### Added

- Lifecycle regression tests (composer-style install neither
  auto-registers nor auto-applies; idempotent ensure + residue-free
  unregister; post-update registration of the new version); tests
  123 → 126
- Unified acceptance entry `pnpm verify`: lint → typecheck → test →
  drift checks → build → bundle gate → validate-skins — identical local
  and CI
- **Verification matrix** (`docs/verification-matrix.md`): honest
  three-way split — automated coverage / verified-in-real-DSH (with
  dated evidence) / manual steps — plus known-uncovered items
- Composer description is now an editable field (bilingual)

### Docs

- FRONTEND_REQUIREMENTS / FANREN_SKINS_DESIGN marked as historical design
  docs; CONTRIBUTING / DEVELOPMENT point at `pnpm verify`

---

## [0.15.1] — 2026-08-28

**简体中文**

收尾整理：文档与现实同步 + setup 健壮性。

### 修复 / 改进

- **README 双语特性表重写**：旧表还在描述不存在的 `dsh-skin init`；
  现完整反映 v0.15 全貌（18 款五档、持久化上传+回滚、皮肤工坊、
  安全模式、本地统计、开发者工具链）
- **setup 脚本加固**：`download-assets` 的 latest 解析改为「遍历
  Release 列表取最新的含资产包的那个」——未来发纯代码 Release
  （无 zip 附件）不再打断新用户的资产下载
- **DEVELOPMENT.md 命令表**：补全 gen:skin / gen:skin-data /
  gen:quotes / check:bundle 等全部现行命令

**English**

Housekeeping: docs synced to reality + setup robustness.

### Fixed / improved

- README bilingual feature tables rewritten (the old one still described
  a nonexistent `dsh-skin init`); now reflects the full v0.15 surface
- `download-assets` latest resolution now walks the release list for the
  newest release that carries asset zips — future code-only releases
  won't break fresh setups
- DEVELOPMENT.md command table now lists every current command
  (gen:skin / gen:skin-data / gen:quotes / check:bundle …)

---

## [0.15.0] — 2026-08-28

**简体中文**

「皮肤工坊」版本：无代码可视化编辑器（战略 review 第 4 条）。

### 新增

- **皮肤工坊**（画廊 🎨 创作皮肤入口）：
  - 名称/色系/品牌色三步生成标准皮肤包——14 个 alias token 按
    primary×色系自动推导（与脚手架同一套规则），5 个核心 token 可
    用取色器微调、一键重新推导
  - 可选上传 preview / hero / mascot（复用像素守卫）；未传预览图时
    自动生成品牌色渐变占位（内置零依赖 PNG 编码器：CompressionStream
    优先、stored-blocks deflate 兜底）
  - **实时预览**迷你聊天界面（侧栏/气泡/输入框/按钮随 token 渲染）
  - **WCAG 对比度检查**：正文/底色、正文/卡片、品牌色/底色三对，
    <3:1 不可读时阻止安装
  - **安装到本机**（registry 新增 installFromParts，与 zip 上传同一条
    审阅/更新替换/回滚/持久化管线）或**导出 .zip** 分享
- 测试 113 → 123（推导/对比度/PNG stored-deflate 经真实 zlib inflate
  往返校验）
- CI 体积阈值 80→88KB（工坊功能增量 +3KB gzip，理由已写入门禁注释）

**English**

The "Skin Composer" release: no-code visual editor (strategy item 4).

### Added

- **Skin Composer** (gallery 🎨 entry):
  - name/scheme/primary → a full standard skin package; 14 alias tokens
    derived from primary×scheme (same rules as the scaffolder), 5 core
    tokens editable via color pickers with one-click re-derive
  - optional preview / hero / mascot uploads (pixel guard reused); a
    gradient placeholder preview is auto-generated when absent
    (dependency-free PNG encoder: CompressionStream first, stored-blocks
    deflate fallback)
  - **live preview** of a mini chat UI (sidebar/bubbles/input/button
    rendered from tokens)
  - **WCAG contrast check** on three readability pairs; ratios below 3:1
    block install
  - **install locally** (registry installFromParts — same review /
    update / rollback / persistence pipeline as zip upload) or
    **export .zip** to share
- Tests 113 → 123 (derivation / contrast / PNG stored-deflate verified
  through real zlib inflate round-trips)
- CI size gate 80→88KB (composer adds ~3KB gzip; reason recorded in the
  gate)

---

## [0.14.0] — 2026-08-28

**简体中文**

「本地统计」版本：使用时长 / 激活 / 试穿转化，全本机零上传。

### 新增

- **使用统计面板**（设置 → 高级 → 使用统计）：
  - 各皮肤**累计使用时长**与**激活次数**排行（前 10）
  - **试穿 → 转正**次数与转化率
  - 统计起点日期；一键清除（红色确认，不可恢复）
- **隐私边界**：数据只存本机 localStorage（上限 50 皮肤条目自动剪枝），
  不上传任何服务器；后台标签页不计时长（前台可见才累计，30s 节流
  落盘 + pagehide 兜底）；安全模式下插件不启动，零采集
- 测试 107 → 113（计数 / 心跳可见性 / 清除 / 时长格式化）

**English**

The "local stats" release: usage duration / activations / try-on
conversion — all on-device, zero upload.

### Added

- **Usage stats panel** (Settings → Advanced → Usage stats):
  - per-skin **usage duration** and **activation** ranking (top 10)
  - **try-on → apply** counts with conversion rate
  - collection start date; one-click clear (red confirm, irreversible)
- **Privacy boundary**: data lives only in localStorage (auto-pruned to
  50 skin entries), never uploaded; background tabs don't accrue time
  (visible-only accumulation, 30s write throttling, pagehide flush);
  safe mode never starts the plugin, so zero collection
- Tests 107 → 113 (counters / tick visibility / clear / duration
  formatting)

---

## [0.13.0] — 2026-08-28

**简体中文**

「版本与更新管理」版本：更新审阅 + 一键回滚 + 删除激活皮肤回退。

### 新增

- **manifest 版本管理字段**：`changelog`（本版更新说明数组）、
  `deprecated`（作者弃用标记）、`replaces`（换代关系，不得指向自身）
  ——校验器同步拦截格式错误
- **更新审阅**：同 id 重新上传且版本不同 → 审阅窗展示「v旧 → v新 +
  更新内容 + 回滚提示」，替代静默覆盖；作者没写 changelog 时明确
  告知旧版仍可回滚
- **一键版本切换**：更新安装自动保留旧版整包快照（IndexedDB，单级）；
  详情页「切到 vX」在两个版本间双向切换（再点一次切回来），激活中的
  皮肤切换时实时重注册主题
- **删除激活皮肤回退**：删除正在使用的皮肤立即回原生主题 + 清记忆
  （此前界面会挂在已删除的主题上直到刷新）

**English**

The "versioning & updates" release: update review + one-click rollback +
active-skin removal fallback.

### Added

- **Manifest versioning fields**: `changelog` (per-version notes),
  `deprecated` (author flag), `replaces` (supersession, must not be
  self) — the validator enforces their shapes
- **Update review**: re-uploading the same id with a different version
  shows "vOld → vNew + changelog + rollback note" instead of silently
  overwriting; missing changelog still tells you the old version is
  recoverable
- **One-click version switch**: update installs keep the previous full
  snapshot (IndexedDB, single level); the detail page offers "switch to
  vX" toggling between both versions (click again to go forward);
  switching the active skin re-registers its theme live
- **Active-skin removal fallback**: deleting the skin in use immediately
  returns to the native theme and clears memory (previously the UI hung
  on the deleted theme until refresh)

---

## [0.12.0] — 2026-08-28

**简体中文**

「稳定性与可恢复性」版本：宿主适配层 + 安全模式 + 诊断出口。

### 新增

- **HostAdapter 宿主适配层**：对宿主的全部 DOM 观察（模型按钮 / 推理
  等级 / 发送按钮忙碌态 / hero 阶段标记）从 4 个组件集中到单一适配层
  ——上游 DSH 改 UI 时只改一处；能力探测（detectCapabilities）+ 各
  消费方自带降级路径
- **安全模式**：皮肤把界面弄到不可读时的救援通道 —— URL 加
  `?safe-theme=1` 重开即跳过全部第三方视觉（皮肤恢复/特效/吉祥物/
  控制条），原生横幅一键恢复；`?safe-theme=0` 显式清除记忆；标记
  记忆在 sessionStorage（同一标签页持续有效）
- **启动失败回退**：皮肤恢复异常时自动回原生主题并清记忆
  （body dataset 留诊断标记），绝不黑屏
- **诊断出口**：设置面板「复制诊断信息」一键复制宿主构建号 / 插件
  版本 / 能力面 / 活动皮肤 / 设置快照（只含技术状态，不含对话内容）

### 文档

- **产品定位**：README 主标题句改为「DSH 的可安装视觉主题平台」，
  明确三层架构（Skin Runtime / Skin Studio / Skin Packs）
- **IP 免责声明**（中英双语）：社区同人定位、卡通演绎、可独立下架、
  原创旗舰（Aurora/Midnight）作为默认宣传素材
- **性能预算**：创作指南新增体积/像素/动画预算表与自查清单

**English**

The "stability & recoverability" release: host adapter + safe mode +
diagnostics.

### Added

- **HostAdapter layer**: all host DOM probing (model button / reasoning
  effort / send-button busy / hero phase) centralized from 4 components
  into one adapter — upstream UI changes now touch a single file;
  capability detection with per-consumer graceful degradation
- **Safe mode**: rescue hatch when a skin makes the UI unreadable —
  load with `?safe-theme=1` to skip all third-party visuals (skin
  restore / effects / mascot / docks) with a native banner to restore;
  `?safe-theme=0` explicitly clears; flag persists in sessionStorage
- **Startup failure fallback**: skin restore errors fall back to the
  native theme and clear memory (diagnostic flag on body dataset) —
  never a black screen
- **Diagnostics**: "Copy diagnostics" in settings grabs host build /
  plugin version / capabilities / active skin / settings snapshot
  (technical state only, no conversation content)

### Docs

- **Positioning**: README headline now "an installable visual theme
  platform for DSH" with the three-layer architecture (Skin Runtime /
  Skin Studio / Skin Packs)
- **IP disclaimer** (bilingual): fan-work positioning, cartoon
  interpretation, per-pack removal, original flagships as default
  showcase
- **Performance budget**: size/pixel/animation budget table and
  checklist in the authoring guide

---

## [0.11.0] — 2026-08-28

**简体中文**

「开发者体验」版本：皮肤脚手架 CLI + 创作指南。

### 新增

- **皮肤脚手架**：`pnpm gen:skin -- <id> --name "中文名" [--scheme]
  [--primary] [--author]` 一条命令生成皮肤包骨架——完整 manifest
  （14 个 alias token 按 primary×色系自动推导）+ 800×600 渐变占位
  预览图（零依赖 PNG 编码器）；接上 v0.10 的单一真源管线：骨架 →
  `pnpm gen:skin-data` 自动进画廊 → `validate-skins` 过门禁
- **创作指南**（`docs/skin-authoring.md`）：资产规格表（尺寸/体积红线）、
  token 语义与配色建议、分档与光标约定、独立 npm 分发指引、提交前
  检查清单；CONTRIBUTING 已链接
- **测试与皮肤数量解耦**：内置清单/注册表/探针测试改为结构性断言
  （旗舰款在册 + 顺序稳定 + 来源正确），新增皮肤不再需要改测试数字

**English**

The "developer experience" release: skin scaffolder CLI + authoring guide.

### Added

- **Skin scaffolder**: `pnpm gen:skin -- <id> --name "..." [--scheme]
  [--primary] [--author]` generates a complete skin package skeleton —
  full manifest (14 alias tokens derived from primary×scheme) + an
  800×600 gradient placeholder preview (dependency-free PNG encoder);
  wired into the v0.10 single-source pipeline: skeleton →
  `pnpm gen:skin-data` into the gallery → `validate-skins` gate
- **Authoring guide** (`docs/skin-authoring.md`): asset spec table
  (sizes/size caps), token semantics, tier & cursor conventions,
  standalone npm packaging, pre-submit checklist; linked from
  CONTRIBUTING
- **Tests decoupled from skin count**: builtin list / registry / probe
  tests now use structural assertions (flagship ids present + stable
  order + correct source), so adding a skin no longer breaks tests

---

## [0.10.0] — 2026-08-28

**简体中文**

「架构与性能」版本：bundle 减重 34% + 皮肤数据单一真源 + CI 架构门禁。

### 新增

- **语录外置 JSON（bundle 减重）**：DSH 的插件 client 是单文件契约
  （动态 import 会被内联、无法懒加载），语录素材改为生成到各皮肤
  assets/quotes.json（每款 200×2 句 + 问候），运行时按需 fetch
  （quotePool：预热 + 内存缓存 + 未就绪回退池）——client bundle
  **345KB → 239KB（gzip 96KB → 63KB，-34%）**
- **皮肤数据单一真源**：新增 gen-skin-data 生成器——从各皮肤
  src/index.ts 提取 tokens 合并进 skin.json，再生成 builtinSkins.gen.ts；
  23KB 手写镜像表缩成 2.5KB 装配层（策展展示顺序保留）。新增皮肤
  = 建包 + `pnpm gen:skin-data`，不再三处手工同步
- **CI 架构门禁**：生成数据漂移检查（skin.json tokens /
  builtinSkins.gen.ts / quotes.json 与源不一致即失败）+ client bundle
  体积阈值（gzip ≤80KB，超限必须说明理由）

**English**

The "architecture & performance" release: 34% bundle cut + single source
of truth for skin data + CI architecture gates.

### Added

- **Quotes as external JSON (bundle slimming)**: the DSH plugin client is
  a single-file contract (dynamic imports get inlined — no true lazy
  loading), so quote packs are generated into each skin's
  assets/quotes.json (200×2 lines + greetings per skin) and fetched on
  demand (quotePool: warm + memory cache + fallback pool until ready) —
  client bundle **345KB → 239KB (gzip 96KB → 63KB, -34%)**
- **Single source of truth for skin data**: new gen-skin-data generator —
  extracts token literals from each skin's src/index.ts into skin.json,
  then emits builtinSkins.gen.ts; the 23KB hand-maintained mirror table
  shrinks to a 2.5KB assembly layer (curated display order preserved).
  Adding a skin = create the package + `pnpm gen:skin-data`
- **CI architecture gates**: generated-data drift checks (fails when
  skin.json tokens / builtinSkins.gen.ts / quotes.json drift from source)
  and a client bundle size threshold (gzip ≤80KB; raising it needs a
  stated reason)

---

## [0.9.0] — 2026-08-28

**简体中文**

「交互体验」版本：设置面板重构 + 完整中英文 + 无障碍。

### 新增

- **设置面板**：顶部 8 个开关按钮全部收进 ⚙ 设置抽屉，按
  外观 / 动效 / 吉祥物 / 提醒 / 高级 分组（每项带说明文字）；
  画廊一级操作只留 搜索 / 上传 / 设置入口
- **完整中英文**：主画廊、设置面板、审阅与确认弹窗、toast 全部经
  i18n 取词；新增「界面语言」设置（自动跟随浏览器 / 中文 / English，
  实时切换）；搜索同时匹配名称 / 描述 / 关键词（描述双语，天然兼容
  中英检索）
- **模态无障碍**：焦点陷阱（Tab 循环）、打开聚焦首个控件、关闭把
  焦点还给触发元素、背景滚动锁定（全部模态受益：详情 / 审阅 /
  确认 / 设置）
- **危险操作确认**：删除上传皮肤、还原出厂均先弹确认对话框（红色
  主按钮），不再一键直删

**English**

The "interaction polish" release: settings drawer + full i18n + a11y.

### Added

- **Settings drawer**: the 8 toolbar toggles collapse into a ⚙ drawer
  grouped by Appearance / Motion / Mascot / Alerts / Advanced (each with
  description); the gallery keeps only Search / Upload / Settings
- **Full i18n**: main gallery, settings drawer, review & confirm dialogs,
  toasts all localized; new "UI language" setting (auto / Chinese /
  English, live switching); search matches name / description / keywords
  (bilingual descriptions cover both languages)
- **Modal accessibility**: focus trap (Tab cycling), initial focus on
  open, focus returned to the trigger on close, background scroll lock —
  all modals benefit
- **Danger confirmations**: deleting an uploaded skin and factory reset
  now confirm first (red primary button) instead of firing immediately

---

## [0.8.0] — 2026-08-28

**简体中文**

「上传中心可信化」版本：持久化 + 安全限制 + 安装审阅。

### 新增

- **上传皮肤持久化（IndexedDB）**：安装过的皮肤刷新后自动恢复（manifest +
  图片字节入库；启动时重建注册与主题），「已上传」从会话级变成真正的
  「已安装」；隐私模式等无 IndexedDB 环境自动降级为内存实现并提示
- **zip 安全限制**：解压前预检条目数（≤2000）、单文件解压量（≤60MB）、
  总解压量（≤240MB）、异常压缩比（>100:1 拒绝，疑似 zip bomb）；路径
  安全拒绝绝对路径 / `..` 穿越 / 重复条目 / 深度 >8；压缩包本体 ≤50MB
- **图片尺寸守卫**：PNG/JPEG/GIF 文件头直读像素（不解码），任一边
  >8192px 拒绝安装（防超大像素图拖垮浏览器）
- **安装前能力审阅**：上传后先弹审阅窗——覆盖多少 token、使用哪些图片
  （路径/像素/体积）、包大小、作者与许可证、校验警告、本地性承诺
  （不上传服务器、卸载即全删），确认后才安装
- **导出 .zip**：已安装的上传皮肤可一键导回 zip（零依赖 STORE 打包器，
  UTF-8 文件名），备份 / 分享 / 换机迁移
- **更新安装**：同 id 重复上传从报错改为原位替换（覆盖安装），object URL
  无泄漏释放

**English**

The "trustworthy upload center" release: persistence + safety caps + install review.

### Added

- **Uploaded-skin persistence (IndexedDB)**: installed skins survive refresh
  (manifest + image bytes stored; registry and themes rebuilt at startup);
  "uploaded" becomes truly "installed"; graceful in-memory fallback where
  IndexedDB is unavailable (private mode)
- **Zip safety caps**: pre-inflate checks on entry count (≤2000), per-entry
  (≤60MB) and total (≤240MB) uncompressed sizes, compression ratio (>100:1
  rejected as suspected zip bomb); path safety rejects absolute paths, `..`
  traversal, duplicates, depth >8; archive itself capped at 50MB
- **Image dimension guard**: header-parsed PNG/JPEG/GIF pixel sizes (no
  decode); any side >8192px rejected
- **Install review modal**: before installing, shows exactly what the skin
  overrides (token count), which images it uses (path/pixels/size), package
  size, author/license, validation warnings, and the locality promise
  (nothing leaves the browser; uninstall removes everything)
- **Export to .zip**: one-click re-pack of any installed upload (dependency-
  free STORE writer, UTF-8 names) for backup / sharing / migration
- **Update installs**: re-uploading the same id now replaces in place instead
  of erroring; object URLs revoked without leaks

---

## [0.7.1] — 2026-08-28

**简体中文**

「发布可靠性」补丁：CI 质量门禁完整落地。

### 新增

- **ESLint 10 flat config**（`eslint.config.js`）：`pnpm lint` 从「直接失败」
  变为可执行门禁（recommended 规则集 + 基线放宽，全仓 0 error 0 warning）
- **CI 完整流水线**：install → lint → typecheck → test（87）→ build（38 包）
  → validate-skins（发布门禁，产物检查需要先 build）
- **皮肤校验器升级**：按 package.json main/exports 检查真实产物（此前写死
  lib/index.js，实际产物是 lib/index.mjs）；预览图缺失由 warning 升 error；
  新增资产引用存在性、单文件体积（>12MB error）、PNG 像素（>7680 error）检查

### 修复

- **跨平台**：`clean` 从 `rm -rf` 改为 Node 脚本（Windows 原生环境可用）
- **去绝对路径**：gallery prebuild 的 `E:/goodlookingDS/...` 硬编码改为
  `scripts/sync-host-manifest.mjs`（DSH_HOST_ROOT 环境变量或兄弟目录解析；
  未接线环境打印原因后正常跳过，接线环境同步失败则挡构建不再静默吞掉）
- **17 个 skins 包 `main` 指向错误产物**（`./lib/index.js` → 实际的
  `./lib/index.mjs`）
- **aurora / midnight 补齐预览图**（复用各自 bg，画廊卡片不再只有渐变回退）

**English**

Release-reliability patch: the full CI quality gate.

### Added

- ESLint 10 flat config (`eslint.config.js`): `pnpm lint` goes from
  "fails outright" to a working gate (recommended ruleset + baseline
  relaxations; 0 errors, 0 warnings repo-wide)
- Full CI pipeline: install → lint → typecheck → test (87) → build (38
  packages) → validate-skins (release gate; artifact checks need the build)
- Skin validator upgrades: checks real artifacts from package.json
  main/exports (previously hardcoded lib/index.js while tsdown emits
  lib/index.mjs); missing preview now an error; added asset-reference
  existence, per-file size caps (>12MB error), and PNG pixel caps
  (>7680px error)

### Fixed

- Cross-platform `clean` (Node script instead of `rm -rf`)
- Removed the hardcoded `E:/goodlookingDS/...` from the gallery prebuild —
  now `scripts/sync-host-manifest.mjs` (DSH_HOST_ROOT env var or sibling-dir
  resolution; skips with a printed reason on unwired hosts, and FAILS the
  build instead of silently swallowing sync errors on wired hosts)
- 17 skin packages' `main` pointed at the wrong artifact
  (`./lib/index.js` → the actual `./lib/index.mjs`)
- aurora / midnight now ship preview images (reusing their bg; gallery
  cards no longer fall back to gradient-only)

---

## [0.7.0] — 2026-08-28

**简体中文**

「欢迎页控制条 + 光标热点校准」版本。

### 新增

- **欢迎页控制条**：模型选择 + 档位滑条现在在欢迎页（hero）也可用 ——
  补注册官方 `conversation.input.dock` 槽位（宿主将 `composer.dock` 排除在
  hero 之外）；hero ↔ 会话双向切换即时生效，两页各一条不重复

### 修复

- **光标热点逐款校准**：16 款皮肤光标的点击作用点按 SVG 几何重新计算
  （有尖端的取尖端：剑尖/箭头/火箭头/簪首/水滴尖/音符头；对称法器取
  中心），全部经浏览器栅格化逐像素验证落在实体图形上，「换了指针点不准」
  问题解决
- **韩立剑光标出界**：旋转 transform 使剑尖画出 32×32 画布被裁剪，
  修正后完整入画
- **南宫婉玉簪光标错位**：transform 双重偏移把簪子画到画布右边界外，
  修正为竖直居中
- **skins 包构建依赖**：17 个皮肤包脚手架误写 `tsdown@^0.0.1`（占位
  包），对齐 `^0.22.2`，`pnpm build` 全仓 38 包通过

**English**

The "welcome-page dock + cursor hotspot calibration" release.

### Added

- **Welcome-page dock**: model picker + tier slider now also live on the
  welcome (hero) page via the official `conversation.input.dock` slot (the
  host excludes `composer.dock` from hero); instant hero ↔ conversation
  handoff, exactly one dock per page

### Fixed

- **Per-skin cursor hotspot calibration**: all 16 skin cursors' click points
  recomputed from SVG geometry (tips for pointed cursors — sword tip,
  arrowheads, rocket nose, hairpin head, teardrop tip, note head; centers for
  symmetric focuses), each verified pixel-accurate against rasterized SVGs
- **Han Li sword cursor clipped**: rotation transform drew the blade tip
  outside the 32×32 canvas; now fully on-canvas
- **Nangong Wan hairpin cursor misplaced**: double offset pushed the pin past
  the canvas edge; now vertical and centered
- **Skins package build deps**: 17 skin packages pinned a placeholder
  `tsdown@^0.0.1`; aligned to `^0.22.2` — full repo build (38 packages) green

---

## [0.6.0] — 2026-08-25

**简体中文**

「全皮肤五档 + 自定义背景 + 性能与国际化」版本。

### 新增

- **全部 16 款皮肤第 5 档（化神/至臻）**：48 张 AI 生成资产（bg+hero+sprite），
  凡人修仙传=化神期法则领域，LOL=至臻 Prestige 宇宙光能形态
- **自定义背景上传**：按皮肤×档位上传自定义背景图（≤12MB），不覆盖生图
  资产（bg.custom.png），一键恢复原图；裁剪填满/完整显示双模式
- **滑条档位自适应**：档位数量随当前模型等级列表自动调整（GLM 5 档 /
  DeepSeek 4 档），档名显示真实等级名
- **背景原图透出**：压图底色层大幅透明（36%→11%），背景图清晰呈现
- **UI 中英双语**：i18n 模块，浏览器语言自动检测
- **npm 发布准备**：SKINS_ROOT 支持环境变量 DSH_SKIN_STUDIO_ROOT
- **CI**：GitHub Actions（typecheck + 87 tests + build）
- **演示 GIF**：自动录制嵌入 README
- **Git LFS**：179 张 PNG 资产（384MB）由 LFS 管理，clone 轻量

### 修复

- 滑条拉不到最右档：视觉档位与滑条位置解耦
- 换模型（GLM）后皮肤被顶掉黑屏：userTouched 猜测移除
- 等级识别简化：未识别等级词保持当前档位
- 推理等级联动（cordis 注入 + store.getSnapshot + 设置版本迁移 v2）
- 拉克丝 t4 解剖事故（三只手）重生成
- 3 个独立轮询合并为统一 1s tick

---

**English**

The "all-skins tier-5 + custom backgrounds + perf & i18n" release.

### Added

- **All 16 skins tier-5 (Hua Shen / Prestige)**: 48 AI-generated assets
  (bg+hero+sprite); Mortal's Journey = law domains, LoL = cosmic light forms
- **Custom background upload**: per-skin per-tier custom wallpaper (≤12MB),
  non-destructive overlay (bg.custom.png), one-click reset; crop-fill /
  full-fit dual mode
- **Adaptive tier slider**: tier count follows the model's effort list
  (GLM 5 / DeepSeek 4); shows real effort names
- **Background see-through boost**: base layer 36%→11%, wallpapers pop
- **UI bilingual** (zh/en): i18n module with browser language detection
- **npm-ready**: SKINS_ROOT via DSH_SKIN_STUDIO_ROOT env var
- **CI**: GitHub Actions (typecheck + 87 tests + build)
- **Demo GIF**: auto-recorded, embedded in README
- **Git LFS**: 179 PNG assets (384MB) managed by LFS, lightweight clone

### Fixed

- Slider couldn't reach rightmost tier (visual/slider position decoupled)
- Black screen after model switch (userTouched guesswork removed)
- Unknown effort names keep current tier (no more sudden drop to 0)
- Effort sync chain (cordis injection + store.getSnapshot + settings v2)
- Lux t4 anatomy accident (three hands) regenerated
- 3 polling loops consolidated into a single 1s tick

## [0.5.0] — 2026-08-17

**简体中文**

「输入区控制条 + 滑条双向同步真实推理等级」版本。

### 新增

- **输入区控制条**：模型选择 + 境界档位滑条直接放在输入框下方（官方
  conversation.composer.dock 槽位）；模型按钮点击打开官方菜单，文案
  实时镜像当前模型与推理等级
- **滑条双向同步真实推理等级**：开启后拖动境界滑条真实修改当前会话的
  推理等级 —— 走官方 modelDirectories/sessions.selectModel 接口，与
  模型菜单点选完全同路径；dock 上「⇄视觉/⇄同步」一键切换（默认开，
  同步会真实改变推理强度与 token 消耗）
- **一键还原出厂**：红色醒目按钮，清除皮肤偏好与全部设置回到 DSH
  原生界面（插件保留）
- **光标开关**：光标热点影响点击精度时一键回系统光标
- LOL 8 款分档人物背景补齐（16 款 × 4 档 = 64 张全量；女英雄丰满
  迷人向，prompt 点名官方英雄称号）
- 检索关键词：README/package.json 加英雄联盟/凡人修仙传/国漫/
  xiuxian/donghua 等

### 修复

- 换模型（如切 GLM）后皮肤被顶掉黑屏：移除 userTouched 猜测逻辑，
  有皮肤记忆一律顶回；回原生唯一入口=还原出厂
- 等级识别简化：未识别的等级词保持当前档位不突变（不再错误落 0 档）
- 皮肤资产禁强缓存：换图后立即可见
- 15 个角色语录去除写死「周五」的时间错乱
- 吉祥物 Q 版手办徽章化
- 适配 DSH rc.8：构建预设 workspace 扫描（manifest 副本 + prebuild
  自动同步）、cordis 服务注入、设置存储版本迁移 v2

---

**English**

The "composer dock + slider-to-reasoning-effort two-way sync" release.

### Added

- **Composer dock control bar**: model selection + tier slider docked
  right under the message box (official conversation.composer.dock slot);
  the model button opens the native menu and mirrors the current model and
  effort level in real time
- **Slider syncs the real reasoning effort**: when enabled, dragging the
  tier slider actually changes the session's reasoning effort through the
  official modelDirectories / sessions.selectModel path (identical to
  picking in the model menu); toggled by the dock's ⇄ button (default on —
  it genuinely changes reasoning strength and token cost)
- **One-click factory reset**: prominent red button restores the native
  DSH look (plugin stays)
- **Cursor toggle**: fall back to system cursors when hotspots hurt clicks
- Remaining 8 LoL tiered character backgrounds delivered (16 skins × 4
  tiers = 64 total; female champions glamorous, prompts name official
  champion titles)
- Search keywords: LoL / Mortal's Journey / donghua / xiuxian etc. in
  README and package.json

### Fixed

- Black screen after switching models (e.g. to GLM): the userTouched
  guesswork removed — any built-in theme flip is bounced back to the saved
  skin; the only path back to native is Factory Reset
- Effort recognition simplified: unknown effort names keep the current
  tier instead of dropping to 0
- Skin assets served no-cache so swaps are visible at once
- Day-neutral quotes ("Friday" lines removed across 15 characters)
- Mascot restyled as a chibi figure badge
- DSH rc.8 compatibility: build preset workspace scan (manifest copy +
  prebuild sync), cordis service injection, settings storage migration v2

## [0.3.0] — 2026-08-16

**简体中文**

本版本是「吉祥物生态 + 境界档位」大版本：吉祥物从静态挂件进化为满屏溜达的桌面宠物，
任务完成有提醒，推理等级首次联动皮肤资产分级，并加入第一款梗文化皮肤。

### 新增

- **境界档位系统（推理等级联动）**：皮肤中心新增「境界滑条」，默认跟随 DSH 推理等级
  自动升降档，也可手动锁定。档位驱动吉祥物造型、光标配色、背景装饰密度三类资产：
  - 凡人修仙传系列按修为境界：炼气 → 筑基 → 结丹 → 元婴（韩立四档全新生图：朴素青衫
    一柄竹剑 → 金线道袍飞剑×4 → 金丹剑阵×12 → 元婴虚影七十二剑阵紫金神雷）
  - 英雄联盟系列按皮肤等级：基础 → 史诗 → 传说 → 终极（阿狸从经典忍狐一路进化到
    九尾金色女神）
  - 光标三态配色随档位递进（增艳 → 金调 → 圣光描边），装饰粒子密度 ×1.0 ~ ×2.8
  - 服务端支持档位资产缺失自动回退，生图不完整不空白
- **任务完成提醒**：DSH 宿主本身没有任务完成通知，皮肤中心补上——提示音
  （Web Audio 实时合成，零音频文件，音色按皮肤系列三档：凡人系古筝拨弦 / LOL 系号角
  双响 / 基础系清脆叮咚）+ 吉祥物庆祝动作（跳两下带旋转）+ 完成专用语录（中英各 8 条）。
  设置可切换：关 / 声音 / 动作 / 声音+动作；3 秒节流防连环响
- **吉祥物满屏漫步**：从右下角小区域扩大到全屏随机走位；驻足点自动避开正文文字列
  与左侧会话侧栏，走动路径不受限；节奏更活泼（驻足 1.6s / 走位 1.8s）
- **梗文化皮肤「梁神 · 深度求道」**：社区梗「薛定谔的梁」——凉子（冻得发抖抱 GPU 取暖）
  → 梁子（卫衣淡定）→ 梁圣（圣袍 token 光环）→ 梁神（始皇帝形态：龙袍冕旒主板龙椅）。
  卡通 caricature 形象（非真人肖像），笏板「梁」字光标，算力星尘装饰，200 句双语梗语录
  （「赛博菩萨也是要交电费的」「黄历宜开源新模型，忌发布跳票」）
- **动画播放策略设置**：「跟随系统（默认，无障碍友好）/ 始终播放」——系统全局关闭动画
  效果时，皮肤动效不再被连坐静止
- 皮肤中心支持以 DSH profile bundle 方式安装（`dsh.bundle` 声明 + cordis patch）

### 修复

- **试穿语义重构**：试穿不再等于应用——试穿是临时预览（刷新自动还原，不写入偏好记忆），
  「应用并保存」是唯一落记忆入口。原来常驻页面的决策 toast（永不消失）改为 3.5 秒轻提示，
  决策入口移到面板内常驻试穿条（关闭面板再打开预览与决策条延续）
- 韩立皮肤按钮符文（雷/符）文本从透明态移入 hover 规则，不再污染按钮可访问名称（读屏友好）
- 内置皮肤从 17 款增至 18 款（测试断言与 README 同步）

---

**English**

This release is the "mascot ecosystem + power tiers" milestone: the mascot evolves
from a static widget into a wandering desktop pet, tasks get completion alerts,
reasoning effort now drives tiered skin assets, and the first meme-culture skin joins.

### Added

- **Power tier system (reasoning-effort linked)**: a new tier slider in the Skin
  Studio follows the DSH reasoning effort level by default (or locks manually).
  Tiers drive mascot sprites, cursor color variants, and decoration density:
  - Mortal's Journey series by cultivation stage: Qi Condensation → Foundation →
    Core Formation → Nascent Soul (Han Li gets four freshly generated forms:
    plain robes & one bamboo sword → golden-trim robes & 4 flying swords →
    golden core & 12-sword array → soul avatar & 72-sword sky array)
  - League of Legends series by skin tier: Base → Epic → Legendary → Ultimate
    (Ahri evolves from the classic kunoichi fox to the nine-tail golden goddess)
  - Cursor tint progresses per tier (vivid → golden → holy-light outline);
    decoration density scales ×1.0–×2.8; server falls back to base assets when
    a tier image is missing
- **Task-done alerts**: DSH itself has no task-completion notification — the Skin
  Studio adds one: a synthesized chime (Web Audio, zero audio files; timbre per
  series: guzheng pluck / horn double-fanfare / crisp ding) + a mascot celebration
  (double hop with spin) + a dedicated done-quote pool (8 zh + 8 en). Toggleable:
  off / sound / motion / both; 3-second throttle
- **Full-screen mascot wandering**: the mascot now roams the whole page; rest
  points avoid the conversation text column and the session sidebar while walking
  paths stay free; livelier cadence (1.6s rest / 1.8s stroll)
- **Meme skin "Liang Shen · Deep Quest"**: the community's "Schrödinger's Liang"
  meme — Chilly (shivering, hugging a GPU for warmth) → Liang-zi (calm hoodie) →
  Saint (sage robes, token halo) → Emperor (Qin Shi Huang form: dragon robes,
  imperial crown, motherboard throne). Cartoon caricature (not a real person's
  likeness), a "梁" tablet cursor, compute-stardust decor, and 200 bilingual
  meme quotes ("The Cyber Buddha still pays the electricity bill")
- **Animation policy setting**: "Follow system (default, a11y-friendly) / Always
  play" — skin motion no longer frozen when the OS disables animations globally
- Skin Studio can now be installed as a DSH profile bundle (`dsh.bundle`
  declaration + cordis patch)

### Fixed

- **Try-on semantics rework**: trying on is no longer applying — it is a temporary
  preview (reverts on refresh, never writes the preference memory); "Apply & save"
  is the only persistence path. The old never-dismissable decision toast becomes
  a 3.5s hint; decisions moved to an in-panel try-on bar that survives panel close
- Han Li's button runes (雷/符) no longer pollute accessible button names — their
  text now only exists in the hover rule (screen-reader friendly)
- Built-in skins 17 → 18 (tests and README synced)

---

## [0.4.0] — 2026-08-17

**简体中文**

「背景透出 + 全皮肤分档人物背景」版本：磨砂玻璃演化为纯半透明透出，
16 款皮肤的人物背景随推理等级切换，外加一批体验修复与还原出厂功能。

### 新增

- **背景透出（16 款全皮肤）**：皮肤人物背景图铺满窗口，界面面板半透明
  直接透出（无磨砂模糊）；aurora/midnight 补齐专属背景图
- **分档人物背景（16 款 × 4 档 = 64 张生图）**：推理等级越高人物状态越高
  - 凡人修仙传 5 款：炼气 → 筑基 → 结丹 → 元婴（人物为画面主体）
  - 英雄联盟 10 款：基础 → 史诗 → 传说 → 终极神话（女英雄丰满迷人向，
    prompt 点名官方英雄身份；男英雄帅气递进）
  - 梁神：凉子 → 梁子 → 梁圣 → 梁神（始皇帝形态）
  - 未生成档位自动回退原背景 / 滤镜递进
- **一键还原出厂**：红色醒目按钮，一键清除皮肤偏好与全部设置、回到
  DSH 原生界面（皮肤中心插件保留）
- **光标开关**：皮肤光标热点偏移影响点击精度时可一键回系统光标
- 推理等级识别兼容中文档名（深度思考/高/中/快速等）

### 修复

- 推理等级联动不跟随：MutationObserver 之外加 2s 轮询兜底
- 皮肤资产禁强缓存（max-age=3600 → no-cache）：换图后立即可见
- 侧栏透出失效：token 变量前缀拼错（dsh→dsw）+ blur 层级偏移
- 吉祥物 Q 版手办化（132px 圆形徽章 + 描边 + 底座投影）
- 语录时间错乱：15 个角色素材去除写死「周五」的句子
- 档位检测探针 body data-xl-tier（诊断联动链路）

---

**English**

The "see-through backgrounds + tiered character art" release: glassmorphism
evolved into pure translucency, 16 skins now swap character backgrounds with
the reasoning effort level, plus a batch of UX fixes and factory reset.

### Added

- **Background see-through (all 16 skins)**: character wallpaper fills the
  window with translucent panels revealing it (no blur); aurora/midnight got
  their own wallpapers
- **Tiered character backgrounds (16 skins × 4 tiers = 64 images)**: higher
  reasoning effort, higher character state
  - Mortal's Journey ×5: Qi Condensation → Foundation → Core Formation →
    Nascent Soul (character as the dominant subject)
  - League of Legends ×10: Base → Epic → Legendary → Ultimate mythic forms
    (female champions on the glamorous, full-figured side, prompts name the
    official champion titles; male champions heroic progression)
  - Liang Shen: Chilly → Liang-zi → Saint → Emperor (Qin Shi Huang form)
  - Missing tiers fall back to the base wallpaper / filter progression
- **One-click factory reset**: a prominent red button clears the skin
  preference and all settings, returning to the native DSH look (the plugin
  itself stays)
- **Cursor toggle**: fall back to system cursors when skin cursor hotspots
  hurt click precision
- Chinese reasoning-effort names recognized (deep/high/medium/fast etc.)

### Fixed

- Reasoning-effort following: 2s polling fallback besides MutationObserver
- Skin assets served no-cache (was max-age=3600): image swaps visible at once
- Sidebar see-through: misspelled token prefix (dsh→dsw) + blur-layer offset
- Mascot restyled as a chibi figure badge (132px round frame, outline, stand)
- Quote time confusion: 15 characters' hardcoded "Friday" lines made day-neutral
- Observable tier probe on body data-xl-tier

## [0.2.x] — 2026-08-15

**简体中文**

- 仓库开源发布（GitHub `daboge-beach/dsh-skin-studio`）：Topics 标签 ×10、中英双语
  About 描述、README 中英双语全文对照
- 内置皮肤 17 款：基础 2 款 + 凡人修仙传 5 款 + 英雄联盟系列 10 款（神话级质感，
  含全部立绘 / 四帧精灵图 / 光标三态 / 按钮特效 / 背景装饰）
- README 内置皮肤一览（分组表格 + 主题描述）、路线图、致谢中英双语

**English**

- Open-sourced on GitHub (`daboge-beach/dsh-skin-studio`): 10 topic tags, bilingual
  About description, fully bilingual README (zh/en side by side)
- 17 built-in skins: 2 essentials + 5 Mortal's Journey + 10 League of Legends
  (mythic-tier polish with heroes, 4-frame sprites, tri-state cursors, button FX,
  background decor)
- Bilingual skin catalog (grouped tables with themes), roadmap and acknowledgments

## [0.1.0] — 2026-08-14

**简体中文**

- 首个可用版本：皮肤中心 MVP（画廊 / 试穿 / 应用 / 详情面板 / 切换特效）
- v0.2：拖拽上传、浏览器内零依赖 zip 解压、`skin.json` 格式校验

**English**

- Initial working release: Skin Studio MVP (gallery / try-on / apply / detail
  panel / transition effects)
- v0.2: drag-and-drop upload, dependency-free in-browser unzip, `skin.json`
  validation
