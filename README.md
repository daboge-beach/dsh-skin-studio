# 🎨 DSH Skin Studio

**[简体中文](#-dsh-skin-studio--中文) | [English](#-dsh-skin-studio--english)**

---

## 🎨 DSH Skin Studio · 中文

> DeepSeek Harness 皮肤工作室 —— 内置精选皮肤 · 用户上传皮肤中心 · 让每个 agent 都有专属面孔。
>
> 主题覆盖：**英雄联盟（LOL / League of Legends）英雄皮肤** ×10 · **凡人修仙传（A Record of a Mortal's Journey to Immortality，国漫修仙）** ×5 · **DeepSeek 梗文化（梁神）** ×1 · 极简基础 ×2 —— 支持随推理等级切换的**修仙境界 / 皮肤等级**分档形态（人物背景 · 吉祥物 · 光标 · 提示音）。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek-Harness-orange)](https://github.com/deepseek-ai/deepseek-harness)
[![Skins: 18](https://img.shields.io/badge/skins-18-ff69b4)](#-内置皮肤一览)
[![Status: Preview](https://img.shields.io/badge/status-preview-red)](#项目状态)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

> ⚠️ **DSH 本身处于 v0.1 开发者预览阶段**，插件 API 尚不稳定。本项目跟随上游版本演进，暂不保证跨版本兼容。

### 📖 这个项目是什么

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）把"万物皆插件"做到了极致——模型、工具、会话、**连 UI 都是可替换的插件**。皮肤（Skin）就是一种 UI 插件，通过 `skin.json` + `lib/client.js` 定义，由 `ThemePresenter` 接口实现"先试穿再应用、退出零残留"。

`dsh-web-ui` 已经给出了 8 款作者精选皮肤，证明这条路走得通。**我们想再往前走一步：**

> **让用户自己造皮肤、自己上传皮肤，做一个开放的皮肤中心（Skin Gallery）。**

不是"作者精选 N 款"，而是"任何人都能贡献、任何人都能装"的 marketplace 形态。

### ✨ 核心特性

| 特性 | 说明 |
|---|---|
| 🎨 **内置精选皮肤** | 随包附带若干高质量开箱皮肤，装完即用 |
| 📥 **用户上传皮肤** | 拖拽 `skin.json` + 资源到皮肤中心即可加载，无需重新构建 |
| 🖼️ **可视化画廊** | 全屏预览、亮/暗变体切换、试穿→确认两段式交互 |
| 🔌 **官方格式兼容** | `skin.json` 字段与 `dsh-web-ui` 对齐，已有皮肤可直接迁移 |
| 🧩 **插件联动** | 皮肤可消费其他 DSH 插件的数据（行情、宠物、token 统计等） |
| 🛠️ **皮肤开发工具** | 提供 `dsh-skin init` 脚手架 + 类型定义 + 校验器，降低造皮肤门槛 |

### 🎨 内置皮肤一览（18 款）

**英雄联盟系列 · 10 款（神话级质感）**

| 皮肤 | 主题 |
|---|---|
| 阿狸 · 九尾魅影 | 粉紫幻境 · 魅惑灵动 |
| 伊泽瑞尔 · 符文远征 | 金蓝符文 · 探险家气质 |
| 金克斯 · 弹幕狂潮 | 疯狂霓虹 · 鲨鱼火箭 |
| 卡莎 · 虚空降临 | 深紫虚空 · 活体装甲 |
| 拉克丝 · 光棱圣辉 | 圣洁光晕 · 彩虹光谱 |
| 厄运小姐 · 赏金女王 | 红金赏金 · 弹雨玫瑰 |
| 萨勒芬妮 · 星颂 | 星空舞台 · 双色应援 |
| 娑娜 · 弦语仙音 | 琴音流淌 · 静谧雅致 |
| 维恩 · 夜狩 | 冷银夜色 · 银弩猎手 |
| 亚索 · 斩风疾影 | 青风竹意 · 疾剑浪客 |

**凡人修仙传系列 · 5 款**

| 皮肤 | 主题 |
|---|---|
| 韩立 · 青竹 | 青衫修士 · 竹林问心 |
| 南宫婉 · 寒梅 | 冰雪聪明 · 寒梅傲骨 |
| 银月 · 月华 | 狼族圣女 · 月华如水 |
| 紫灵 · 紫霞 | 紫气东来 · 仙子凌波 |
| 慕沛灵 · 桃夭 | 桃之夭夭 · 灼灼其华 |

**基础系列 · 2 款**

| 皮肤 | 主题 |
|---|---|
| Aurora | 极简亮色 · 清晨极光 |
| Midnight | 极简暗色 · 深夜静谧 |

**梗文化系列 · 1 款**

| 皮肤 | 主题 |
|---|---|
| 梁神 · 深度求道 | 凉子（冻得发抖）→ 梁子 → 梁圣 → 梁神（始皇帝形态），推理等级越高 boss 修为越高 · 卡通 caricature 非真人肖像 |

### 🚀 快速开始

#### 前置要求

- Node.js ≥ 20
- DeepSeek Harness 已安装（`npx @deepseek-ai/dsh web` 可正常启动）

#### 安装

```bash
# 装皮肤聚合包到 web profile
dsh plugin --profile web add @dsh-skin-studio/gallery

# 或装全家桶（皮肤 + 皮肤中心 + 开发工具）
dsh plugin --profile web add @dsh-skin-studio/studio
```

#### 验证

```bash
dsh --profile web --dump-config   # 确认插件已挂载
```

打开 http://127.0.0.1:3080，侧栏会出现 **Skin Studio** 入口。

#### 试穿皮肤

1. 点击侧栏 **Skin Studio**
2. 画廊里点击任意皮肤 → 全屏预览
3. 点 **试穿** → 即时生效，不满意随时退出
4. 满意后点 **应用** → 正式启用

#### 上传自定义皮肤

- **方式一（本地目录）**：把皮肤文件夹放到 `~/.dsh/skins/<your-skin>/`，刷新画廊即可看到
- **方式二（拖拽上传）**：在画廊界面拖入 `.zip` 皮肤包，自动解压校验
- **方式三（npm 包）**：`dsh plugin --profile web add <你的皮肤包名>`

### 🧱 皮肤包格式

每个皮肤是一个目录，结构如下（兼容官方 `dsh-web-ui` 规范）：

```
my-skin/
├── skin.json          # 皮肤清单（必填）
├── preview.png        # 画廊预览图（必填，建议 1280×800）
├── README.md          # 皮肤介绍（可选）
└── lib/
    └── client.js      # 客户端 bundle（必填，含 ThemePresenter 实现）
```

#### `skin.json` 字段规范

```jsonc
{
  "id": "my-skin",                    // 皮肤唯一 ID（kebab-case）
  "name": "我的皮肤",                  // 显示名
  "version": "1.0.0",                  // 语义化版本
  "author": "你的名字 <email@example.com>",
  "description": "一句话描述这个皮肤",
  "homepage": "https://github.com/...", // 可选
  "license": "MIT",

  // 视觉变体（至少一个，支持 light/dark）
  "variants": ["light", "dark"],

  // 客户端入口（相对于皮肤根目录）
  "client": "lib/client.js",

  // 皮肤能力声明（皮肤能做什么）
  "capabilities": {
    "customTitleBar": true,           // 自定义标题栏
    "customBackground": true,         // 自定义背景
    "customScrollbars": true,         // 自定义滚动条
    "consumePlugins": ["dsh-fun-ticker"]  // 消费其他插件的数据
  },

  // 调色板（可选，给皮肤中心做配色预览）
  "palette": {
    "primary": "#3b82f6",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f1f5f9"
  }
}
```

> 完整字段定义和 `ThemePresenter` 接口签名见 [docs/SKIN_SPEC.md](docs/SKIN_SPEC.md)。

### 🛠️ 开发自己的皮肤

```bash
# 用脚手架创建皮肤模板
npx @dsh-skin-studio/create my-skin

cd my-skin
pnpm install
pnpm dev    # 启动开发服务器，热重载预览
pnpm build  # 构建 lib/client.js
```

开发文档见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

### 📦 项目结构

```
dsh-skin-studio/
├── packages/
│   ├── gallery/              # 皮肤中心 UI（画廊、试穿、上传）
│   ├── studio/               # 聚合包（gallery + 内置皮肤 + 工具）
│   ├── create/               # 皮肤脚手架 CLI
│   └── skins/                # 内置皮肤源码
│       ├── aurora/           # 极光（极简亮色）
│       ├── midnight/         # 午夜（极简暗色）
│       ├── ahri-ninefold/    # 英雄联盟系列 × 10
│       └── ...               # 凡人修仙传系列 × 5
├── docs/
│   ├── SKIN_SPEC.md          # 皮肤规范（权威）
│   ├── DEVELOPMENT.md        # 开发指南
│   ├── CONTRIBUTING.md       # 贡献指南
│   └── uploads/              # 用户上传皮肤的格式约定
├── examples/                 # 最小示例皮肤
├── scripts/                  # 构建与发布脚本
└── website/                  # 文档站
```

### 🤝 贡献皮肤

任何人都可以贡献皮肤到内置画廊。流程：

1. Fork 本仓库
2. 用 `npx @dsh-skin-studio/create` 创建皮肤
3. 把皮肤源码放到 `packages/skins/<你的皮肤名>/`
4. 提交 PR，附上预览截图
5. 通过评审后合入下一版发布

详见 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。

### 🗺️ 路线图

- [x] 仓库初始化、规范定稿
- [x] v0.1：皮肤中心 MVP（`packages/gallery`：画廊 / 试穿 / 应用 / 详情面板 / 吉祥物浮层 / 切换特效，内置 aurora + midnight + 凡人修仙传 5 款）
- [x] v0.2：拖拽上传、zip 解压、格式校验（浏览器内零依赖解压 + `skin.json` 校验）
- [x] v0.2.x：英雄联盟英雄皮肤系列 10 款（神话级质感）
- [x] v0.3.0：吉祥物生态（满屏漫步 · 庆祝动作）+ 任务完成提醒 + 境界档位系统（推理等级联动）+ 梗文化皮肤「梁神」（详见 CHANGELOG.md）
- [ ] v0.4：皮肤脚手架 CLI、开发热重载
- [ ] v0.5：插件联动（消费行情/token 统计等数据）
- [ ] v1.0：跟随 DSH v1.0 稳定 API，正式发布

### 📄 License

MIT — 跟随 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 上游协议。

### 🙏 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — 感谢 DeepSeek 团队提供"万物皆插件"的运行时框架，本项目得以在其之上构建皮肤生态
- [dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) — 皮肤格式和 ThemePresenter 抽象的开拓者，本项目借鉴了大量设计
- 所有贡献皮肤的用户

> 🎨 凡人修仙传系列皮肤为 AI 生成的同人创作，基于《凡人修仙传》（作者：忘语）角色形象，仅供个人欣赏与学习交流。

---

## 🎨 DSH Skin Studio · English

> The skin studio for DeepSeek Harness — curated built-in skins · a community skin gallery · give every agent its own face.
>
> Themes: **League of Legends (LOL) champion skins** ×10 · **A Record of a Mortal's Journey to Immortality (凡人修仙传, Chinese xiuxian novel / donghua)** ×5 · **DeepSeek meme (Liang Shen)** ×1 · minimal essentials ×2 — with **cultivation-stage / skin-tier** forms that follow the reasoning-effort level (character backgrounds · mascot · cursors · chimes).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek-Harness-orange)](https://github.com/deepseek-ai/deepseek-harness)
[![Skins: 18](https://img.shields.io/badge/skins-18-ff69b4)](#-built-in-skins)
[![Status: Preview](https://img.shields.io/badge/status-preview-red)](#project-status)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

> ⚠️ **DSH itself is at the v0.1 developer-preview stage** and its plugin API is still unstable. This project tracks upstream releases; cross-version compatibility is not guaranteed yet.

### 📖 What is this project

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) takes "everything is a plugin" to the extreme — models, tools, sessions, and **even the UI are replaceable plugins**. A Skin is a kind of UI plugin, defined by `skin.json` + `lib/client.js`, implementing try-before-apply with zero residue on exit via the `ThemePresenter` interface.

`dsh-web-ui` already ships 8 hand-picked skins by its author, proving the road works. **We want to go one step further:**

> **Let users build their own skins and upload them — an open Skin Gallery.**

Not "N curated picks by the author", but a marketplace where anyone can contribute and anyone can install.

### ✨ Key Features

| Feature | Description |
|---|---|
| 🎨 **Curated built-in skins** | Ships with several high-quality skins, ready out of the box |
| 📥 **User-uploaded skins** | Drag & drop `skin.json` + assets into the gallery — no rebuild required |
| 🖼️ **Visual gallery** | Full-screen preview, light/dark variant toggle, try → confirm two-step flow |
| 🔌 **Official format compatible** | `skin.json` fields align with `dsh-web-ui`; existing skins migrate as-is |
| 🧩 **Plugin interop** | Skins can consume data from other DSH plugins (tickers, pets, token stats, …) |
| 🛠️ **Skin dev tooling** | `dsh-skin init` scaffolder + type definitions + validator to lower the barrier |

### 🎨 Built-in skins (18)

**League of Legends series · 10 skins (mythic-tier polish)**

| Skin | Theme |
|---|---|
| Ahri · Nine-Tail Charms | Pink-violet fantasy · enchanting agility |
| Ezreal · Rune Expedition | Golden-blue runes · explorer spirit |
| Jinx · Bullet Mayhem | Neon chaos · shark rockets |
| Kai'Sa · Voidborn Descent | Deep-void purple · living armor |
| Lux · Radiant Prism | Holy radiance · rainbow spectrum |
| Miss Fortune · Bounty Queen | Red-gold bounty · bullet-rose |
| Seraphine · Star Anthem | Starry stage · duo-tone cheer |
| Sona · Etwahl Muse | Flowing strings · serene elegance |
| Vayne · Night Hunter | Cold-silver night · silverbolt huntress |
| Yasuo · Gale Slasher | Green wind & bamboo · wandering swordsman |

**A Record of a Mortal's Journey series · 5 skins**

| Skin | Theme |
|---|---|
| Han Li · Green Bamboo | Azure-robed cultivator · bamboo grove |
| Nangong Wan · Winter Plum | Ice-smart grace · plum in the snow |
| Yin Yue · Moonlight | Wolf-tribe maiden · moonlit waters |
| Ziling · Violet Mist | Purple aura · immortal fairy |
| Mu Peiling · Peach Blossom | Peach blossoms in full bloom |

**Essentials · 2 skins**

| Skin | Theme |
|---|---|
| Aurora | Minimal light · dawn aurora |
| Midnight | Minimal dark · deep-night calm |

**Meme series · 1 skin**

| Skin | Theme |
|---|---|
| Liang Shen · Deep Quest | Chilly → Liang-zi → Saint → Emperor (Qin Shi Huang form); higher reasoning effort, higher boss cultivation · cartoon caricature, not a real person |

### 🚀 Quick Start

#### Prerequisites

- Node.js ≥ 20
- DeepSeek Harness installed (`npx @deepseek-ai/dsh web` runs successfully)

#### Installation

```bash
# Add the skin gallery package to the web profile
dsh plugin --profile web add @dsh-skin-studio/gallery

# Or the full bundle (skins + gallery + dev tools)
dsh plugin --profile web add @dsh-skin-studio/studio
```

#### Verify

```bash
dsh --profile web --dump-config   # confirm the plugin is mounted
```

Open http://127.0.0.1:3080 — a **Skin Studio** entry appears in the sidebar.

#### Try a skin

1. Click **Skin Studio** in the sidebar
2. Click any skin in the gallery → full-screen preview
3. Click **Try on** → applies instantly, revert anytime
4. Happy with it? Click **Apply** to make it official

#### Upload a custom skin

- **Option 1 (local folder)**: put the skin folder under `~/.dsh/skins/<your-skin>/` and refresh the gallery
- **Option 2 (drag & drop)**: drop a `.zip` skin package onto the gallery; it is unzipped and validated automatically
- **Option 3 (npm package)**: `dsh plugin --profile web add <your-skin-package>`

### 🧱 Skin package format

Each skin is a directory structured as follows (compatible with the official `dsh-web-ui` spec):

```
my-skin/
├── skin.json          # skin manifest (required)
├── preview.png        # gallery preview (required, 1280×800 recommended)
├── README.md          # skin introduction (optional)
└── lib/
    └── client.js      # client bundle (required, contains the ThemePresenter)
```

#### `skin.json` field spec

```jsonc
{
  "id": "my-skin",                    // unique skin ID (kebab-case)
  "name": "My Skin",                  // display name
  "version": "1.0.0",                 // semver
  "author": "You <email@example.com>",
  "description": "One line about this skin",
  "homepage": "https://github.com/...", // optional
  "license": "MIT",

  // visual variants (at least one; supports light/dark)
  "variants": ["light", "dark"],

  // client entry (relative to the skin root)
  "client": "lib/client.js",

  // capability declarations (what the skin can do)
  "capabilities": {
    "customTitleBar": true,           // custom title bar
    "customBackground": true,         // custom background
    "customScrollbars": true,         // custom scrollbars
    "consumePlugins": ["dsh-fun-ticker"]  // consume data from other plugins
  },

  // palette (optional, used for gallery color previews)
  "palette": {
    "primary": "#3b82f6",
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f1f5f9"
  }
}
```

> See [docs/SKIN_SPEC.md](docs/SKIN_SPEC.md) for the full field definitions and the `ThemePresenter` interface signature.

### 🛠️ Develop your own skin

```bash
# Scaffold a skin template
npx @dsh-skin-studio/create my-skin

cd my-skin
pnpm install
pnpm dev    # dev server with hot-reload preview
pnpm build  # build lib/client.js
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the development guide.

### 📦 Project layout

```
dsh-skin-studio/
├── packages/
│   ├── gallery/              # skin gallery UI (browse, try-on, upload)
│   ├── studio/               # aggregate package (gallery + built-ins + tools)
│   ├── create/               # skin scaffolder CLI
│   └── skins/                # built-in skin sources
│       ├── aurora/           # Aurora (minimal light)
│       ├── midnight/         # Midnight (minimal dark)
│       ├── ahri-ninefold/    # League of Legends series × 10
│       └── ...               # Mortal's Journey series × 5
├── docs/
│   ├── SKIN_SPEC.md          # skin spec (authoritative)
│   ├── DEVELOPMENT.md        # development guide
│   ├── CONTRIBUTING.md       # contribution guide
│   └── uploads/              # format conventions for user-uploaded skins
├── examples/                 # minimal example skin
├── scripts/                  # build & release scripts
└── website/                  # docs site
```

### 🤝 Contribute a skin

Anyone can contribute a skin to the built-in gallery. The flow:

1. Fork this repository
2. Create a skin with `npx @dsh-skin-studio/create`
3. Put the skin source under `packages/skins/<your-skin-name>/`
4. Open a PR with preview screenshots
5. Once reviewed, it ships in the next release

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

### 🗺️ Roadmap

- [x] Repository bootstrap, spec finalized
- [x] v0.1: gallery MVP (`packages/gallery`: browse / try-on / apply / detail panel / mascot overlay / transition effects; ships aurora + midnight + 5 A Record of a Mortal's Journey skins)
- [x] v0.2: drag & drop upload, zip extraction, format validation (dependency-free in-browser unzip + `skin.json` validation)
- [x] v0.2.x: League of Legends champion skin series × 10 (mythic-tier polish)
- [x] v0.3.0: mascot ecosystem (full-screen wandering, celebrations) + task-done alerts + power tier system (reasoning-effort linked) + the "Liang Shen" meme skin (see CHANGELOG.md)
- [ ] v0.4: skin scaffolder CLI, hot-reload dev flow
- [ ] v0.5: plugin interop (consume ticker / token stats, etc.)
- [ ] v1.0: follow DSH v1.0 stable API, official release

### 📄 License

MIT — follows the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) upstream license.

### 🙏 Acknowledgments

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — thanks to the DeepSeek team for the "everything is a plugin" runtime this skin ecosystem is built upon
- [dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) — pioneer of the skin format and the ThemePresenter abstraction; this project borrows heavily from its design
- Everyone who contributes skins

> 🎨 The *A Record of a Mortal's Journey* skins are AI-generated fan art based on characters from the novel by Wang Yu (忘语), for personal enjoyment and learning only.

---

<p align="center">Made with 🎨 for the DeepSeek Harness community</p>
