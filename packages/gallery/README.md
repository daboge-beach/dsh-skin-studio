# @dsh-skin-studio/gallery

DSH Skin Studio 皮肤中心 —— 浏览 / 试穿 / 应用 / 上传皮肤的 Cordis 客户端插件。

实现依据：`docs/FRONTEND_REQUIREMENTS.md`（组件结构、交互逻辑、验收标准）+
`docs/FANREN_SKINS_DESIGN.md`（5 款凡人修仙传皮肤的配色与切换特效）。

## 快速开始（demo 宿主）

```bash
cd packages/gallery
pnpm install
pnpm dev          # http://localhost:5173
```

demo（`dev/`）用 mock ClientContext 模拟 DSH 宿主：官方 `ctx.theme` 语义的
ThemeRuntime + ThemePresenter 镜像、侧边栏 shell。内置 7 款皮肤的主题定义
从 `packages/skins/*` 的 skin.json + src/index.ts 镜像注册（见
`src/client/registry/builtinSkins.ts`），因此试穿 / 应用 / 切换特效在 demo
里与真实宿主行为一致。皮肤图片资源经 vite 中间件映射
`/skins/{id}/assets/*` → `packages/skins/{id}/assets/*`，与
FANREN_SKINS_DESIGN.md 的资源路径约定一致。

## 命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | demo 宿主开发服务器 |
| `pnpm build` | 库构建 → `lib/index.js` + `lib/style.css`（vite lib mode） |
| `pnpm typecheck` | `tsc --noEmit`（strict，零报错） |
| `pnpm test` | vitest：内置清单 / 校验器 / zip 解压 / 上传全链路 |

## 结构

```
src/
├── index.ts                    # 包入口，re-export apply()
├── client/
│   ├── index.tsx               # apply(ctx)：侧边栏注册 + 全局浮层挂载 + disposer
│   ├── GalleryPanel.tsx/.css   # 界面一：画廊（搜索/Tab/网格/上传/试穿/应用）
│   ├── SkinCard.tsx/.css       # 卡片 + 吉祥物 4 帧动画（steps(1)，1.2s）
│   ├── SkinDetailModal.tsx/.css# 界面二：详情（hero 立绘/配色 swatch/Token 列表）
│   ├── UploadDropZone.tsx/.css # 网格末尾上传格（点击/拖拽 .zip）
│   ├── MascotFloat.tsx/.css    # 应用后的右下角吉祥物浮层（160×160）
│   ├── TransitionFx.tsx/.css   # 切换过渡：全屏一闪 + 5 款专属特效
│   ├── Modal.tsx/.css          # 自实现 Modal（见下方「设计决策」#1）
│   ├── Toast.tsx/.css          # 底部 toast（动作按钮 / duration 0 常驻）
│   ├── icons.tsx               # 全部 SVG 图标（无 emoji）
│   ├── hooks.ts                # useThemeSnapshot / usePrefersReducedMotion
│   ├── settings.ts             # settings.mascotEnabled（默认 true）
│   ├── themeBridge.ts          # 上传皮肤的 ThemeDefinition 代注册
│   └── registry/
│       ├── builtinSkins.ts     # 内置 7 款（skin.json + token 表镜像）
│       ├── skinRegistry.ts     # list / upload / validate / install / remove
│       ├── validate.ts         # skin.json 校验（对齐 validate-skins.mjs + 安全规则）
│       └── unzip.ts            # 零依赖 zip 解压（原生 DecompressionStream）
└── shims/dsh-runtime.d.ts      # 官方 SDK 类型 shim（仅类型，构建期擦除）
```

## 设计决策（对需求文档「待澄清问题」的处理）

1. **Modal 组件**（待澄清 #1）：为遵守「不用第三方 CSS/组件方案」约束，
   按文档调用契约 `<Modal onClose size="large">` 自实现（遮罩点击 / ESC
   关闭 / aria-modal）。接入真实 DSH 后可无缝换官方 ui-primitives 的 Modal。
2. **侧边栏注册 API**（待澄清 #2）：按 FRONTEND_REQUIREMENTS.md 给出的
   `ctx.slots.sidebar.register({ id, title, icon, panel })` 契约实现，SDK
   类型 shim 与之对齐。官方 harness 的通用 slot 系统签名更复杂
   （`ctx.slots.register({ name, children, inject }, Component)`，实际入口
   是 `sidebar.footer.action` list slot）—— 联调时写一个小适配器把本文档
   契约映射过去即可，组件代码无需改动。
3. **文件上传**（待澄清 #3）：前端 in-memory：zip 在浏览器内解压
   （`unzip.ts`，零依赖），skin.json 校验后入注册表，图片转 object URL。
   后续接 DSH 插件清单服务时替换 `registry/skinRegistry.ts` 实现即可。
4. **SkinRegistry**（待澄清 #4）：前端单例（文档明示本迭代如此）。
   「我的」tab 对应 `source: 'npm'`（暂空），「已上传」对应 `source: 'upload'`。

## 与真实 DSH 联调（已打通）

已在本机 `deepseek-harness` 检出上端到端验证：设置面板出现「皮肤中心」
分节、画廊完整渲染、应用慕沛灵后整个 DSH 界面换粉色 + 右下角吉祥物浮层、
刷新后主题保持。接线方式（详见仓库根 README 的联调记录）：

1. **包格式**：双半边插件 —— `src/index.ts`（node 半边：注册
   `/skins/{id}/assets/*` 静态路由）+ `src/client/index.ts`（浏览器半边）。
   构建直接复用 harness 的官方 `clientBundle` 预设（`tsdown.config.ts`
   相对路径引入），产出 `lib/index.js + lib/client.js`（`__ModuleLoader__`
   包装 + CSS Modules 内联）。
2. **harness 侧两处注册面**（deepseek-harness 仓库）：
   - `packages/bundle/web-app/package.json` 依赖
     `"@dsh-skin-studio/gallery": "link:../../../../dsh-skin-studio/packages/gallery"`
   - `packages/bundle/web-app/cordis.patch.yml` 浏览器 roster 增加
     `skin-studio` 行
3. **启动流程**：`pnpm install && pnpm run build`（harness）→
   `pnpm build`（gallery）→ `pnpm dsh web` → http://127.0.0.1:3080。
4. **面板入口**：官方 slot 系统 `settings.section`（`ctx.slots.inject`），
   出现在 DSH 设置对话框导航；简化契约宿主演示走 `ctx.slots.sidebar`。
5. **皮肤偏好持久化**：官方 `ThemeSettingsSchema.preference` 只接受
   light/dark/system，第三方皮肤 id 不落宿主 settings —— 皮肤中心在自身
   localStorage 命名空间记忆「应用并保存」的皮肤，浏览器半边启动时恢复
   （`immediately: true` 保证注册先于偏好恢复；对官方 scope 的启动
   adoption 做一次收敛顶回，恢复成功后不再对抗用户切换）。
6. **尚未接入的部分**：FANREN_SKINS_DESIGN 的光标三态 / 按钮特效 /
   背景装饰 CSS 属于皮肤包 `styles/` 资产，当前接入只覆盖 alias token
   配色（ctx.theme.register 的官方沙箱范围）；皮肤包自带 CSS 的加载通道
   是后续工作。

## 验收自检

见仓库根 `docs/FRONTEND_REQUIREMENTS.md` 验收标准；浏览器自检截图与逐项
结论记录在本次交付说明中（功能 15 项 + 视觉 6 项 + 代码 5 项全部通过，
prefers-reduced-motion 由 CSS media query + hook 双重保证）。
