/**
 * 娑娜 · 弦语仙音（sona-etwahl）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'sona-etwahl',
      colorScheme: 'light',
      tokens: {
        '--dsw-alias-bg-base':       '#F4F0FA',
        '--dsw-alias-bg-layer-1':    '#FFFFFF',
        '--dsw-alias-bg-layer-2':    '#CFC2E8',
        '--dsw-alias-bg-overlay':    '#F4F0FA',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#CFC2E8',
        '--dsw-alias-border-l2':     '#A88FD4',
        '--dsw-alias-brand-primary': '#7C5CBF',  // 弦语仙音
        '--dsw-alias-brand-hover':   '#A184DD',
        '--dsw-alias-label-primary': '#442F73',
        '--dsw-alias-label-secondary': '#6E5AA0',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#F4F0FA',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'sona-etwahl';
