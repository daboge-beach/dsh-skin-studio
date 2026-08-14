# 皮肤规范 (Skin Specification)

> 本文档是 DSH Skin Studio 皮肤格式的**权威定义**，基于 DeepSeek Harness v0.1.0-rc.5 的官方主题系统（`@deepseek-ai/dsh-client-ui-theme` + `dsh-client-ui-layout`）抽象。
>
> **重要**：DSH 仍处于开发者预览阶段，主题 API 可能跨版本变更。本规范跟随上游演进。

---

## 1. 主题系统的官方架构

DSH 的主题系统分为三层（详见架构图）：

| 层 | 包 | 职责 |
|---|---|---|
| **Layer 1 · Base Palette** | `@deepseek-ai/dsh-client-ui-theme/styles/design-platform.css` | ~150 个 `--dsw-static-*` 基础色 token，亮/暗双套，**不可被插件修改** |
| **Layer 2 · ThemeRuntime** | `@deepseek-ai/dsh-client-ui-theme/client` | 维护主题注册表、偏好持久化、`prefers-color-scheme` 监听、发布 `ThemeSnapshot` |
| **Layer 3 · ThemePresenter** | `@deepseek-ai/dsh-client-ui-layout/client` | 订阅 `theme/change` 事件，把 snapshot 投射到 DOM（`color-scheme`、`body[data-ds-dark-theme]`、`body.style` 上的 `--dsw-alias-*` 变量） |

**皮肤插件接入点在 Layer 2**：通过 `ctx.theme.register()` 注册一个主题，或用 `ctx.theme.overrideTokens()` 叠加 token 覆盖层。皮肤**不需要**直接操作 DOM —— 这是官方和 `dsh-web-ui` 第三方实现的关键差异。

## 2. 皮肤的本质

皮肤是一个 **Cordis 插件**，在 `apply(ctx)` 中调用 `ctx.theme.register()` 注册一个 `ThemeDefinition`，定义 alias token 覆盖。用户切换主题时，`ThemeRuntime` 通过 `theme/change` 事件广播 snapshot，`ThemePresenter` 自动把 token 投射到 DOM。

```typescript
// 最小皮肤插件
import type { Context } from '@deepseek-ai/cordis'

export function apply(ctx: Context) {
  // 依赖注入：声明需要 ui-theme 服务
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'my-skin',
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base': '#0f172a',
        '--dsw-alias-brand-primary': '#60a5fa',
        // ...更多 alias token
      }
    })

    // 卸载时反注册（热插拔安全）
    themeCtx.on('dispose', dispose)
  })
}
```

## 3. 核心 API

### 3.1 `ThemeDefinition`（皮肤的核心数据结构）

```typescript
interface ThemeDefinition {
  /** 主题唯一 ID（不可为 'system'、'light'、'dark'，这三个被内置占用） */
  id: string
  /** 这个主题建立在哪个基础调色板上 */
  colorScheme: 'light' | 'dark'
  /** alias token 覆盖（key 是 --dsw-alias-*，value 是 CSS 值） */
  tokens: Record<string, string>
}
```

### 3.2 `ctx.theme.register(definition)`

注册一个主题。重复 ID 抛错。返回 disposer —— 调用即反注册。

### 3.3 `ctx.theme.overrideTokens(source, tokens)`

叠加 token 覆盖层（不新建主题，只改当前主题的某些 token）。

```typescript
ctx.theme.overrideTokens('my-plugin', {
  '--dsw-alias-brand-primary': {
    light: '#3b82f6',
    dark:  '#60a5fa'
  }
})
```

`source` 是层身份（动态插件传自己的包 ID），后注册的层覆盖先注册的。返回 disposer。

### 3.4 `ctx.theme.setTheme(id)`

切换当前主题。ID 必须已注册，或为 `'system'`。

### 3.5 `theme/change` 事件

```typescript
ctx.on('theme/change', (snapshot: ThemeSnapshot) => {
  // snapshot.active 是当前生效的 ThemeDefinition（已 fold 所有 override 层）
  // snapshot.preference 是用户偏好（可能是 'system'）
})
```

## 4. 可覆盖的 Alias Token

DSH 把 token 分两层：
- **static token**（`--dsw-static-*`）：原始色值，如 `--dsw-static-blue-500: rgb(59, 130, 246)`，~150 个，**不可修改**
- **alias token**（`--dsw-alias-*`）：语义化的"角色色"，指向 static token，**皮肤可覆盖**

### 4.1 内置可覆盖的 alias token

| Token | 语义 |
|---|---|
| `--dsw-alias-bg-base` | 应用基础背景 |
| `--dsw-alias-bg-layer-1` | 一级浮起表面（卡片、面板） |
| `--dsw-alias-bg-layer-2` | 二级嵌套表面 |
| `--dsw-alias-bg-overlay` | 覆盖层、popover |
| `--dsw-alias-border-l1` | 一级细边框 |
| `--dsw-alias-border-l2` | 二级强边框 |
| `--dsw-alias-brand-primary` | 品牌主色 |
| `--dsw-alias-label-primary` | 主文字色 |
| `--dsw-alias-label-secondary` | 次要文字色 |
| `--dsw-alias-state-error-primary` | 错误态主色 |
| `--dsw-alias-state-success-primary` | 成功态主色 |
| `--dsw-alias-state-warn-primary` | 警告态主色 |
| `--dsw-specific-sidebar-fill` | 侧边栏填充色 |

> 完整列表可通过 `ctx.theme.exportInspectTokens()` 在运行时获取，包括其他插件动态注册的 token。

### 4.2 覆盖规则

- 皮肤只需覆盖想改的 token，未覆盖的自动继承 base palette
- `colorScheme: 'dark'` 的皮肤，其 token 值应当是暗色配色（base palette 会切到暗色档）
- token 值可以是：直接色值（`#0f172a`、`rgb(15,23,42)`）、引用其他 static token（`var(--dsw-static-blue-400)`）、CSS 函数（`color-mix(in srgb, var(--dsw-alias-bg-base) 80%, black)`）

## 5. `skin.json` 清单（皮肤包元数据）

虽然 DSH 原生插件通过 `package.json` 的 `dsh` 字段注册，但我们额外引入 `skin.json` 用于**皮肤中心画廊**的元数据（预览图、作者、关键词等运行时无关信息）。

```jsonc
{
  "id": "aurora",                        // 必须与 ThemeDefinition.id 一致
  "name": "Aurora",                      // 显示名
  "version": "0.1.0",                    // SemVer
  "author": "你的名字",
  "description": "极简亮色皮肤",
  "license": "MIT",

  "colorScheme": "light",                // 必须与 ThemeDefinition.colorScheme 一致
  "preview": "preview.png",              // 画廊预览图（1280×800）
  "keywords": ["minimal", "light"],

  // 皮肤的视觉摘要（画廊用这个生成配色预览，不参与运行时）
  "palette": {
    "primary": "#3b82f6",
    "background": "#f8fafc",
    "text": "#0f172a"
  }
}
```

## 6. 皮肤包目录结构

```
my-skin/
├── package.json          # Cordis 插件包（dsh 字段声明插件元数据）
├── skin.json             # 皮肤中心元数据（非运行时必需）
├── preview.png           # 画廊预览图
├── src/
│   └── index.ts          # 插件入口，apply(ctx) 中调用 ctx.theme.register()
├── lib/
│   └── index.js          # 构建产物（DSH 加载这个）
└── README.md
```

### `package.json` 关键字段

```jsonc
{
  "name": "@dsh-skin-studio/skin-my-skin",
  "version": "0.1.0",
  "type": "module",
  "main": "./lib/index.js",
  "dsh": {
    "client": {
      "inject": ["@deepseek-ai/dsh-client-ui-theme"]
    }
  }
}
```

`dsh.client.inject` 声明了对 `ui-theme` 服务的依赖 —— DSH 启动时会保证 `ctx.theme` 可用后再激活本插件。

## 7. 高级能力

### 7.1 同时覆盖亮/暗（不改主题，只叠加层）

如果你的插件想根据当前 colorScheme 微调某些 token：

```typescript
ctx.theme.overrideTokens('my-plugin', {
  '--dsw-alias-brand-primary': {
    light: '#3b82f6',  // 亮色时用这个
    dark:  '#60a5fa'   // 暗色时用这个
  }
})
```

### 7.2 监听主题变化做联动

```typescript
ctx.on('theme/change', (snapshot) => {
  if (snapshot.active.id === 'my-skin') {
    // 用户切到了我的皮肤，做点联动（比如更新 favicon）
  }
})
```

### 7.3 注册多变体皮肤

一个皮肤包可以注册多个 `ThemeDefinition`（亮+暗变体）：

```typescript
export function apply(ctx: Context) {
  ctx.inject(['theme'], (themeCtx) => {
    const disposeLight = themeCtx.theme.register({
      id: 'my-skin-light',
      colorScheme: 'light',
      tokens: { /* ... */ }
    })
    const disposeDark = themeCtx.theme.register({
      id: 'my-skin-dark',
      colorScheme: 'dark',
      tokens: { /* ... */ }
    })
    themeCtx.on('dispose', () => { disposeLight(); disposeDark() })
  })
}
```

## 8. 校验规则

| 检查项 | 失败处理 |
|---|---|
| `package.json` 有 `dsh.client.inject` 含 `ui-theme` | 拒绝加载（无 ctx.theme 会崩） |
| `skin.json` 存在且 JSON 合法 | 警告，仍可加载（按 Cordis 原生插件处理） |
| `skin.json.id` 与 `ThemeDefinition.id` 一致 | 警告 |
| `skin.json.colorScheme` 与 `ThemeDefinition.colorScheme` 一致 | 警告 |
| `lib/index.js` 存在且可加载 | 拒绝加载 |
| `apply(ctx)` 不抛异常 | 拒绝激活，回滚 |
| `register()` 抛错（如 ID 冲突） | 拒绝激活 |

## 9. 与 `dsh-web-ui` 的兼容

`dsh-web-ui` 的皮肤用的是**自己的 ThemePresenter**（直接操作 DOM），不走官方 `ctx.theme` API。两者不冲突但也不互通：

| 方面 | `dsh-web-ui` | 本规范 |
|---|---|---|
| 接入点 | 自定义 ThemePresenter 注入 DOM | 官方 `ctx.theme.register()` |
| 回滚 | 手写 retraction() 清理 | disposer 自动反注册 |
| 试穿 | 自己实现 | 复用 `setTheme()` 切换 |
| Token 层 | 任意 CSS | 只覆盖 `--dsw-alias-*`（安全沙箱） |

**迁移**：`dsh-web-ui` 皮肤可通过适配层转换 —— 把它的 `client.js` 包装成调用 `overrideTokens` 的 Cordis 插件。

## 10. 安全约束

- 皮肤是 Cordis 插件，运行在主线程，**有完整 ctx 权限** —— 因此皮肤中心加载第三方皮肤前会扫描源码，拒绝包含以下模式的皮肤：
  - `eval` / `Function` / 动态 `<script>`
  - `fetch` / `XMLHttpRequest` 到 `skin.json.homepage` 以外的域
  - 读写 `localStorage` / `indexedDB` 中非自身命名空间的数据
  - 访问 `navigator.clipboard` / `navigator.geolocation` 等敏感 API
- token 值经过 CSS 解析校验，拒绝非 CSS 合法值的注入

## 11. 版本

- 规范版本：`0.2.0`（基于 DSH v0.1.0-rc.5 官方实现重写）
- 上一版：`0.1.0`（基于 `dsh-web-ui` 第三方实现，已废弃）

## 变更日志

- `0.2.0` (2026-08-14)：**重大重写**。基于官方源码（`packages/client/ui-theme`、`packages/client/ui-layout`）重新定义皮肤接入点。皮肤从"自带 ThemePresenter 的 DOM 操作器"改为"调用 `ctx.theme.register()` 的 Cordis 插件"。
- `0.1.0` (2026-08-14)：首版，基于 `dsh-web-ui` 第三方实现。
