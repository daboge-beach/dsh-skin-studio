# Showcase 更新帖 · v0.8 → v0.15（供粘贴到官方 Discussions #4576）

> 用法：内容为中英双语，直接复制下方正文粘贴到
> https://github.com/deepseek-ai/deepseek-harness/discussions/4576 的评论框。

---

**中文**

八个版本过去，DSH Skin Studio 从「视觉很有特点」走到了「可以放心推荐给别人安装」。这次更新的重点不是更多皮肤，而是把它变成一个**平台**：

**📥 上传中心从 Demo 变成真功能**
- 上传皮肤 **IndexedDB 持久化**：刷新不丢，真正意义的「已安装」
- zip 安全硬化：zip bomb / 路径穿越 / 超大像素图全部拦截
- 安装前能力审阅：覆盖哪些 token、用哪些图片、体积几何，确认才装
- 同 id 更新自动保留旧版，详情页**一键回滚**

**🎨 皮肤工坊（无代码编辑器）**
选配色 → 传图 → 实时预览 → WCAG 对比度检查 → 一键安装本机或导出 .zip。不会写 skin.json 的用户也能 30 秒做出一款可用皮肤。

**🛡️ 稳定性与可恢复性**
- 宿主适配层：全部 DOM 探测集中一处，上游改版只改一个文件，能力缺失自动降级
- 安全模式：界面被皮肤弄坏时 `?safe-theme=1` 一键救援
- 诊断出口：设置面板复制宿主/插件/皮肤/设置快照，报障零来回

**🧹 工程底座**
- client bundle 减重 34%（语录外置 JSON 按需加载）
- 皮肤数据单一真源：`pnpm gen:skin` 脚手架 → `gen:skin-data` 自动进画廊 → 校验器门禁 → CI 漂移/体积双门禁
- 123 个测试、中英双语界面、本地使用统计（绝不上传）

定位也更清晰了：**DSH 的可安装视觉主题平台**——Skin Runtime（加载/切换/恢复/兼容）+ Skin Studio（浏览/上传/创作/设置）+ Skin Packs（内容包，可独立下架）。

仓库：https://github.com/daboge-beach/dsh-skin-studio
欢迎试用皮肤工坊，或用 `pnpm gen:skin` 提交你的第一款皮肤。

**English**

Eight releases later, DSH Skin Studio has gone from "visually interesting" to "safe to recommend". This cycle wasn't about more skins — it's now a **platform**:

- **Uploads that truly install**: IndexedDB persistence, zip-bomb & traversal hardening, pre-install capability review, one-click rollback on updates
- **Skin Composer**: a no-code editor — pick colors, drop images, live preview, WCAG contrast check, install locally or export .zip
- **Stability**: a host-adapter layer centralizing all DOM probing with graceful degradation; `?safe-theme=1` safe mode; one-click diagnostics
- **Engineering**: 34% bundle cut, single-source skin data generators, scaffolder CLI, drift + bundle-size CI gates, 123 tests, bilingual UI, local-only usage stats

Positioning is sharper too: **an installable visual theme platform for DSH** — Skin Runtime + Skin Studio + independently removable Skin Packs.

Repo: https://github.com/daboge-beach/dsh-skin-studio — try the composer, or ship your first skin with `pnpm gen:skin`.
