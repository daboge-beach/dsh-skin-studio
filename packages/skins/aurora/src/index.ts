/**
 * Aurora skin — 极简亮色
 *
 * 设计目标：
 * - 柔和的晨光配色，长时间使用不刺眼
 * - 所有视觉变化通过 CSS 变量实现，不碰 DOM，回滚零残留
 * - 作为教学示例，代码尽量简单直白
 *
 * 这是 DSH Skin Studio 的默认皮肤之一。
 */

import type { ThemePresenter, SkinContext } from '@dsh-skin-studio/types';

const auroraPresenter: ThemePresenter = {
  present(ctx: SkinContext, _options) {
    // 通过注入 CSS 变量实现换色，不碰 DOM，回滚最干净
    ctx.injectCSS(`
      :root {
        /* Aurora 配色 - 柔和晨光 */
        --dsh-bg: #f8fafc;
        --dsh-bg-secondary: #f1f5f9;
        --dsh-surface: #ffffff;
        --dsh-surface-hover: #f8fafc;
        --dsh-text: #0f172a;
        --dsh-text-muted: #64748b;
        --dsh-text-subtle: #94a3b8;
        --dsh-border: #e2e8f0;
        --dsh-border-strong: #cbd5e1;

        --dsh-primary: #3b82f6;
        --dsh-primary-hover: #2563eb;
        --dsh-primary-subtle: #dbeafe;

        --dsh-accent: #8b5cf6;
        --dsh-success: #10b981;
        --dsh-warning: #f59e0b;
        --dsh-error: #ef4444;

        /* 圆角节奏 */
        --dsh-radius-sm: 6px;
        --dsh-radius-md: 10px;
        --dsh-radius-lg: 14px;

        /* 阴影 */
        --dsh-shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
        --dsh-shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.08);
        --dsh-shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.08);
      }

      /* 自定义滚动条 */
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: var(--dsh-bg-secondary); }
      ::-webkit-scrollbar-thumb {
        background: var(--dsh-border-strong);
        border-radius: 5px;
        border: 2px solid var(--dsh-bg-secondary);
      }
      ::-webkit-scrollbar-thumb:hover { background: var(--dsh-text-subtle); }
    `);

    // 纯 CSS 皮肤，没有手动创建任何资源
    // injectCSS 注入的样式会在 retraction 时自动移除
    return () => {
      ctx.log.info('Aurora skin retracted');
    };
  },

  retraction() {
    // 兜底清理（无额外资源需要清理）
  }
};

export default auroraPresenter;
