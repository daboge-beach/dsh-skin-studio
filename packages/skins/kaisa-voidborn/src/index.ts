/**
 * 卡莎 · 虚空降临（kaisa-voidborn）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'kaisa-voidborn',
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base':       '#150D22',
        '--dsw-alias-bg-layer-1':    '#241638',
        '--dsw-alias-bg-layer-2':    '#3E2D63',
        '--dsw-alias-bg-overlay':    '#241638',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#3E2D63',
        '--dsw-alias-border-l2':     '#5C4590',
        '--dsw-alias-brand-primary': '#A78BFA',  // 虚空降临
        '--dsw-alias-brand-hover':   '#C4B0FD',
        '--dsw-alias-label-primary': '#EDE9FE',
        '--dsw-alias-label-secondary': '#B4A6E4',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#5DCAA5',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#150D22',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'kaisa-voidborn';
