# Release 草稿 · v0.17.0（含 v0.6.0 → v0.17.0 累积亮点）

> **发布方式**：本文件为完整草稿。因当前环境无 GitHub API 凭据，需要人工发布：
> Releases → Draft a new release → tag `v0.17.0`（已有提交后）→ 粘贴下方正文 → Publish。
> 发布后把本文件路径写进 ZCODE_REPLY 存档。

---

**Tag**: `v0.17.0` · **Baseline**: commit 本版发布提交 · **CI**: green（`pnpm verify` 同一串）

## 主要新能力（v0.6.0 → v0.17.0）

- 🎨 **皮肤工坊**：无代码编辑器——选配色/传图/实时预览/WCAG 对比度检查，一键安装本机或导出 .zip
- 📥 **真安装链路**：上传皮肤 IndexedDB 持久化（刷新不丢）、安装前能力审阅、zip bomb/路径穿越拦截、更新保留旧版 + 一键回滚
- 🛡️ **安全模式与诊断**：`?safe-theme=1` 一键救援坏界面；设置面板复制诊断快照报障
- 🔄 **五档活皮肤**：18 款内置皮肤的背景/吉祥物/光标/提示音随推理等级变化
- 🏗 **工程底座**：宿主适配层（DOM 探测集中+降级）、bundle 减重 34%、皮肤数据单一真源生成器、CI 漂移+体积双门禁、`pnpm verify` 统一验收
- 🌐 中英双语界面 · 纯本地使用统计（绝不上传）

## 安装与升级

```bash
git clone https://github.com/daboge-beach/dsh-skin-studio.git
cd dsh-skin-studio && pnpm setup      # 依赖 + 首次资产下载
pnpm install-to-dsh                   # 接入本机 DSH（幂等）
dsh web                               # 设置 → 皮肤中心
```

从旧版本升级：`git pull && pnpm install && pnpm build && pnpm install-to-dsh`。
用户数据（IndexedDB 上传皮肤 / localStorage 设置，schema `__v: 2`）保持兼容。

⚠️ **npm 提醒**：npm 上的非 scoped 包 `dsh-skin-studio` **不是本项目发布的**
（第三方，无仓库链接）。本项目尚未发布 npm，唯一受支持安装方式是上述源码路径。

## 已完成的自动化验证

- 131 项测试全绿（zip 安全 17 · 生命周期 3 · 回滚 2 · 工坊纯逻辑 10 · README 安装命令真实性 5 等）
- `pnpm verify`：lint 0 警告 → typecheck → tests → 数据漂移检查 → 38 包构建 → bundle 体积门禁（gzip ≤88KB）→ validate-skins 18/18
- CI 与本地同一串命令

## 浏览器验证限制（如实）

- 真实 DSH 已验证项（带证据）见 `docs/verification-matrix.md` B 节
- 待人工手测项见同文件 C 节（工坊端到端 / Modal 焦点陷阱 / 冷启动恢复 / 视觉冒烟）
- 覆盖环境：Windows 11 + Chromium；跨浏览器矩阵未建立

## 已知问题

- npm 分发阻塞（组织账号未注册；非 scoped 包名已被第三方占用）
- GitHub Pages 在线演示未上线（方案已备：`docs/pages-plan.md`）
- GitHub Releases 资产包仍为 v0.6.0 的 zip（PNG 资产自 v0.6.0 未变化；代码更新经 git 获取，无需新附件——如需新附件可后续补充）

## Assets 决策

本版不附构建产物：插件产物面向 DSH 宿主加载（源码安装），无可独立分发的二进制；
v0.6.0 的资产 zip 仍有效（`pnpm setup` 自动取最新含资产 Release）。
