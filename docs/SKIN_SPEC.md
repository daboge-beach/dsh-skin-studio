# 皮肤规范 (Skin Specification)

> 本文档是 DSH Skin Studio 皮肤格式的**权威定义**。所有内置皮肤、用户上传皮肤、第三方皮肤包都必须遵循本规范。
>
> 本规范与 [`dsh-web-ui`](https://github.com/zhu1090093659/dsh-web-ui) 的皮肤格式保持兼容，已有 `dsh-web-ui` 皮肤可直接迁移。

---

## 1. 术语

| 术语 | 含义 |
|---|---|
| **皮肤 (Skin)** | 一种 DSH UI 插件，通过 `ThemePresenter` 接口改变 Harness Web UI 的视觉外观 |
| **皮肤包 (Skin Package)** | 一个自包含的目录或 `.zip` 文件，包含皮肤的所有资源 |
| **变体 (Variant)** | 同一皮肤的视觉变体，如 `light` / `dark` |
| **画廊 (Gallery)** | 皮肤中心的可视化界面，用于浏览、试穿、应用皮肤 |
| **试穿 (Try-on)** | 临时应用皮肤，可随时完全回滚 |
| **ThemePresenter** | 皮肤运行时接口，定义 `present()` 和 `retraction()` 两个生命周期方法 |

## 2. 目录结构

### 2.1 标准皮肤包

```
<skin-id>/
├── skin.json              # 皮肤清单（必填）
├── preview.png            # 画廊预览图（必填，1280×800，PNG）
├── preview-dark.png       # 暗色变体预览图（可选，有 dark 变体时建议提供）
├── README.md              # 皮肤介绍（可选）
├── LICENSE                # 许可证（可选，默认跟随项目 MIT）
├── assets/                # 静态资源（图片、字体、音效等）
│   ├── background.png
│   └── icon.svg
└── lib/
    └── client.js          # 客户端 bundle（必填，UMD 或 ESM）
```

### 2.2 zip 打包格式

上传 `.zip` 时，压缩包**根目录**必须包含 `skin.json`：

```
my-skin.zip
└── my-skin/               # （可选）一级子目录
    ├── skin.json
    ├── preview.png
    └── lib/client.js
```

校验器会自动识别压缩包根目录或一级子目录中的 `skin.json`。

## 3. `skin.json` 字段定义

### 3.1 必填字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 皮肤唯一标识符，`kebab-case`，正则 `^[a-z][a-z0-9-]{1,62}[a-z0-9]$` |
| `name` | string | 显示名，1–40 字符 |
| `version` | string | 语义化版本号，遵循 [SemVer](https://semver.org/) |
| `author` | string \| object | 作者信息，字符串或 `{ name, email, url }` |
| `description` | string | 一句话描述，≤140 字符 |
| `client` | string | 客户端 bundle 相对路径，默认 `lib/client.js` |

### 3.2 可选字段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `license` | string | `"MIT"` | SPDX 许可证标识符 |
| `homepage` | string | — | 项目主页 URL |
| `repository` | string \| object | — | 代码仓库地址 |
| `keywords` | string[] | `[]` | 搜索关键词 |
| `variants` | string[] | `["light"]` | 视觉变体列表，可选值：`light`、`dark` |
| `preview` | string \| object | `"preview.png"` | 预览图路径，多变体时为 `{ light, dark }` |
| `palette` | object | — | 调色板，用于画廊配色预览 |
| `capabilities` | object | `{}` | 皮肤能力声明（见 3.4） |
| `dshVersion` | string | — | 兼容的 DSH 版本范围（SemVer range） |
| `themePresenter` | string | `"default"` | ThemePresenter 实现类型 |

### 3.3 `palette` 字段

```jsonc
{
  "palette": {
    "primary":    "#3b82f6",   // 主色
    "secondary":  "#8b5cf6",   // 副色
    "background": "#0f172a",   // 背景色
    "surface":    "#1e293b",   // 卡片/面板背景
    "text":       "#f1f5f9",   // 主文字色
    "textMuted":  "#94a3b8",   // 次要文字色
    "border":     "#334155",   // 边框色
    "success":    "#10b981",
    "warning":    "#f59e0b",
    "error":      "#ef4444"
  }
}
```

`palette` 仅用于画廊预览和生成基础 CSS 变量，皮肤可以在 `client.js` 中覆盖任意样式。

### 3.4 `capabilities` 字段

```jsonc
{
  "capabilities": {
    "customTitleBar": true,        // 自定义标题栏（颜色、按钮、文字）
    "customBackground": true,      // 自定义背景（图片、渐变、动画）
    "customScrollbars": true,      // 自定义滚动条样式
    "customFavicon": true,         // 动态 favicon
    "customFonts": true,           // 自定义字体（注意：字体文件需自带或走 CDN）
    "customCaret": false,          // 自定义光标
    "fullScreenMode": false,       // 全屏沉浸模式
    "consumePlugins": [            // 声明消费的其他 DSH 插件（软依赖，缺失时降级）
      "dsh-fun-ticker",
      "dsh-token-stats"
    ]
  }
}
```

`consumePlugins` 中的插件是**软依赖**：皮肤应当能在这些插件未安装时优雅降级，不得因依赖缺失而崩溃。

## 4. `lib/client.js` 规范

### 4.1 模块格式

- **推荐**：ESM (`export default`)
- **兼容**：UMD（挂载到 `window.DshSkin_<id>`）

### 4.2 `ThemePresenter` 接口

客户端 bundle 的默认导出必须是一个实现下列接口的对象或类：

```typescript
interface ThemePresenter {
  /**
   * 应用皮肤（试穿或正式应用时调用）
   * @param ctx 运行时上下文，提供 DSH UI 的 DOM 根节点、CSS 变量注入 API、插件数据总线等
   * @param options { variant: 'light' | 'dark', tryOn: boolean }
   * @returns 卸载函数（调用即回滚）或 Promise<卸载函数>
   */
  present(
    ctx: SkinContext,
    options: { variant: 'light' | 'dark'; tryOn: boolean }
  ): void | Promise<() => void>;

  /**
   * 完全回滚皮肤（卸载时调用）
   * 必须清理所有注入的 DOM、CSS、事件监听、定时器、 MutationObserver
   */
  retraction?(): void;
}
```

### 4.3 `SkinContext`

```typescript
interface SkinContext {
  /** UI 根节点（注入 CSS 变量和样式的目标） */
  root: HTMLElement;
  /** 当前变体 */
  variant: 'light' | 'dark';
  /** 注入 CSS 文本（自动 scope 到本皮肤命名空间） */
  injectCSS(css: string): void;
  /** 注入 DOM 节点到指定位置 */
  injectDOM(position: 'titlebar' | 'background' | 'statusbar', node: Node): void;
  /** 读取其他插件暴露的数据（capabilities.consumePlugins 声明的） */
  getPluginData<T = unknown>(pluginId: string): T | null;
  /** 监听 DSH 主题变化 */
  onThemeChange(cb: (variant: 'light' | 'dark') => void): () => void;
  /** 获取皮肤自身的静态资源 URL */
  asset(path: string): string;
  /** 日志（会打到 DSH session log） */
  log: { info(...args: unknown[]): void; warn(...args: unknown[]): void; error(...args: unknown[]): void };
}
```

### 4.4 最小示例

```javascript
// lib/client.js（源码，构建前）
export default {
  present(ctx, { variant }) {
    const colors = variant === 'dark'
      ? { bg: '#0f172a', text: '#f1f5f9' }
      : { bg: '#f8fafc', text: '#0f172a' };

    ctx.injectCSS(`
      background: ${colors.bg} !important;
      color: ${colors.text} !important;
    `);

    // 返回清理函数
    return () => {
      // injectCSS 注入的样式会在 retraction 时自动移除
      // 这里清理手动添加的定时器、事件监听等
    };
  },

  retraction() {
    // 兜底清理（injectCSS/injectDOM 的资源会自动回收）
  }
};
```

## 5. 校验规则

上传或加载皮肤时，皮肤中心会执行以下校验：

### 5.1 静态校验（加载前）

| 检查项 | 失败处理 |
|---|---|
| `skin.json` 存在且为合法 JSON | 拒绝加载 |
| 必填字段齐全且类型正确 | 拒绝加载 |
| `id` 符合命名规则且无冲突 | 冲突时拒绝加载 |
| `version` 符合 SemVer | 拒绝加载 |
| `client` 指向的文件存在 | 拒绝加载 |
| `preview` 指向的图片存在 | 警告，仍可加载（画廊用占位图） |

### 5.2 运行时校验（试穿时）

| 检查项 | 失败处理 |
|---|---|
| `client.js` 可正常加载 | 拒绝试穿，显示错误 |
| 默认导出有 `present` 方法 | 拒绝试穿 |
| `present()` 不抛异常 | 自动回滚，显示错误 |
| `present()` 返回的清理函数可正常调用 | 警告（试穿退出时可能有残留） |

### 5.3 安全约束

- 皮肤 JS 运行在**沙箱 iframe** 或 **Worker** 中（视 DSH 能力而定），无直接文件系统访问
- 禁止 `eval`、`Function` 构造、动态 `<script>` 注入（CSP 拦截）
- 网络请求仅允许 `capabilities.consumePlugins` 声明的数据源 + 皮肤 `homepage` 同域

## 6. 版本兼容

- 本规范版本：`0.1.0`
- `skin.json` 可通过 `specVersion` 字段声明遵循的规范版本（缺省为 `0.1.0`）
- 未来规范升级时，皮肤中心会根据 `specVersion` 选择对应的加载器，保证向后兼容

## 7. 与 `dsh-web-ui` 的兼容性

本规范基于 `dsh-web-ui` 的实际实现抽象，差异如下：

| 方面 | `dsh-web-ui` | 本规范 |
|---|---|---|
| 打包方式 | 单一 npm 聚合包 `@linxin666/dsh-skins` | npm 聚合包 + 本地目录 + zip 上传 三选一 |
| 皮肤发现 | `listSkinDirCandidates` + pnpm virtual-store | 上述三种来源合并去重 |
| ThemePresenter | `present()` + `retraction()` | 同上，增加返回清理函数的约定 |
| `skin.json` 字段 | 未完整公开 | 本规范显式定义（见第 3 节） |
| 软依赖 | 隐式（交易终端皮肤内部处理降级） | 显式声明在 `capabilities.consumePlugins` |

已有的 `dsh-web-ui` 皮肤**无需修改**即可在本皮肤中心加载（通过兼容层适配字段差异）。

## 8. 变更日志

- `0.1.0` (2026-08-14)：首版规范，对齐 `dsh-web-ui` 实际实现并显式化字段定义
