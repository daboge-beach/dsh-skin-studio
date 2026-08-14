/**
 * 伊泽瑞尔 · 符文远征（ezreal-relicrun）· 英雄联盟英雄主题。
 * 视觉素材：assets/（bg 横幅 / hero 立绘 / sprite_anim 吉祥物 / cursors 光标）。
 */
import type { Context } from '@dsh-skin-studio/types'

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'ezreal-relicrun',
      colorScheme: 'light',
      tokens: {
        '--dsw-alias-bg-base':       '#F2F6FA',
        '--dsw-alias-bg-layer-1':    '#FFFFFF',
        '--dsw-alias-bg-layer-2':    '#BBD6EE',
        '--dsw-alias-bg-overlay':    '#F2F6FA',  // 弹层用主题底色
        '--dsw-alias-border-l1':     '#BBD6EE',
        '--dsw-alias-border-l2':     '#85B4DC',
        '--dsw-alias-brand-primary': '#2E86D9',  // 符文远征
        '--dsw-alias-brand-hover':   '#5FA8E8',
        '--dsw-alias-label-primary': '#1C4F7C',
        '--dsw-alias-label-secondary': '#44719C',
        '--dsw-alias-state-error-primary': '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary': '#FBBF24',
        '--dsw-specific-sidebar-fill': '#F2F6FA',
      }
    });
    themeCtx.on('dispose', dispose);
  });
}

export const name = 'ezreal-relicrun';
