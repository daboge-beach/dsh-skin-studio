# 皮肤开发指南

> 从零开始造一个 DeepSeek Harness 皮肤。读完本文你能：用脚手架创建皮肤模板、本地热重载预览、构建发布到画廊。

---

## 前置准备

- Node.js ≥ 20
- pnpm ≥ 9
- DeepSeek Harness 已能正常启动（`npx @deepseek-ai/dsh web` 可访问 http://127.0.0.1:3080）
- 基础的 CSS / JavaScript 知识

## 1. 用脚手架创建皮肤

```bash
npx @dsh-skin-studio/create my-first-skin
```

脚手架会生成如下结构：

```
my-first-skin/
├── skin.json              # 已填好默认字段
├── preview.png            # 占位预览图
├── src/
│   ├── index.ts           # ThemePresenter 入口
│   ├── styles.css         # 样式
│   └── background.ts      # 背景逻辑示例
├── lib/
│   └── client.js          # 构建产物（首次为空，pnpm build 后生成）
├── package.json
├── tsconfig.json
└── README.md
```

## 2. 进入开发

```bash
cd my-first-skin
pnpm install
pnpm dev
```

`pnpm dev` 会：

1. 启动 tsdown 的 watch 模式，`src/` 改动自动重新构建到 `lib/client.js`
2. 启动一个本地皮肤中心，打开浏览器预览
3. 检测到 `lib/client.js` 更新后自动重新加载皮肤（热重载）

## 3. 理解 ThemePresenter

皮肤的核心是 `src/index.ts` 导出的 `ThemePresenter` 对象：

```typescript
// src/index.ts
import { injectStyles } from './styles.css';

export default {
  present(ctx, { variant, tryOn }) {
    // 1. 注入 CSS
    ctx.injectCSS(injectStyles(variant));

    // 2. （可选）注入 DOM
    if (variant === 'dark') {
      const bg = document.createElement('div');
      bg.className = 'my-skin-bg';
      ctx.injectDOM('background', bg);
    }

    // 3. （可选）消费其他插件数据
    const ticker = ctx.getPluginData('dsh-fun-ticker');
    if (ticker) {
      // 用行情数据做点什么
    }

    // 4. 返回清理函数
    return () => {
      // injectCSS/injectDOM 的资源会自动回收
      // 这里清理你手动创建的：定时器、事件监听、MutationObserver 等
    };
  },

  retraction() {
    // 兜底清理
  }
};
```

## 4. 常见皮肤实现模式

### 4.1 纯换色皮肤（最简单）

只改 CSS 变量，不碰 DOM：

```typescript
export default {
  present(ctx, { variant }) {
    const vars = variant === 'dark'
      ? { '--dsh-bg': '#0f172a', '--dsh-text': '#f1f5f9', '--dsh-primary': '#3b82f6' }
      : { '--dsh-bg': '#f8fafc', '--dsh-text': '#0f172a', '--dsh-primary': '#2563eb' };

    const css = Object.entries(vars)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n');

    ctx.injectCSS(`:root { ${css} }`);
  }
};
```

### 4.2 带背景图的皮肤

```typescript
export default {
  present(ctx) {
    ctx.injectCSS(`
      body {
        background: url('${ctx.asset('assets/background.png')}') center/cover fixed !important;
      }
      .dsh-panel {
        backdrop-filter: blur(12px);
        background: rgba(15, 23, 42, 0.6) !important;
      }
    `);
  }
};
```

### 4.3 消费插件数据的皮肤（如交易终端）

```typescript
export default {
  present(ctx) {
    const tickerEl = document.createElement('div');
    tickerEl.className = 'my-ticker';
    ctx.injectDOM('titlebar', tickerEl);

    const ticker = ctx.getPluginData<{ prices: Record<string, number> }>('dsh-fun-ticker');

    if (ticker) {
      const render = () => {
        tickerEl.textContent = Object.entries(ticker.prices)
          .map(([sym, price]) => `${sym} ${price}`)
          .join('  |  ');
      };
      render();
    } else {
      // 软依赖缺失时优雅降级
      tickerEl.textContent = '--';
      ctx.log.warn('dsh-fun-ticker not installed, ticker disabled');
    }
  }
};
```

## 5. 构建与发布

### 5.1 本地构建

```bash
pnpm build      # 构建 lib/client.js（tsdown）
pnpm validate   # 校验 skin.json 格式和资源完整性
```

### 5.2 本地试装

把皮肤目录软链到 DSH 的皮肤扫描路径：

```bash
dsh-skin link ~/.dsh/skins/
```

然后在 DSH Web UI 的皮肤中心刷新即可看到。

### 5.3 发布到 npm（可选）

如果想让其他人通过 `dsh plugin add` 安装你的皮肤：

```bash
npm version patch
npm publish --access public
```

发布前确保 `package.json` 的 `name` 字段以 `dsh-skin-` 开头，方便生态发现。

### 5.4 贡献到内置画廊

把皮肤源码放到本仓库的 `packages/skins/<你的皮肤名>/`，提 PR 即可（详见 [CONTRIBUTING.md](CONTRIBUTING.md)）。

## 6. 调试技巧

### 6.1 查看注入的 CSS

```javascript
ctx.log.info(document.getElementById('dsh-skin-style')?.textContent);
```

### 6.2 试穿不退出时的紧急回滚

如果皮肤把 UI 搞崩了无法操作，在浏览器控制台执行：

```javascript
window.__DSH_SKIN_EMERGENCY_RETRACT__();
```

会强制调用当前皮肤的 `retraction()` 并恢复默认主题。

### 6.3 检查资源是否正确打包

```bash
dsh-skin inspect ./my-first-skin
```

会列出皮肤包内所有文件、`skin.json` 解析结果、`capabilities` 声明等。

## 7. 常见坑

| 坑 | 解法 |
|---|---|
| 字体不生效 | DSH CSP 默认禁止跨域字体。把字体文件放到 `assets/` 并用 `ctx.asset()` 引用 |
| `injectDOM('background')` 没显示 | 背景层 z-index 很低，确认你的节点 `position: fixed; z-index: 0` |
| 试穿退出有残留 | 检查 `present()` 返回的清理函数是否清理了所有 `setTimeout` / `addEventListener` / `MutationObserver` |
| 暗色皮肤文字看不清 | 别忘了同时设置 `color`，不要只改 `background` |
| 热重载不生效 | 确认 `pnpm dev` 在跑，且 `lib/client.js` 确实更新了（看文件修改时间） |
| `getPluginData` 返回 null | 插件未安装是正常的，按软依赖降级处理 |

## 8. 下一步

- 读 [SKIN_SPEC.md](SKIN_SPEC.md) 了解完整的字段和能力定义
- 参考 `packages/skins/aurora/` 和 `packages/skins/midnight/` 的实现
- 加入 [GitHub Discussions](https://github.com/dengbochina-a11y/dsh-skin-studio/discussions) 提问和分享
