/**
 * Midnight skin — 极简暗色
 *
 * 设计目标：
 * - 深邃的夜空配色，长时间使用护眼
 * - 与 Aurora 对称的暗色实现，方便对照学习
 *
 * 这是 DSH Skin Studio 的默认皮肤之一。
 */

import type { ThemePresenter, SkinContext } from '@dsh-skin-studio/types';

const midnightPresenter: ThemePresenter = {
  present(ctx: SkinContext, _options) {
    ctx.injectCSS(`
      :root {
        /* Midnight 配色 - 深邃夜空 */
        --dsh-bg: #0f172a;
        --dsh-bg-secondary: #1e293b;
        --dsh-surface: #1e293b;
        --dsh-surface-hover: #334155;
        --dsh-text: #f1f5f9;
        --dsh-text-muted: #94a3b8;
        --dsh-text-subtle: #64748b;
        --dsh-border: #334155;
        --dsh-border-strong: #475569;

        --dsh-primary: #60a5fa;
        --dsh-primary-hover: #93c5fd;
        --dsh-primary-subtle: #1e3a8a;

        --dsh-accent: #a78bfa;
        --dsh-success: #34d399;
        --dsh-warning: #fbbf24;
        --dsh-error: #f87171;

        --dsh-radius-sm: 6px;
        --dsh-radius-md: 10px;
        --dsh-radius-lg: 14px;

        /* 暗色皮肤阴影偏深 */
        --dsh-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
        --dsh-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
        --dsh-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
      }

      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: var(--dsh-bg); }
      ::-webkit-scrollbar-thumb {
        background: var(--dsh-border-strong);
        border-radius: 5px;
        border: 2px solid var(--dsh-bg);
      }
      ::-webkit-scrollbar-thumb:hover { background: var(--dsh-text-subtle); }

      /* 暗色皮肤优化：减弱 autofill 黄色背景 */
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-text-fill-color: var(--dsh-text);
        -webkit-box-shadow: 0 0 0 1000px var(--dsh-surface) inset;
        transition: background-color 5000s ease-in-out 0s;
      }
    `);

    return () => {
      ctx.log.info('Midnight skin retracted');
    };
  },

  retraction() {
    // 兜底清理
  }
};

export default midnightPresenter;
