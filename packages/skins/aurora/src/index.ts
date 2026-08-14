/**
 * Aurora skin — 极简亮色
 *
 * 实现方式：注册一个 colorScheme='light' 的主题，
 * 覆盖官方 --dsw-alias-* token。不直接操作 DOM。
 *
 * 这是 DSH Skin Studio 的默认皮肤之一，基于官方 ThemeRuntime API。
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  // 声明依赖 ui-theme 服务，DSH 会保证 ctx.theme 可用后再激活本插件
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'aurora',
      colorScheme: 'light',
      tokens: {
        // Aurora 柔和晨光配色
        '--dsw-alias-bg-base':          '#f8fafc',
        '--dsw-alias-bg-layer-1':       '#ffffff',
        '--dsw-alias-bg-layer-2':       '#f1f5f9',
        '--dsw-alias-bg-overlay':       '#ffffff',

        '--dsw-alias-border-l1':        '#e2e8f0',
        '--dsw-alias-border-l2':        '#cbd5e1',

        '--dsw-alias-brand-primary':    '#3b82f6',

        '--dsw-alias-label-primary':    '#0f172a',
        '--dsw-alias-label-secondary':  '#64748b',

        '--dsw-alias-state-error-primary':   '#ef4444',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary':    '#f59e0b',

        '--dsw-specific-sidebar-fill':  '#f1f5f9',
      }
    });

    // 热插拔安全：插件卸载时反注册
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'aurora';
