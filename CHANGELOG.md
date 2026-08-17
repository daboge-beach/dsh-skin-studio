# 更新日志 · Changelog

本文件记录面向用户的显著变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

This file documents user-facing changes. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/).

---

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
