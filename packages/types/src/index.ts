/**
 * DSH Skin Studio — 类型定义
 *
 * 本包导出皮肤开发所需的全部 TypeScript 类型：
 * - ThemePresenter：皮肤运行时接口
 * - SkinContext：运行时上下文
 * - SkinManifest：skin.json 的类型
 *
 * 皮肤开发者只需 `import type { ThemePresenter, SkinContext } from '@dsh-skin-studio/types'`
 */

/** 皮肤变体 */
export type SkinVariant = 'light' | 'dark';

/** 皮肤能力声明 */
export interface SkinCapabilities {
  /** 自定义标题栏 */
  customTitleBar?: boolean;
  /** 自定义背景（图片、渐变、动画） */
  customBackground?: boolean;
  /** 自定义滚动条 */
  customScrollbars?: boolean;
  /** 动态 favicon */
  customFavicon?: boolean;
  /** 自定义字体 */
  customFonts?: boolean;
  /** 自定义光标 */
  customCaret?: boolean;
  /** 全屏沉浸模式 */
  fullScreenMode?: boolean;
  /** 声明消费的其他 DSH 插件（软依赖，缺失时降级） */
  consumePlugins?: string[];
}

/** 调色板 */
export interface SkinPalette {
  primary?: string;
  secondary?: string;
  background?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
  [key: string]: string | undefined;
}

/** 作者信息 */
export interface SkinAuthor {
  name: string;
  email?: string;
  url?: string;
}

/** skin.json 清单 */
export interface SkinManifest {
  /** 皮肤唯一 ID（kebab-case） */
  id: string;
  /** 显示名 */
  name: string;
  /** 语义化版本 */
  version: string;
  /** 作者 */
  author: string | SkinAuthor;
  /** 一句话描述 */
  description: string;
  /** 客户端 bundle 相对路径 */
  client: string;

  /** SPDX 许可证 */
  license?: string;
  /** 主页 URL */
  homepage?: string;
  /** 代码仓库 */
  repository?: string | { url: string };
  /** 搜索关键词 */
  keywords?: string[];
  /** 视觉变体 */
  variants?: SkinVariant[];
  /** 预览图路径 */
  preview?: string | { light: string; dark: string };
  /** 调色板 */
  palette?: SkinPalette;
  /** 能力声明 */
  capabilities?: SkinCapabilities;
  /** 兼容的 DSH 版本范围 */
  dshVersion?: string;
  /** 规范版本 */
  specVersion?: string;
  /** ThemePresenter 实现类型 */
  themePresenter?: string;
}

/** DOM 注入位置 */
export type DOMInjectionPosition = 'titlebar' | 'background' | 'statusbar';

/** 日志接口 */
export interface SkinLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

/**
 * 皮肤运行时上下文
 *
 * 在 present() 时由皮肤中心注入，提供 DSH UI 的所有交互能力。
 */
export interface SkinContext {
  /** UI 根节点 */
  readonly root: HTMLElement;
  /** 当前变体 */
  readonly variant: SkinVariant;

  /** 注入 CSS 文本（自动 scope 到本皮肤命名空间） */
  injectCSS(css: string): void;
  /** 注入 DOM 节点到指定位置 */
  injectDOM(position: DOMInjectionPosition, node: Node): void;
  /** 读取其他插件暴露的数据（必须在 capabilities.consumePlugins 中声明） */
  getPluginData<T = unknown>(pluginId: string): T | null;
  /** 监听 DSH 主题变化，返回取消监听函数 */
  onThemeChange(cb: (variant: SkinVariant) => void): () => void;
  /** 获取皮肤自身的静态资源 URL */
  asset(path: string): string;
  /** 日志 */
  readonly log: SkinLogger;
}

/** present() 的选项 */
export interface PresentOptions {
  variant: SkinVariant;
  /** 是否为试穿模式（试穿时建议避免重资源加载） */
  tryOn: boolean;
}

/**
 * 皮肤运行时接口
 *
 * 每个皮肤的 lib/client.js 默认导出必须实现此接口。
 */
export interface ThemePresenter {
  /**
   * 应用皮肤。
   * @returns 清理函数（调用即回滚）或 Promise<清理函数>
   */
  present(
    ctx: SkinContext,
    options: PresentOptions
  ): void | Promise<() => void>;

  /**
   * 完全回滚皮肤（兜底清理）。
   * injectCSS/injectDOM 注入的资源会自动回收，这里只清理手动创建的资源。
   */
  retraction?(): void;
}
