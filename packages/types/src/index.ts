/**
 * DSH Skin Studio — 类型定义
 *
 * 基于 DeepSeek Harness v0.1.0-rc.5 官方主题系统抽象。
 * 皮肤插件通过 ctx.theme.register() 注册 ThemeDefinition，
 * 不再需要自己实现 ThemePresenter 操作 DOM。
 */

/** 主题色系 */
export type ColorScheme = 'light' | 'dark';

/** 用户偏好（system 表示跟随系统） */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * 主题定义（皮肤的核心数据结构）
 *
 * 与官方 @deepseek-ai/dsh-client-ui-theme/client 的 ThemeDefinition 对齐。
 */
export interface ThemeDefinition {
  /** 主题唯一 ID（不可为 'system'、'light'、'dark'，这三个被内置占用） */
  id: string;
  /** 建立在哪个基础调色板上 */
  colorScheme: ColorScheme;
  /** alias token 覆盖（key 是 --dsw-alias-*，value 是 CSS 值） */
  tokens: Record<string, string>;
}

/** alias token 覆盖层（overrideTokens 用，每个 token 同时给亮/暗值） */
export interface ThemeTokenModes {
  light: string;
  dark: string;
}

/** 可覆盖的 alias token 字典 */
export type ThemeTokenOverrides = Record<string, ThemeTokenModes>;

/** Token 检查项（运行时可获取） */
export interface ThemeTokenInspection {
  name: string;
  description: string;
  valueType: string;
  requiresLightAndDark: boolean;
  cssVariable?: string;
}

/** 主题快照（theme/change 事件 payload） */
export interface ThemeSnapshot {
  preference: ThemePreference;
  active: ThemeDefinition;
  themes: readonly ThemeDefinition[];
  revision: number;
}

/**
 * 官方 ThemeRuntime 服务接口（ctx.theme）
 *
 * 皮肤插件通过 ctx.inject(['theme'], (ctx) => ctx.theme.register(...)) 使用。
 */
export interface ThemeRuntime {
  getTheme(): ThemeSnapshot;
  setTheme(id: string): void;
  register(definition: ThemeDefinition): () => void;
  overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void;
  exportInspectTokens(): ThemeTokenInspection[];
}

/**
 * 皮肤包的 skin.json 元数据
 *
 * 非运行时必需，但皮肤中心画廊用它展示皮肤信息。
 */
export interface SkinManifest {
  /** 皮肤 ID（必须与 ThemeDefinition.id 一致） */
  id: string;
  /** 显示名 */
  name: string;
  /** SemVer 版本 */
  version: string;
  /** 作者 */
  author: string | { name: string; email?: string; url?: string };
  /** 一句话描述 */
  description: string;

  /** 色系（必须与 ThemeDefinition.colorScheme 一致） */
  colorScheme: ColorScheme;
  /** 预览图路径 */
  preview?: string;
  /** 许可证 SPDX */
  license?: string;
  /** 主页 */
  homepage?: string;
  /** 搜索关键词 */
  keywords?: string[];
  /** 配色摘要（画廊用，不参与运行时） */
  palette?: {
    primary?: string;
    background?: string;
    surface?: string;
    text?: string;
    border?: string;
  };
  /** 兼容的 DSH 版本范围 */
  dshVersion?: string;
  /** 规范版本 */
  specVersion?: string;
}

/** 皮肤包校验结果 */
export interface SkinValidationResult {
  skinId: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}
