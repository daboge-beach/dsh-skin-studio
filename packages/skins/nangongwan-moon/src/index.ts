/**
 * 凡人修仙传皮肤 4 · 南宫婉「寒梅」
 *
 * 月白清辉 · 朱雀赤纹 —— light
 * 角色依据：掩月宗女修，韩立正配道侣，本命法宝朱雀环，修炼素女轮回功。
 * 资源：assets/hero.png、assets/preview.png、assets/sprite_anim.png（4帧抚琴）
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'nangongwan-moon',
      colorScheme: 'light',
      tokens: {
        // 月白清辉配色（来自 FANREN_SKINS_DESIGN.md）
        '--dsw-alias-bg-base':          '#F1EFE8',  // 月白宣纸
        '--dsw-alias-bg-layer-1':       '#FFFFFF',
        '--dsw-alias-bg-layer-2':       '#D3D1C7',  // 暖灰玉色
        '--dsw-alias-bg-overlay':       '#FFFFFF',

        '--dsw-alias-border-l1':        '#D3D1C7',
        '--dsw-alias-border-l2':        '#B4B2A9',

        '--dsw-alias-brand-primary':    '#B4B2A9',  // 白玉簪色
        '--dsw-alias-brand-hover':      '#888780',

        '--dsw-alias-label-primary':    '#444441',  // 墨色文字
        '--dsw-alias-label-secondary':  '#5F5E5A',

        '--dsw-alias-state-error-primary':   '#E24B4A',  // 朱雀赤
        '--dsw-alias-state-success-primary': '#97C459',
        '--dsw-alias-state-warn-primary':    '#FBBF24',

        '--dsw-specific-sidebar-fill':  '#F1EFE8',
      }
    });

    themeCtx.on('dispose', dispose);
  });
}

export const name = 'nangongwan-moon';
