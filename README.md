# 🎨 DSH Skin Studio

> DeepSeek Harness 皮肤工作室 —— 内置精选皮肤 · 用户上传皮肤中心 · 让每个 agent 都有专属面孔。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek-Harness-orange)](https://github.com/deepseek-ai/deepseek-harness)
[![Status: Preview](https://img.shields.io/badge/status-preview-red)](#项目状态)

> ⚠️ **DSH 本身处于 v0.1 开发者预览阶段**，插件 API 尚不稳定。本项目跟随上游版本演进，暂不保证跨版本兼容。

---

## 📖 这个项目是什么

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）把"万物皆插件"做到了极致——模型、工具、会话、**连 UI 都是可替换的插件**。皮肤（Skin）就是一种 UI 插件，通过 `skin.json` + `lib/client.js` 定义，由 `ThemePresenter` 接口实现"先试穿再应用、退出零残留"。

`dsh-web-ui` 已经给出了 8 款作者精选皮肤，证明这条路走得通。**我们想再往前走一步：**

> **让用户自己造皮肤、自己上传皮肤，做一个开放的皮肤中心（Skin Gallery）。**

不是"作者精选 N 款"，而是"任何人都能贡献、任何人都能装"的 marketplace 形态。

## ✨ 核心特性

| 特性 | 说明 |
|---|---|
| 🎨 **内置精选皮肤** | 随包附带若干高质量开箱皮肤，装完即用 |
| 📥 **用户上传皮肤** | 拖拽 `skin.json` + 资源到皮肤中心即可加载，无需重新构建 |
| 🖼️ **可视化画廊** | 全屏预览、亮/暗变体切换、试穿→确认两段式交互 |
| 🔌 **官方格式兼容** | `skin.json` 字段与 `dsh-web-ui` 对齐，已有皮肤可直接迁移 |
| 🧩 **插件联动** | 皮肤可消费其他 DSH 插件的数据（行情、宠物、token 统计等） |
| 🛠️ **皮肤开发工具** | 提供 `dsh-skin init` 脚手架 + 类型定义 + 校验器，降低造皮肤门槛 |

## 🚀 快速开始

### 前置要求

- Node.js ≥ 20
- DeepSeek Harness 已安装（`npx @deepseek-ai/dsh web` 可正常启动）

### 安装

```bash
# 装皮肤聚合包到 web profile
dsh plugin --profile web add @dsh-skin-studio/gallery

# 或装全家桶（皮肤 + 皮肤中心 + 开发工具）
dsh plugin --profile web add @dsh-skin-studio/studio
```

### 验证

```bash
dsh --profile web --dump-config   # 确认插件已挂载
```

打开 http://127.0.0.1:3080，侧栏会出现 **Skin Studio** 入口。

### 试穿皮肤

1. 点击侧栏 **Skin Studio**
2. 画廊里点击任意皮肤 → 全屏预览
3. 点 **试穿** → 即时生效，不满意随时退出
4. 满意后点 **应用** → 正式启用

### 上传自定义皮肤

- **方式一（本地目录）**：把皮肤文件夹放到 `~/.dsh/skins/<your-skin>/`，刷新画廊即可看到
- **方式二（拖拽上传）**：在画廊界面拖入 `.zip` 皮肤包，自动解压校验
- **方式三（npm 包）**：`dsh plugin --profile web add <你的皮肤包名>`

## 🧱 皮肤包格式

每个皮肤是一个目录，结构如下（兼容官方 `dsh-web-ui` 规范）：

```
my-skin/
├── skin.json          # 皮肤清单（必填）
├── preview.png        # 画廊预览图（必填，建议 1280×800）
├── README.md          # 皮肤介绍（可选）
└── lib/
    └── client.js      # 客户端 bundle（必填，含 ThemePresenter 实现）
```

### `skin.json` 字段规范

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

## 🛠️ 开发自己的皮肤

```bash
# 用脚手架创建皮肤模板
npx @dsh-skin-studio/create my-skin

cd my-skin
pnpm install
pnpm dev    # 启动开发服务器，热重载预览
pnpm build  # 构建 lib/client.js
```

开发文档见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

## 📦 项目结构

```
dsh-skin-studio/
├── packages/
│   ├── gallery/              # 皮肤中心 UI（画廊、试穿、上传）
│   ├── studio/               # 聚合包（gallery + 内置皮肤 + 工具）
│   ├── create/               # 皮肤脚手架 CLI
│   └── skins/                # 内置皮肤源码
│       ├── aurora/           # 极光（极简亮色）
│       ├── midnight/         # 午夜（极简暗色）
│       └── ...               # 更多内置皮肤
├── docs/
│   ├── SKIN_SPEC.md          # 皮肤规范（权威）
│   ├── DEVELOPMENT.md        # 开发指南
│   ├── CONTRIBUTING.md       # 贡献指南
│   └── uploads/              # 用户上传皮肤的格式约定
├── examples/                 # 最小示例皮肤
├── scripts/                  # 构建与发布脚本
└── website/                  # 文档站
```

## 🤝 贡献皮肤

任何人都可以贡献皮肤到内置画廊。流程：

1. Fork 本仓库
2. 用 `npx @dsh-skin-studio/create` 创建皮肤
3. 把皮肤源码放到 `packages/skins/<你的皮肤名>/`
4. 提交 PR，附上预览截图
5. 通过评审后合入下一版发布

详见 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。

## 🗺️ 路线图

- [x] 仓库初始化、规范定稿
- [x] v0.1：皮肤中心 MVP（`packages/gallery`：画廊 / 试穿 / 应用 / 详情面板 / 吉祥物浮层 / 切换特效，内置 aurora + midnight + 凡人修仙传 5 款）
- [x] v0.2：拖拽上传、zip 解压、格式校验（浏览器内零依赖解压 + `skin.json` 校验）
- [ ] v0.3：皮肤脚手架 CLI、开发热重载
- [ ] v0.4：插件联动（消费行情/token 统计等数据）
- [ ] v1.0：跟随 DSH v1.0 稳定 API，正式发布

## 📄 License

MIT — 跟随 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 上游协议。

## 🙏 致谢

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — 提供了"万物皆插件"的运行时
- [dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) — 皮肤格式和 ThemePresenter 抽象的开拓者，本项目借鉴了大量设计
- 所有贡献皮肤的用户

---

<p align="center">Made with 🎨 for the DeepSeek Harness community</p>
