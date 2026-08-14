/**
 * 凡人修仙传皮肤 2 · 韩立「青竹」
 *
 * 青绿道风 · 翠竹雷光 —— light
 * 角色依据：青袍道人，本命法宝青竹蜂云剑（七十二把金雷竹飞剑，含辟邪神雷）。
 * 资源：assets/hero.png、assets/preview.png、assets/sprite_anim.png（4帧舞剑）
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'hanli-daoist',
      colorScheme: 'light',
      tokens: {
        // 青绿道风配色（来自 FANREN_SKINS_DESIGN.md）
        '--dsw-alias-bg-base':          '#EAF3DE',  // 竹林晨光
        '--dsw-alias-bg-layer-1':       '#F4F8EC',
        '--dsw-alias-bg-layer-2':       '#C0DD97',
        '--dsw-alias-bg-overlay':       '#F4F8EC',

        '--dsw-alias-border-l1':        '#C0DD97',
        '--dsw-alias-border-l2':        '#97C459',

        '--dsw-alias-brand-primary':    '#639922',  // 青竹主色
        '--dsw-alias-brand-hover':      '#97C459',

        '--dsw-alias-label-primary':    '#3B6D11',  // 深竹绿文字
        '--dsw-alias-label-secondary':  '#5F8A3D',

        '--dsw-alias-state-error-primary':   '#BA7517',
        '--dsw-alias-state-success-primary': '#639922',
        '--dsw-alias-state-warn-primary':    '#FBBF24',  // 辟邪神雷金

        '--dsw-specific-sidebar-fill':  '#EAF3DE',
      }
    });

    themeCtx.on('dispose', dispose);
  });
}

export const name = 'hanli-daoist';
