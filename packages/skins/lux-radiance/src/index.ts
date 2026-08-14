/**
 * 拉克丝 · 光棱圣辉（lux-radiance）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'lux-radiance',
      colorScheme: 'light',
      tokens: {
        '--dsw-alias-bg-base':       '#FAF6EC',
        '--dsw-alias-bg-layer-1':    '#FFFFFF',
        '--dsw-alias-bg-layer-2':    '#EED9A0',
        '--dsw-alias-bg-overlay':    '#FAF6EC',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#EED9A0',
        '--dsw-alias-border-l2':     '#D4B36A',
        '--dsw-alias-brand-primary': '#D99A1B',  // 光棱圣辉
        '--dsw-alias-brand-hover':   '#E8B84B',
        '--dsw-alias-label-primary': '#6E5210',
        '--dsw-alias-label-secondary': '#9C7C2E',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#FAF6EC',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'lux-radiance';
