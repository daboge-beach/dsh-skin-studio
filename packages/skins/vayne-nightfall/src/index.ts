/**
 * 维恩 · 夜狩（vayne-nightfall）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'vayne-nightfall',
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base':       '#171228',
        '--dsw-alias-bg-layer-1':    '#241D3E',
        '--dsw-alias-bg-layer-2':    '#3B3158',
        '--dsw-alias-bg-overlay':    '#241D3E',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#3B3158',
        '--dsw-alias-border-l2':     '#57497E',
        '--dsw-alias-brand-primary': '#8B7BD8',  // 夜狩
        '--dsw-alias-brand-hover':   '#B3A7EC',
        '--dsw-alias-label-primary': '#E6E1FA',
        '--dsw-alias-label-secondary': '#AFA3DC',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#5DCAA5',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#171228',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'vayne-nightfall';
