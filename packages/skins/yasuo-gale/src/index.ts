/**
 * 亚索 · 斩风疾影（yasuo-gale）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'yasuo-gale',
      colorScheme: 'light',
      tokens: {
        '--dsw-alias-bg-base':       '#EEF5F4',
        '--dsw-alias-bg-layer-1':    '#FFFFFF',
        '--dsw-alias-bg-layer-2':    '#B7DEDB',
        '--dsw-alias-bg-overlay':    '#EEF5F4',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#B7DEDB',
        '--dsw-alias-border-l2':     '#7FB8B4',
        '--dsw-alias-brand-primary': '#0E9394',  // 斩风疾影
        '--dsw-alias-brand-hover':   '#3BB3B4',
        '--dsw-alias-label-primary': '#0F4E4E',
        '--dsw-alias-label-secondary': '#3B7272',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#EEF5F4',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'yasuo-gale';
