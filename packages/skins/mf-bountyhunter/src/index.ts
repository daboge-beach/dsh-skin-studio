/**
 * 厄运小姐 · 赏金女王（mf-bountyhunter）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'mf-bountyhunter',
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base':       '#221017',
        '--dsw-alias-bg-layer-1':    '#351B24',
        '--dsw-alias-bg-layer-2':    '#5C2A33',
        '--dsw-alias-bg-overlay':    '#351B24',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#5C2A33',
        '--dsw-alias-border-l2':     '#7E4550',
        '--dsw-alias-brand-primary': '#E0405A',  // 赏金女王
        '--dsw-alias-brand-hover':   '#EE6E82',
        '--dsw-alias-label-primary': '#F8D8DC',
        '--dsw-alias-label-secondary': '#D49AA4',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#5DCAA5',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#221017',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'mf-bountyhunter';
