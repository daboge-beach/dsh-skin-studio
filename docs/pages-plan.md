# GitHub Pages 部署评估 · Pages Deployment Plan

> 结论先行：**当前不适合直接部署**。皮肤中心插件运行依赖 DSH 宿主运行时
> （主题服务 / slot 系统 / `/skins/*` 资产路由），静态 Pages 无法提供。
> 为不部署一个打不开的页面，本页列出阻碍与最小改造方案。

评估日期：2026-08-29（v0.17.0 获客迭代）

## 为什么现在不行

| 阻碍 | 说明 |
|---|---|
| 宿主运行时 | `client/index.ts` 注入 `theme` / `slots` 服务；Pages 上没有 DSH，插件入口无法启动 |
| 资产路由 | 预览图 / 语录 JSON 走 `/skins/{id}/assets/*`（DSH webServer 提供）；静态站需把这批文件按原路径摆进 Pages 目录 |
| 构建目标 | `packages/gallery` 的产物是插件 client bundle（`__ModuleLoader__` 包装的 CJS），不是独立网页；`dev/` 演示宿主只有 `vite dev`，无 `vite build` 配置 |

## 最小改造方案（约 1-2 天工作量，可做）

`dev/` 里已有完整的 **mockHost**（本地模拟官方 ThemeRuntime + slots），静态演示完全可行：

1. `packages/gallery` 加 `build:demo` 脚本：`vite build`（新增 `dev/vite.config.ts`
   的 build 段，`base: '/dsh-skin-studio/'` 适配项目页路径）
2. 把 `packages/skins/*/assets/` 复制进产物 `skins/{id}/assets/`（保持 URL 不变）
3. mockHost 的设置持久化改用 localStorage 兜底（已是）——无后端依赖 ✅
4. `.github/workflows/pages.yml`：push main → build:demo → 上传 artifact → deploy-pages
5. SPA 刷新问题：单页演示无前端路由，无需 fallback 配置 ✅
6. README「在线体验」替换为 Pages URL（当前先指向本地 Quick Start，不放空链接）

## 验证清单（上线前必须全过）

- [ ] Pages URL 冷加载 < 3s（首屏不拉全部 18 款资产，懒加载预览图）
- [ ] 画廊 / 设置抽屉 / 皮肤工坊三界面可交互（mockHost 路径）
- [ ] 资产 URL 404 = 0（ skins 路径逐张检查）
- [ ] 移动端 375px 宽不破版
