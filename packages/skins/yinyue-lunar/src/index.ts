/**
 * 凡人修仙传皮肤 3 · 银月「月华」
 *
 * 银蓝仙光 · 月华冷辉 —— dark
 * 角色依据：银月狼族玲珑仙子之魂，狼首玉如意器灵，觉醒七星月体。
 * 资源：assets/hero.png、assets/preview.png、assets/sprite_anim.png（4帧跳舞）
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'yinyue-lunar',
      colorScheme: 'dark',
      tokens: {
        // 银蓝仙光配色（来自 FANREN_SKINS_DESIGN.md，暗色系）
        '--dsw-alias-bg-base':          '#042C53',  // 深海夜空
        '--dsw-alias-bg-layer-1':       '#0C447C',
        '--dsw-alias-bg-layer-2':       '#185FA5',
        '--dsw-alias-bg-overlay':       '#0C447C',

        '--dsw-alias-border-l1':        '#185FA5',
        '--dsw-alias-border-l2':        '#378ADD',

        '--dsw-alias-brand-primary':    '#85B7EB',  // 银蓝仙光
        '--dsw-alias-brand-hover':      '#B5D4F4',

        '--dsw-alias-label-primary':    '#E6F1FB',  // 月白文字
        '--dsw-alias-label-secondary':  '#B5D4F4',

        '--dsw-alias-state-error-primary':   '#F09595',
        '--dsw-alias-state-success-primary': '#5DCAA5',
        '--dsw-alias-state-warn-primary':    '#FAC775',

        '--dsw-specific-sidebar-fill':  '#042C53',
      }
    });

    themeCtx.on('dispose', dispose);
  });
}

export const name = 'yinyue-lunar';
