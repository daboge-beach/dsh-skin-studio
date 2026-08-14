/**
 * 金克斯 · 弹幕狂潮（jinx-mayhem）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'jinx-mayhem',
      colorScheme: 'dark',
      tokens: {
        '--dsw-alias-bg-base':       '#170F2E',
        '--dsw-alias-bg-layer-1':    '#241945',
        '--dsw-alias-bg-layer-2':    '#3B2A63',
        '--dsw-alias-bg-overlay':    '#241945',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#3B2A63',
        '--dsw-alias-border-l2':     '#5A4390',
        '--dsw-alias-brand-primary': '#22D3EE',  // 弹幕狂潮
        '--dsw-alias-brand-hover':   '#67E8F9',
        '--dsw-alias-label-primary': '#CFF5FF',
        '--dsw-alias-label-secondary': '#8FD7E8',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#5DCAA5',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#170F2E',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'jinx-mayhem';
