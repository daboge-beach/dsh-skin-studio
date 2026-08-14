/**
 * 萨勒芬妮 · 星颂（seraphine-anthem）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'seraphine-anthem',
      colorScheme: 'light',
      tokens: {
        '--dsw-alias-bg-base':       '#F6EFFC',
        '--dsw-alias-bg-layer-1':    '#FFFFFF',
        '--dsw-alias-bg-layer-2':    '#DDC9F5',
        '--dsw-alias-bg-overlay':    '#F6EFFC',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#DDC9F5',
        '--dsw-alias-border-l2':     '#B79AE8',
        '--dsw-alias-brand-primary': '#A855F7',  // 星颂
        '--dsw-alias-brand-hover':   '#C77DFF',
        '--dsw-alias-label-primary': '#5B1E96',
        '--dsw-alias-label-secondary': '#8B5FBF',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#F6EFFC',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'seraphine-anthem';
