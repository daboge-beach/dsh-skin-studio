# 皮肤开发指南

> 从零开始造一个 DeepSeek Harness 皮肤。基于官方 ThemeRuntime API（`ctx.theme.register()`），不直接操作 DOM。

---

## 前置准备

- Node.js ≥ 20
- pnpm ≥ 9
- DeepSeek Harness 已能启动（`npx @deepseek-ai/dsh web` 可访问 http://127.0.0.1:3080）
- 基础的 TypeScript / CSS 知识

## 1. 用脚手架创建皮肤

```bash
npx @dsh-skin-studio/create my-first-skin
```

生成的结构：

```
my-first-skin/
├── package.json          # 含 dsh.client.inject 声明依赖 ui-theme
├── skin.json             # 皮肤中心元数据
├── preview.png           # 占位预览图
├── src/
│   └── index.ts          # 插件入口，apply(ctx) 中调用 ctx.theme.register()
├── lib/                  # 构建产物（pnpm build 后生成）
├── tsconfig.json
└── README.md
```

## 2. 进入开发

```bash
cd my-first-skin
pnpm install
pnpm dev    # tsdown watch 模式，自动重建 lib/index.js
```

另开一个终端跑 DSH：

```bash
dsh --profile web    # 启动后浏览器访问 http://127.0.0.1:3080
```

在 DSH 设置中把你的皮肤 link 进 profile，皮肤热重载由 Cordis 的 HMR 处理。

## 3. 皮肤的核心逻辑

皮肤就是一个 **Cordis 插件**，导出 `apply(ctx)` 函数，在函数里调用 `ctx.theme.register()`：

```typescript
// src/index.ts
import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context) {
  // 关键：声明依赖 ui-theme 服务
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'my-first-skin',
      colorScheme: 'dark',                    // 或 'light'
      tokens: {
        '--dsw-alias-bg-base':         '#0f172a',
        '--dsw-alias-brand-primary':    '#60a5fa',
        '--dsw-alias-label-primary':    '#f1f5f9',
        // ... 只覆盖你想改的 alias token
      }
    });

    // 热插拔安全：插件卸载时反注册
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'my-first-skin';
```

**就这些。** 不需要写 CSS 文件、不需要操作 DOM、不需要写 retraction 逻辑 —— 官方 ThemePresenter 会自动把你的 token 投射到 `body.style`。

## 4. 可覆盖的 Alias Token

DSH 把 token 分两层：
- **static token**（`--dsw-static-*`）：~150 个原始色，**不可改**
- **alias token**（`--dsw-alias-*`）：语义化的角色色，**皮肤覆盖这些**

### 最常用的 alias token

| Token | 语义 |
|---|---|
| `--dsw-alias-bg-base` | 应用基础背景 |
| `--dsw-alias-bg-layer-1` | 卡片/面板背景 |
| `--dsw-alias-bg-layer-2` | 嵌套表面 |
| `--dsw-alias-bg-overlay` | popover/overlay |
| `--dsw-alias-border-l1` | 细边框 |
| `--dsw-alias-border-l2` | 强边框 |
| `--dsw-alias-brand-primary` | 品牌主色 |
| `--dsw-alias-label-primary` | 主文字 |
| `--dsw-alias-label-secondary` | 次要文字 |
| `--dsw-alias-state-error-primary` | 错误色 |
| `--dsw-alias-state-success-primary` | 成功色 |
| `--dsw-alias-state-warn-primary` | 警告色 |
| `--dsw-specific-sidebar-fill` | 侧边栏填充 |

运行时可用 `ctx.theme.exportInspectTokens()` 获取完整列表（包括其他插件动态注册的）。

## 5. 常见皮肤实现模式

### 5.1 纯换色皮肤（最简单）

```typescript
export function apply(ctx: Context) {
  ctx.inject(['theme'], (c) => {
    const dispose = c.theme.register({
      id: 'ocean-blue',
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-brand-primary': '#0ea5e9',
        '--dsw-alias-bg-base':       '#0c1e2e',
      }
    });
    c.on('dispose', dispose);
  });
}
```

### 5.2 引用 static token

```typescript
tokens: {
  // 用官方已有的 sky 蓝做主色
  '--dsw-alias-brand-primary': 'var(--dsw-static-blue-400)',
}
```

### 5.3 用 CSS color-mix 混色

```typescript
tokens: {
  // 在当前 bg-base 上叠 5% 黑
  '--dsw-alias-bg-layer-1': 'color-mix(in srgb, var(--dsw-alias-bg-base) 95%, black)',
}
```

### 5.4 亮 + 暗双变体皮肤

一个包注册两个主题：

```typescript
export function apply(ctx: Context) {
  ctx.inject(['theme'], (c) => {
    const disposeLight = c.theme.register({
      id: 'my-skin-light',
      colorScheme: 'light',
      tokens: { /* ... */ }
    });
    const disposeDark = c.theme.register({
      id: 'my-skin-dark',
      colorScheme: 'dark',
      tokens: { /* ... */ }
    });
    c.on('dispose', () => { disposeLight(); disposeDark(); });
  });
}
```

### 5.5 叠加 token 覆盖层（不改主题，只微调）

```typescript
ctx.theme.overrideTokens('my-plugin', {
  '--dsw-alias-brand-primary': {
    light: '#3b82f6',
    dark:  '#60a5fa'
  }
});
```

适用于"不改主题，只想根据当前色系微调某个 token"的场景。

### 5.6 监听主题变化做联动

```typescript
ctx.on('theme/change', (snapshot) => {
  if (snapshot.active.id === 'my-skin') {
    // 用户切到了我的皮肤，更新 favicon 或做其他联动
  }
});
```

## 6. 构建与发布

```bash
pnpm build      # 构建 lib/index.js
pnpm validate   # 校验 skin.json
```

### 本地试装

```bash
# link 到 DSH profile
dsh plugin --profile web link ./my-first-skin
```

### 发布到 npm

```bash
npm version patch
npm publish --access public
```

包名建议以 `dsh-skin-` 开头，方便生态发现。

## 7. 调试技巧

### 查看当前生效的 token

```typescript
const snap = ctx.theme.getTheme();
console.log(snap.active.tokens);  // 已 fold 所有 override 层
```

### 列出所有 token

```typescript
ctx.theme.exportInspectTokens().forEach(t => {
  console.log(t.name, '-', t.description);
});
```

### 紧急回滚

如果皮肤让 UI 崩了无法操作，浏览器控制台执行：

```javascript
// 强制切回内置 light 主题
window.__DSH_HOST__?.ctx?.theme?.setTheme('light');
```

## 8. 常见坑

| 坑 | 解法 |
|---|---|
| `ctx.theme is undefined` | `package.json` 没声明 `dsh.client.inject: ["@deepseek-ai/dsh-client-ui-theme"]` |
| 注册时报 "id already registered" | id 不能是 `system`/`light`/`dark`（内置），也不能与其他皮肤冲突 |
| 颜色没变 | 检查 token 名是否正确（必须是 `--dsw-alias-*` 或 `--dsw-specific-*`），不是 `--dsw-static-*` |
| 暗色皮肤文字看不清 | colorScheme='dark' 时，base palette 切暗色档，你的 token 值也应是暗色配色 |
| 切换后没生效 | 官方 ThemePresenter 是事件驱动的，确认 `theme/change` 事件触发了（`ctx.theme.getTheme().revision` 应增加） |

## 9. 下一步

- 读 [SKIN_SPEC.md](SKIN_SPEC.md) 了解完整规范
- 参考 `packages/skins/aurora/` 和 `packages/skins/midnight/` 的实现
- 加入 [GitHub Discussions](https://github.com/dengbochina-a11y/dsh-skin-studio/discussions) 提问和分享
