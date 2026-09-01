<div align="center">

# 🎨 DSH Skin Studio

**不用写代码，几分钟创建、试穿、安装和分享一套 DeepSeek Harness 动态皮肤。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/daboge-beach/dsh-skin-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/daboge-beach/dsh-skin-studio/actions/workflows/ci.yml)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)

简体中文 · **[English](./README.md)**

</div>

---

![演示](docs/demo.gif)

**和普通主题包有什么区别？** 这里的皮肤是「活」的：人物背景、吉祥物、光标、提示音
会随模型推理等级变化（五档境界）；你可以用无代码工坊几分钟做一套自己的皮肤，
安全地安装社区皮肤包，任何更新都能一键回滚。

## ⚡ 快速开始（3 步）

> 前置：[Node.js ≥ 20](https://nodejs.org/)、pnpm ≥ 9、[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)。

```bash
# 1. 克隆并初始化（首次会下载皮肤资产）
git clone https://github.com/daboge-beach/dsh-skin-studio.git
cd dsh-skin-studio && pnpm setup

# 2. 接入本机 DSH（幂等，可重复执行）
pnpm install-to-dsh

# 3. 重启 DSH 打开
dsh web   # 设置 → 皮肤中心
```

试穿后界面看不清？地址栏加 `?safe-theme=1`，一键回到原生外观。

> npm 分发**尚未发布**——上面的安装路径（已纳入 CI 防失效检查）是当前唯一受支持的
> 方式。见[路线图](#-路线图)。

## ✨ 差异化能力

| | DSH Skin Studio |
|---|---|
| 🎨 **无代码皮肤工坊** | 选配色、传图片、实时预览、WCAG 对比度检查 → 一键安装本机或导出 `.zip`，不用手写 `skin.json`。 |
| 🔄 **活的皮肤** | 内置 18 款：背景、吉祥物、光标、提示音随推理等级五档变化（修仙境界 / 至臻等级）。 |
| 💾 **真正的安装** | 上传皮肤 IndexedDB 持久化（刷新不丢），更新自动保留旧版、一键回滚。 |
| 🛡️ **安全优先** | zip bomb / 路径穿越拦截、安装前能力审阅、`?safe-theme=1` 安全模式、纯本地统计绝不上传。 |
| 🌐 **双语 · 本地优先** | 中英文完整界面；全部在本机运行，不上传任何数据。 |

## 🚀 延伸

- [皮肤创作指南](./docs/skin-authoring.md)——`pnpm gen:skin` 几分钟发布你自己的皮肤
- [验证矩阵](./docs/verification-matrix.md)——自动测试 / 真实验证 / 待手测，如实分档
- [贡献指南](./docs/CONTRIBUTING.md) · [安全](./SECURITY.md) · [支持](./SUPPORT.md)
- [更新日志](./CHANGELOG.md)——16 个版本，每步都有测试门禁

## 🗺️ 路线图

- [x] v0.7–v0.16——欢迎页控制条 · 上传持久化与安全 · 皮肤工坊 · 安全模式 · 宿主适配层 · 版本回滚 · 本地统计
- [ ] npm 分发（阻塞：组织账号）· 在线皮肤索引 · 热重载开发流

## ⭐ 支持一下

如果它让你的 DSH 变得好看了，点个 Star 让更多人看到——谢谢！

## ⚖️ 免责声明 / Disclaimer

- 本项目是**独立的社区同人作品**，与 Riot Games（英雄联盟）、忘语/万维猫动画（凡人修仙传）及 DeepSeek 官方**无任何隶属或合作关系**；包名与标题中的第三方 IP 仅为内容指代
- 所有角色形象均为 AI 生成或社区重绘的**卡通演绎**，非官方素材；如权利人提出异议，对应内容包可独立下架且不影响核心项目
- 「梁神」为社区梗文化的调侃演绎，**非真实人物肖像**，避免任何贬损性或错误暗示的使用
- 原创旗舰皮肤 **Aurora / Midnight** 是项目的默认宣传素材，欢迎作为接入示例

## 📄 License

MIT © [daboge-beach](https://github.com/daboge-beach)
