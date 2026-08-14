/**
 * Midnight skin — 极简暗色
 *
 * 与 aurora 对称的暗色实现，覆盖同一批 alias token，
 * 但 colorScheme='dark'，base palette 自动切到暗色档。
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'midnight',
      colorScheme: 'dark',
      tokens: {
        // Midnight 深邃夜空配色
        '--dsw-alias-bg-base':          '#0f172a',
        '--dsw-alias-bg-layer-1':       '#1e293b',
        '--dsw-alias-bg-layer-2':       '#334155',
        '--dsw-alias-bg-overlay':       '#1e293b',

        '--dsw-alias-border-l1':        '#334155',
        '--dsw-alias-border-l2':        '#475569',

        '--dsw-alias-brand-primary':    '#60a5fa',

        '--dsw-alias-label-primary':    '#f1f5f9',
        '--dsw-alias-label-secondary':  '#94a3b8',

        '--dsw-alias-state-error-primary':   '#f87171',
        '--dsw-alias-state-success-primary': '#34d399',
        '--dsw-alias-state-warn-primary':    '#fbbf24',

        '--dsw-specific-sidebar-fill':  '#0f172a',
      }
    });

    themeCtx.on('dispose', dispose);
  });
}

export const name = 'midnight';
