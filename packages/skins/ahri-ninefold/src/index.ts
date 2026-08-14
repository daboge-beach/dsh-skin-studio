/**
 * 阿狸 · 九尾魅影（ahri-ninefold）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'ahri-ninefold',
      colorScheme: 'light',
      tokens: {
        '--dsw-alias-bg-base':       '#FDF2F4',
        '--dsw-alias-bg-layer-1':    '#FFFFFF',
        '--dsw-alias-bg-layer-2':    '#F3CFDA',
        '--dsw-alias-bg-overlay':    '#FDF2F4',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#F3CFDA',
        '--dsw-alias-border-l2':     '#E8A0B8',
        '--dsw-alias-brand-primary': '#E86A92',  // 九尾魅影
        '--dsw-alias-brand-hover':   '#F291B2',
        '--dsw-alias-label-primary': '#8F2F4E',
        '--dsw-alias-label-secondary': '#B96A84',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#FDF2F4',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'ahri-ninefold';
