/**
 * 凡人修仙传皮肤 5 · 紫灵「紫霞」
 *
 * 暗紫妖魅 · 紫纱流霞 —— dark
 * 角色依据：真名汪凝，乱星海妙音门主之女，第一美女，得六极圣祖传承。
 * 资源：assets/hero.png、assets/preview.png、assets/sprite_anim.png（4帧打坐）
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'ziling-mystic',
      colorScheme: 'dark',
      tokens: {
        // 暗紫妖魅配色（来自 FANREN_SKINS_DESIGN.md，暗色系）
        '--dsw-alias-bg-base':          '#26215C',  // 紫渊夜色
        '--dsw-alias-bg-layer-1':       '#3C3489',
        '--dsw-alias-bg-layer-2':       '#534AB7',
        '--dsw-alias-bg-overlay':       '#3C3489',

        '--dsw-alias-border-l1':        '#534AB7',
        '--dsw-alias-border-l2':        '#7F77DD',

        '--dsw-alias-brand-primary':    '#AFA9EC',  // 紫霞流光
        '--dsw-alias-brand-hover':      '#CECBF6',

        '--dsw-alias-label-primary':    '#EEEDFE',  // 月紫文字
        '--dsw-alias-label-secondary':  '#CECBF6',

        '--dsw-alias-state-error-primary':   '#F09595',
        '--dsw-alias-state-success-primary': '#5DCAA5',
        '--dsw-alias-state-warn-primary':    '#FAC775',

        '--dsw-specific-sidebar-fill':  '#26215C',
      }
    });

    themeCtx.on('dispose', dispose);
  });
}

export const name = 'ziling-mystic';
