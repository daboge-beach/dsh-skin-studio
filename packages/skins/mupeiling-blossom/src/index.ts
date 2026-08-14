/**
 * 凡人修仙传皮肤 1 · 慕沛灵「桃夭」
 *
 * 粉白国风 · 桃花薄雾 —— light
 * 角色依据：越国慕家嫡女，落云宗药园女修，一袭红粉色长裙外搭轻薄纱衣。
 * 资源：assets/hero.png（立绘）、assets/preview.png（缩略图）、assets/sprite_anim.png（4帧吉祥物）
 */

import type { Context } from '@deepseek-ai/cordis';

export function apply(ctx: Context): void {
  ctx.inject(['theme'], (themeCtx) => {
    const dispose = themeCtx.theme.register({
      id: 'mupeiling-blossom',
      colorScheme: 'light',
      tokens: {
        // 粉白国风配色（来自 FANREN_SKINS_DESIGN.md）
        '--dsw-alias-bg-base':          '#FBEAF0',  // 桃花薄雾底色
        '--dsw-alias-bg-layer-1':       '#FFFFFF',  // 雪白卡片
        '--dsw-alias-bg-layer-2':       '#F4C0D1',  // 粉纱层
        '--dsw-alias-bg-overlay':       '#FBEAF0',  // 弹层用主题底色（桃夭粉）

        '--dsw-alias-border-l1':        '#F4C0D1',
        '--dsw-alias-border-l2':        '#ED93B1',

        '--dsw-alias-brand-primary':    '#D4537E',  // 桃花主色
        '--dsw-alias-brand-hover':      '#ED93B1',

        '--dsw-alias-label-primary':    '#993556',  // 深玫红文字
        '--dsw-alias-label-secondary':  '#C77B98',

        '--dsw-alias-state-error-primary':   '#E24B4A',
        '--dsw-alias-state-success-primary': '#10b981',
        '--dsw-alias-state-warn-primary':    '#FBBF24',

        '--dsw-specific-sidebar-fill':  '#FBEAF0',
      }
    });

    themeCtx.on('dispose', dispose);
  });
}

export const name = 'mupeiling-blossom';
