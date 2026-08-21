/**
 * skinEffects.ts — 皮肤特效层（插件自管 CSS 通道）。
 *
 * 官方 ctx.theme.register 只接受 --dsw-alias-* 与 --dsw-specific-* 颜色
 * token（不带后缀斜杠），光标 / 按钮特效 / 背景装饰动画都超出该沙箱 → 本模块
 * 走「插件自管 CSS」：
 *   1. 在 body 上维护 `xl-skin-{id}` 皮肤 class（FANREN §四.2 约定），
 *      theme/change 时切换；卸载可完全回滚。
 *   2. 注入一个 `<style data-plugin-css>`（宿主卸载插件时移除同标签）。
 *      其中光标 / 按钮 / 背景装饰规则全部作用域在 `body.xl-skin-*` 之下，
 *      只在 prefers-reduced-motion: no-preference 时播动画。
 *   3. 装饰背景元素由 JS 生成 DOM（animation 纯 CSS @keyframes，
 *      transform/opacity 优先，60fps），随皮肤切换重建、卸载彻底移除。
 *
 * 按钮特效作用域（约束 #4）：DSH 自带按钮不吃我们的 class，因此第一版
 * 特效同时用全局选择器覆盖在 body.xl-skin-* 下的按钮上，保持可逆、不改
 * harness 源码。特效色一律取自各皮肤 palette（builtinSkins.ts）。
 */
import type { ThemeSnapshot } from '@dsh-skin-studio/types'
import { skinStudioSettings } from './settings.ts'
import { effectiveTier, subscribeTier, TIERED_CURSOR_SKINS } from './tierPower.ts'

/** 每款皮肤的视觉元数据：皮肤 class 后缀 + 光标文件名前缀 + 画布尺寸。 */
export interface SkinVisual {
  /** body 上的皮肤 class（`xl-skin-{cssClass}`）。 */
  cssClass: string
  /** assets/cursors/ 下三态文件的前缀。 */
  cursorPrefix: string
  /** 光标热点（pointer 尖端坐标，相对 32×32 画布）。 */
  hotspot: [number, number]
}

/** 全部 18 款皮肤的视觉元数据；aurora/midnight 无光标文件（cursorPrefix 空，光标规则跳过，跟随系统）。 */
export const SKIN_CURSORS: Record<string, SkinVisual> = {
  'mupeiling-blossom': { cssClass: 'xl-skin-blossom', cursorPrefix: 'blossom', hotspot: [16, 16] },
  'hanli-daoist': { cssClass: 'xl-skin-daoist', cursorPrefix: 'sword', hotspot: [11, 9] },
  'yinyue-lunar': { cssClass: 'xl-skin-lunar', cursorPrefix: 'moon', hotspot: [16, 15] },
  'nangongwan-moon': { cssClass: 'xl-skin-moon', cursorPrefix: 'hairpin', hotspot: [16, 4] },
  'ziling-mystic': { cssClass: 'xl-skin-mystic', cursorPrefix: 'veil', hotspot: [15, 12] },
  'seraphine-anthem': { cssClass: 'xl-skin-anthem', cursorPrefix: 'note', hotspot: [16, 16] },
  'jinx-mayhem': { cssClass: 'xl-skin-mayhem', cursorPrefix: 'rocket', hotspot: [14, 16] },
  'lux-radiance': { cssClass: 'xl-skin-radiance', cursorPrefix: 'wand', hotspot: [6, 16] },
  'yasuo-gale': { cssClass: 'xl-skin-gale', cursorPrefix: 'galeblade', hotspot: [6, 16] },
  'vayne-nightfall': { cssClass: 'xl-skin-nightfall', cursorPrefix: 'bolt', hotspot: [4, 16] },
  'ezreal-relicrun': { cssClass: 'xl-skin-relicrun', cursorPrefix: 'gauntlet', hotspot: [16, 16] },
  'sona-etwahl': { cssClass: 'xl-skin-etwahl', cursorPrefix: 'harp', hotspot: [16, 16] },
  'mf-bountyhunter': { cssClass: 'xl-skin-bounty', cursorPrefix: 'bullet', hotspot: [16, 12] },
  'ahri-ninefold': { cssClass: 'xl-skin-ninefold', cursorPrefix: 'orb', hotspot: [16, 16] },
  'kaisa-voidborn': { cssClass: 'xl-skin-voidborn', cursorPrefix: 'voidfly', hotspot: [16, 16] },
  'liangshen': { cssClass: 'xl-skin-liangshen', cursorPrefix: 'tablet', hotspot: [14, 14] },
  'aurora': { cssClass: 'xl-skin-aurora', cursorPrefix: '', hotspot: [0, 0] },
  'midnight': { cssClass: 'xl-skin-midnight', cursorPrefix: '', hotspot: [0, 0] },
}

const CURSOR_STYLE_TAG = '@dsh-skin-studio/gallery/skin-cursors'

/**
 * 生成光标 CSS（作用域在 body.xl-skin-* 之下）。
 * - 默认态：body.xl-skin-{c}.xl-cursor-default
 * - 悬停态：交互元素（button/a/[role=button]/input/label 等）
 * - 点击态：mousedown 时 body.xl-skin-{c}.xl-cursor-click
 *
 * 所有 cursor 带 fallback（auto/pointer），保证 SVG 加载失败仍可用。
 */
function buildCursorCss(): string {
  // 光标开关：关闭时回退系统光标（部分皮肤光标热点偏移影响点击精度）
  if (!skinStudioSettings.get().cursorFx) return ''
  const rules: string[] = []
  const tier = effectiveTier()
  for (const [skinId, v] of Object.entries(SKIN_CURSORS)) {
    const base = `/skins/${skinId}/assets/cursors`
    const [hx, hy] = v.hotspot
    // 分档光标：t1+ 用 -t{n} 配色变体（TIERED_CURSOR_SKINS 有变体资产）
    const suffix = tier > 0 && TIERED_CURSOR_SKINS.has(skinId) ? `-t${tier}` : ''
    if (v.cursorPrefix === '') continue // aurora/midnight 无光标文件，跳过光标规则
    // v.cssClass 已含 xl-skin- 前缀，此处不可再拼一层
    rules.push(
      `body.${v.cssClass} {`,
      `  cursor: url('${base}/${v.cursorPrefix}-default${suffix}.svg') ${hx} ${hy}, auto;`,
      `}`,
      `body.${v.cssClass} :is(button, a, [role="button"], input, select, textarea, label, summary) {`,
      `  cursor: url('${base}/${v.cursorPrefix}-hover${suffix}.svg') ${hx} ${hy}, pointer;`,
      `}`,
      `body.${v.cssClass}.xl-cursor-click :is(button, a, [role="button"], input, select, textarea, label, summary) {`,
      `  cursor: url('${base}/${v.cursorPrefix}-click${suffix}.svg') ${hx} ${hy}, pointer;`,
      `}`,
    )
  }
  return rules.join('\n')
}

// ── 面板半透明化（让整页人物海报透出来） ────────────────────────────────

/**
 * DSH 的 ThemePresenter 把皮肤 token 以 body 内联 style 写入
 * （ui-layout/theme-presenter.ts 的 body.style.setProperty），而 AppFrame
 * 等组件用不透明的 var(--dsw-alias-bg-base) 铺满整个视口 → body 上的
 * 海报背景被完全盖住。
 *
 * 解法：在 `body.xl-skin-{c} #root` 上重定义背景 token。#root 是 body 的
 * 后代，自定义属性按「最近继承源」解析，#root 上的值天然覆盖从 body 内联
 * style 继承来的值（不是同元素争优先级，内联打不进来）；皮肤 class 摘掉
 * 后选择器失配，立即回到官方值，完全可逆。模态/弹层 portal 渲染在 #root
 * 之外，保持官方不透明值，可读性更好。
 */
interface PanelVeilSpec {
  /** bg-base 的 RGB（与 builtinSkins 注册值一致）。 */
  base: [number, number, number]
  /** bg-layer-1 的 RGB。 */
  layer1: [number, number, number]
  /** bg-layer-2 的 RGB。 */
  layer2: [number, number, number]
  /** sidebar-fill 的 RGB。 */
  sidebar: [number, number, number]
  /** 主画布（frame）alpha — 海报透出程度主要看这里。 */
  aBase: number
  /** 侧栏/主面板填充 alpha。 */
  aSidebar: number
  /** 浮起表面（气泡/卡片）alpha。 */
  aLayer1: number
  /** 嵌套表面 alpha。 */
  aLayer2: number
}

/** 每款皮肤的半透明面板规格（暗色款 alpha 略高保文字可读）。 */
const PANEL_VEIL: Record<string, PanelVeilSpec> = {
  'aurora': { base: [244, 248, 252], layer1: [255, 255, 255], layer2: [241, 245, 249], sidebar: [241, 245, 249], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'midnight': { base: [15, 23, 42], layer1: [30, 41, 59], layer2: [51, 65, 85], sidebar: [15, 23, 42], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'liangshen': { base: [10, 15, 30], layer1: [17, 24, 39], layer2: [26, 37, 64], sidebar: [10, 15, 30], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'mupeiling-blossom': { base: [251, 234, 240], layer1: [255, 255, 255], layer2: [244, 192, 209], sidebar: [251, 234, 240], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'hanli-daoist': { base: [234, 243, 222], layer1: [244, 248, 236], layer2: [192, 221, 151], sidebar: [234, 243, 222], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'yinyue-lunar': { base: [4, 44, 83], layer1: [12, 68, 124], layer2: [24, 95, 165], sidebar: [4, 44, 83], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'nangongwan-moon': { base: [241, 239, 232], layer1: [255, 255, 255], layer2: [211, 209, 199], sidebar: [241, 239, 232], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'ziling-mystic': { base: [38, 33, 92], layer1: [60, 52, 137], layer2: [83, 74, 183], sidebar: [38, 33, 92], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  // 英雄联盟系列（亮色 .36 / 暗色 .50）
  'seraphine-anthem': { base: [246, 239, 252], layer1: [255, 255, 255], layer2: [221, 201, 245], sidebar: [246, 239, 252], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'jinx-mayhem': { base: [23, 15, 46], layer1: [36, 25, 69], layer2: [59, 42, 99], sidebar: [23, 15, 46], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'lux-radiance': { base: [250, 246, 236], layer1: [255, 255, 255], layer2: [238, 217, 160], sidebar: [250, 246, 236], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'yasuo-gale': { base: [238, 245, 244], layer1: [255, 255, 255], layer2: [183, 222, 219], sidebar: [238, 245, 244], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'vayne-nightfall': { base: [23, 18, 40], layer1: [36, 29, 62], layer2: [59, 49, 88], sidebar: [23, 18, 40], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'ezreal-relicrun': { base: [242, 246, 250], layer1: [255, 255, 255], layer2: [187, 214, 238], sidebar: [242, 246, 250], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'sona-etwahl': { base: [244, 240, 250], layer1: [255, 255, 255], layer2: [207, 194, 232], sidebar: [244, 240, 250], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'mf-bountyhunter': { base: [34, 16, 23], layer1: [53, 27, 36], layer2: [92, 42, 51], sidebar: [34, 16, 23], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'ahri-ninefold': { base: [253, 242, 244], layer1: [255, 255, 255], layer2: [243, 207, 218], sidebar: [253, 242, 244], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'kaisa-voidborn': { base: [21, 13, 34], layer1: [36, 22, 56], layer2: [62, 45, 99], sidebar: [21, 13, 34], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
}

/** 生成面板半透明 token 覆盖（作用域 body.xl-skin-* #root）。 */
/** 弹窗层 token 覆盖（不透明主题色：无论 DSH 哪个弹窗吃哪个表面 token，
 *  都拿到主题底色而非注册的雪白 layer-1；只作用弹窗容器，主界面卡片/
 *  气泡的雪白表面不受影响）。 */
function buildDialogVeilCss(): string {
  const rules: string[] = []
  for (const [skinId, v] of Object.entries(PANEL_VEIL)) {
    const cssClass = SKIN_CURSORS[skinId]?.cssClass
    if (cssClass === undefined) continue
    rules.push(
      // 弹窗本体（DSH 设置弹窗 / 皮肤中心 Modal / 权限与提问弹窗等）
      `body.${cssClass} :is([role="dialog"], [aria-modal="true"]) {`,
      `  --dsw-alias-bg-base: rgb(${v.base.join(' ')});`,
      `  --dsw-alias-bg-layer-1: rgb(${v.base.join(' ')});`,
      `  --dsw-alias-bg-layer-2: rgb(${v.layer2.join(' ')});`,
      `}`,
      // 兜底：渲染在 #root 之外的 body 级 portal 容器（同样给不透明主题色；
      // #root 自身因 ID 特异度更高，保持半透明海报覆盖不受影响）
      `body.${cssClass} > div:not(#root) {`,
      `  --dsw-alias-bg-base: rgb(${v.base.join(' ')});`,
      `  --dsw-alias-bg-layer-1: rgb(${v.base.join(' ')});`,
      `  --dsw-alias-bg-layer-2: rgb(${v.layer2.join(' ')});`,
      `}`,
    )
  }
  return rules.join('\n')
}

function buildPanelVeilCss(): string {
  // veil 轻纱（原图透出模式）：bg-base 大幅透明（它只是气泡间隙的底色，
  // 压在整个背景图上把图压灰——正文文字实际坐在消息气泡的 layer-* 实底
  // 上，bg-base 降到近透不影响可读性）；侧栏 fill 同步减半让图更净。
  const rules: string[] = []
  for (const [skinId, v] of Object.entries(PANEL_VEIL)) {
    const cssClass = SKIN_CURSORS[skinId]?.cssClass
    if (cssClass === undefined) continue
    rules.push(
      `body.${cssClass} #root {`,
      `  --dsw-alias-bg-base: rgb(${v.base.join(' ')} / ${(v.aBase * 0.3).toFixed(2)});`,
      `  --dsw-alias-bg-layer-1: rgb(${v.layer1.join(' ')} / ${v.aLayer1});`,
      `  --dsw-alias-bg-layer-2: rgb(${v.layer2.join(' ')} / ${v.aLayer2});`,
      `  --dsw-specific-sidebar-fill: rgb(${v.sidebar.join(' ')} / ${(v.aSidebar * 0.55).toFixed(2)});`,
      `}`,
    )
  }
  return rules.join('\n')
}

// ── 装饰背景层（每款皮肤一种飘落/闪烁装饰） ─────────────────────────────

interface DecorSpec {
  /** 装饰元素 class 前缀。 */
  prefix: string
  /** 元素主题色（用调色板强调色）。 */
  colors: string[]
  /** 元素数量。 */
  count: number
  /** 叠加的动画名（cssEffects 里定义）。 */
  anim: string
  /** 最小元素尺寸。 */
  sizeMin: number
  /** 最大元素尺寸。 */
  sizeMax: number
}

/** 皮肤 id → 装饰规格（与 FANREN §二/§三 及 LOL 系列背景图层对应）。 */
const DECOR: Record<string, DecorSpec> = {
  'mupeiling-blossom': { prefix: 'petal', colors: ['#ED93B1', '#D4537E', '#F4C0D1'], count: 14, anim: 'fx-fall', sizeMin: 6, sizeMax: 13 },
  'hanli-daoist': { prefix: 'bamboo-leaf', colors: ['#C0DD97', '#97C459', '#639922'], count: 9, anim: 'fx-fall-slow', sizeMin: 8, sizeMax: 14 },
  'yinyue-lunar': { prefix: 'star', colors: ['#FFFFFF', '#B5D4F4'], count: 16, anim: 'fx-twinkle', sizeMin: 2, sizeMax: 5 },
  'nangongwan-moon': { prefix: 'plum', colors: ['#E8E6E0', '#D3D1C7', '#FFFFFF'], count: 12, anim: 'fx-fall-slow', sizeMin: 5, sizeMax: 11 },
  'ziling-mystic': { prefix: 'zixia', colors: ['#AFA9EC', '#7F77DD', '#FBBF24'], count: 10, anim: 'fx-drift', sizeMin: 3, sizeMax: 9 },
  // 英雄联盟系列
  'seraphine-anthem': { prefix: 'note', colors: ['#C77DFF', '#A855F7', '#F0ABFC'], count: 15, anim: 'fx-twinkle', sizeMin: 3, sizeMax: 6 },
  'jinx-mayhem': { prefix: 'spark', colors: ['#22D3EE', '#F472B6', '#FDE68A'], count: 16, anim: 'fx-fall', sizeMin: 3, sizeMax: 7 },
  'lux-radiance': { prefix: 'mote', colors: ['#F5D76E', '#FFFFFF', '#FBBF24'], count: 18, anim: 'fx-twinkle', sizeMin: 2, sizeMax: 5 },
  'yasuo-gale': { prefix: 'windleaf', colors: ['#7FB8B4', '#0E9394', '#B7DEDB'], count: 12, anim: 'fx-fall-slow', sizeMin: 6, sizeMax: 12 },
  'vayne-nightfall': { prefix: 'moth', colors: ['#B3A7EC', '#8B7BD8', '#E6E1FA'], count: 10, anim: 'fx-fall-slow', sizeMin: 4, sizeMax: 8 },
  'ezreal-relicrun': { prefix: 'rune', colors: ['#E0A93B', '#2E86D9', '#F5D76E'], count: 14, anim: 'fx-twinkle', sizeMin: 3, sizeMax: 6 },
  'sona-etwahl': { prefix: 'chord', colors: ['#A88FD4', '#D4B36A', '#7C5CBF'], count: 13, anim: 'fx-drift', sizeMin: 4, sizeMax: 8 },
  'mf-bountyhunter': { prefix: 'shell', colors: ['#D9A441', '#E0405A', '#B45309'], count: 14, anim: 'fx-fall', sizeMin: 4, sizeMax: 8 },
  'ahri-ninefold': { prefix: 'foxflame', colors: ['#E86A92', '#F5C16C', '#F9A8D4'], count: 12, anim: 'fx-drift', sizeMin: 4, sizeMax: 9 },
  'kaisa-voidborn': { prefix: 'voidmoth', colors: ['#A78BFA', '#C4B0FD', '#7C3AED'], count: 11, anim: 'fx-drift', sizeMin: 4, sizeMax: 8 },
  // 梗文化系列（凉子→梁神的算力星尘）
  'liangshen': { prefix: 'token', colors: ['#4D6BFE', '#9DB1FF', '#FFD700'], count: 13, anim: 'fx-drift', sizeMin: 3, sizeMax: 7 },
}

/** 横幅纱罩：亮/暗各一套斜向渐变透明度（左浓右淡保文字可读）。 */
const VEIL_LIGHT = [0.86, 0.72, 0.38, 0.05] as const
const VEIL_DARK = [0.90, 0.78, 0.46, 0.08] as const

/** 暗色皮肤集合（其余带光标的皮肤按亮色纱罩）。 */
const DARK_SKINS = new Set(['yinyue-lunar', 'ziling-mystic', 'jinx-mayhem', 'vayne-nightfall', 'mf-bountyhunter', 'kaisa-voidborn', 'liangshen'])

/** 背景装饰的 base CSS（表驱动横幅 + 装饰结构，reduced-motion 由 JS 端控制）。 */
function buildDecorCss(): string {
  const rules: string[] = []
  // 纱罩基色直接取 PANEL_VEIL 的 base RGB（同一张表，不再重复维护）
  for (const skinId of Object.keys(PANEL_VEIL)) {
    const cssClass = SKIN_CURSORS[skinId]?.cssClass
    if (cssClass === undefined) continue
    const [a0, a1, a2, a3] = DARK_SKINS.has(skinId) ? VEIL_DARK : VEIL_LIGHT
    const c = PANEL_VEIL[skinId]?.base.join(' ') ?? ''
    rules.push(
      `body.${cssClass} {`,
      `  background-color: rgb(${c});`,
      `  background-image: linear-gradient(100deg, rgb(${c} / ${a0}) 0%, rgb(${c} / ${a1}) 30%, rgb(${c} / ${a2}) 55%, rgb(${c} / ${a3}) 100%), url('/skins/${skinId}/assets/bg.png');`,
      `  background-size: cover; background-position: center top; background-repeat: no-repeat; background-attachment: fixed;`,
      `}`,
    )
  }
  // 装饰层：全屏、不拦截鼠标、置于最前（容器只在皮肤激活期间存在）
  rules.push(
    `[data-xl-decor] {`,
    `  position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; overflow: hidden;`,
    `}`,
    `[data-xl-decor] i {`,
    `  position: absolute; display: block; opacity: .75; will-change: transform, opacity;`,
    `}`,
    // keyframes 无条件全局定义（media 包裹在部分环境下不生效，元素会停在
    // opacity:0 永不可见）；「停动画」由 JS 端 matchMedia 控制（reduce 时
    // 静态展示装饰元素，见 buildDecorContainer）。
    `@keyframes fx-fall { 0%{ transform: translateY(-6vh) rotate(0); opacity:0 } 8%{opacity:.9} 100%{ transform: translateY(104vh) rotate(360deg); opacity:0 } }`,
    `@keyframes fx-fall-slow { 0%{ transform: translateY(-6vh) rotate(0); opacity:0 } 10%{opacity:.85} 100%{ transform: translateY(104vh) rotate(-200deg); opacity:0 } }`,
    `@keyframes fx-twinkle { 0%,100%{ opacity:.15; transform: scale(.7) } 50%{ opacity:1; transform: scale(1.15) } }`,
    `@keyframes fx-drift { 0%{ transform: translate(8vw,104vh) scale(.6); opacity:0 } 12%{opacity:.8} 100%{ transform: translate(-8vw,-6vh) scale(1); opacity:0 } }`,
    `body.xl-skin-blossom [data-xl-decor] i{ border-radius:50% 0 50% 50% }`,
    `body.xl-skin-daoist [data-xl-decor] i, body.xl-skin-gale [data-xl-decor] i{ border-radius:2px 60% 2px 60% }`,
    `body.xl-skin-moon [data-xl-decor] i{ border-radius:50% }`,
    `body.xl-skin-bounty [data-xl-decor] i{ border-radius:2px }`,
    `body.xl-skin-voidborn [data-xl-decor] i{ border-radius:50% 0 50% 50% }`,
  )
  return rules.join('\n')
}

// ── 按钮特效（凡人 5 款手工规则 + LOL 10 款表驱动辉光/涟漪） ─────────────

/** LOL 系列按钮特效色：hover 外发光双色 + 点击涟漪描边（均取主题强调色）。 */
const LOL_BUTTON_FX: Record<string, { glow: [string, string]; ripple: string }> = {
  'xl-skin-anthem': { glow: ['rgb(168 85 247 / .35)', 'rgb(245 215 110 / .28)'], ripple: 'rgb(199 125 255 / .85)' },
  'xl-skin-mayhem': { glow: ['rgb(34 211 238 / .4)', 'rgb(244 114 182 / .3)'], ripple: 'rgb(34 211 238 / .85)' },
  'xl-skin-radiance': { glow: ['rgb(217 154 27 / .4)', 'rgb(245 215 110 / .32)'], ripple: 'rgb(217 154 27 / .8)' },
  'xl-skin-gale': { glow: ['rgb(14 147 148 / .4)', 'rgb(127 184 180 / .3)'], ripple: 'rgb(14 147 148 / .8)' },
  'xl-skin-nightfall': { glow: ['rgb(139 123 216 / .45)', 'rgb(230 225 250 / .25)'], ripple: 'rgb(139 123 216 / .85)' },
  'xl-skin-relicrun': { glow: ['rgb(46 134 217 / .4)', 'rgb(224 169 59 / .3)'], ripple: 'rgb(46 134 217 / .8)' },
  'xl-skin-etwahl': { glow: ['rgb(124 92 191 / .4)', 'rgb(212 179 106 / .3)'], ripple: 'rgb(124 92 191 / .8)' },
  'xl-skin-bounty': { glow: ['rgb(224 64 90 / .4)', 'rgb(217 164 65 / .32)'], ripple: 'rgb(224 64 90 / .85)' },
  'xl-skin-ninefold': { glow: ['rgb(232 106 146 / .4)', 'rgb(245 193 108 / .3)'], ripple: 'rgb(232 106 146 / .85)' },
  'xl-skin-voidborn': { glow: ['rgb(167 139 250 / .45)', 'rgb(124 58 237 / .3)'], ripple: 'rgb(167 139 250 / .85)' },
}

/**
 * 按钮特效 base CSS。
 * - 悬停光带：仅在不同皮肤语法下可见（因为 DSH 自带按钮不吃 class，第一版
 *   用全局 :is() 选择器覆盖在 body.xl-skin-* 下的 <button>）。
 * - 点击涟漪：由 JS 在 mousedown 注入 <span class="xl-ripple">，此处定义动画。
 * - 圆角有意差异：柔美系 14px / 道风 4px / 冷峻 2px（FANREN 文档写明勿改）。
 */
function buildButtonCss(): string {
  // animations: 'always' 时不包 media —— 系统 reduce 下也要播（设置项见 settings.ts）
  const wrapMedia = skinStudioSettings.get().animations !== 'always'
  return [
    wrapMedia ? `@media (prefers-reduced-motion: no-preference) {` : `/* animations: always — media guard omitted */`,
    `  /* 慕沛灵 · 灵气流动光带（hover） */`,
    `  body.xl-skin-blossom :is(button, [role="button"]) { border-radius: 14px; }`,
    `  body.xl-skin-blossom :is(button, [role="button"])::after {`,
    `    content:""; position:absolute; inset:0; border-radius:inherit;`,
    `    background-image: linear-gradient(110deg, transparent 30%, rgb(255 255 255 / .55) 50%, transparent 70%);`,
    `    background-size: 220% 100%; background-repeat:no-repeat; opacity:0;`,
    `    animation: xl-slide-sheen 0.55s linear; pointer-events:none;`,
    `  }`,
    `  body.xl-skin-blossom :is(button, [role="button"]):hover::after { opacity:1; }`,
    ``,
    `  /* 韩立 · 四角符文闪烁 + 辟邪神雷点击 */`,
    `  body.xl-skin-daoist :is(button, [role="button"]) { border-radius: 4px; font-family: "STKaiti","KaiTi",serif; }`,
    `  body.xl-skin-daoist :is(button, [role="button"])::before,`,
    `  body.xl-skin-daoist :is(button, [role="button"])::after {`,
    // content 只写在 hover 规则里：透明伪元素文本也会进入可访问名称（污染
    // 读屏与按名定位），非 hover 态不产出任何文本
    `    position:absolute; font-size:12px; color:#FBBF24;`,
    `    text-shadow:0 0 6px rgb(251 191 36 / .8); opacity:0; transition:opacity .2s; pointer-events:none;`,
    `  }`,
    `  body.xl-skin-daoist :is(button, [role="button"]):hover::before { content:"雷"; opacity:1; left:3px; top:-6px; }`,
    `  body.xl-skin-daoist :is(button, [role="button"]):hover::after { content:"符"; opacity:1; right:3px; bottom:-6px; }`,
    ``,
    `  /* 银月 · 星辉流转（box-shadow 模拟） */`,
    `  body.xl-skin-lunar :is(button, [role="button"]) { border-radius: 14px; }`,
    `  body.xl-skin-lunar :is(button, [role="button"]):hover {`,
    `    box-shadow: 0 0 6px rgb(181 212 244 / .6), 4px -2px 8px rgb(255 255 255 / .5) inset, -4px 2px 8px rgb(133 183 235 / .4) inset;`,
    `  }`,
    ``,
    `  /* 南宫婉 · 月华光带 + 朱雀火纹点击（#E24B4A） */`,
    `  body.xl-skin-moon :is(button, [role="button"]) { border-radius: 2px; font-family: "STSong","SimSun",serif; }`,
    `  body.xl-skin-moon :is(button, [role="button"])::after {`,
    `    content:""; position:absolute; left:0; right:0; height:2px; opacity:0;`,
    `    background:linear-gradient(90deg, transparent, rgb(251 191 36 / .8), transparent);`,
    `    transition:opacity .2s; pointer-events:none;`,
    `  }`,
    `  body.xl-skin-moon :is(button, [role="button"]):hover::after { opacity:1; }`,
    `  body.xl-skin-moon :is(button, [role="button"])::after { top:-2px; }`,
    ``,
    `  /* 紫灵 · 紫霞光带 */`,
    `  body.xl-skin-mystic :is(button, [role="button"]) { border-radius: 14px; }`,
    `  body.xl-skin-mystic :is(button, [role="button"])::after {`,
    `    content:""; position:absolute; inset:0; border-radius:inherit;`,
    `    background: linear-gradient(90deg, transparent 25%, rgb(175 169 236 / .5) 50%, transparent 75%);`,
    `    background-size:200% 100%; background-repeat:no-repeat; opacity:0;`,
    `    animation: xl-slide-sheen 0.6s linear; pointer-events:none;`,
    `  }`,
    `  body.xl-skin-mystic :is(button, [role="button"]):hover::after { opacity:1; }`,
    ``,
    `  /* 英雄联盟系列 · 神话辉光（表驱动，色取各主题强调色） */`,
    ...Object.entries(LOL_BUTTON_FX).map(([c, fx]) =>
      `  body.${c} :is(button, [role="button"]):hover { box-shadow: 0 0 12px ${fx.glow[0]}, 0 0 22px ${fx.glow[1]}; }`),
    ``,
    `  @keyframes xl-slide-sheen { 0%{ background-position: 200% 0 } 100%{ background-position: -100% 0 } }`,
    ``,
    `  /* 点击涟漪（JS 注入 .xl-ripple） */`,
    `  body.xl-skin-blossom :is(button, [role="button"]) .xl-ripple{ border:2px solid rgb(237 147 177 / .8); }`,
    `  body.xl-skin-lunar :is(button, [role="button"]) .xl-ripple,`,
    `  body.xl-skin-moon :is(button, [role="button"]) .xl-ripple{ border:2px solid rgb(226 75 74 / .8); }`,
    `  body.xl-skin-mystic :is(button, [role="button"]) .xl-ripple{ border:2px solid rgb(175 169 236 / .85); }`,
    ...Object.entries(LOL_BUTTON_FX).map(([c, fx]) =>
      `  body.${c} :is(button, [role="button"]) .xl-ripple{ border:2px solid ${fx.ripple}; }`),
    `  .xl-ripple { position:absolute; pointer-events:none; border-radius:50%; transform:translate(-50%,-50%);`,
    `    animation: xl-ripple-out .45s ease-out forwards; }`,
    `  @keyframes xl-ripple-out { 0%{ width:10px;height:10px;opacity:.9 } 100%{ width:80px;height:80px;opacity:0 } }`,
    wrapMedia ? `}` : ``,
  ].join('\n')
}

/** 汇总注入的全局特效 CSS（光标 + 面板半透明 + 装饰结构 + 按钮）。 */
function buildGlobalCss(): string {
  return [
    buildCursorCss(),
    buildPanelVeilCss(),
    buildDialogVeilCss(),
    buildDecorCss(),
    buildButtonCss(),
    buildGlassCss(),
    // 按钮伪元素定位需 relative 容器：不强制改 DSH，这里给皮肤中心自己的按钮容器
    `[data-dsh-skin-studio] :is(button,[role="button"]){ position:relative; overflow:hidden; }`,
  ].join('\n')
}

// ── 磨玻璃工作区（全皮肤背景图 + 档位联动 + backdrop-blur） ──────────

/** 各皮肤的基础背景图层（全部 18 款；梁神走分档表）。 */
const GLASS_BG: Record<string, string> = {
  'hanli-daoist': '/skins/hanli-daoist/assets/bg.png',
  'mupeiling-blossom': '/skins/mupeiling-blossom/assets/bg.png',
  'yinyue-lunar': '/skins/yinyue-lunar/assets/bg.png',
  'nangongwan-moon': '/skins/nangongwan-moon/assets/bg.png',
  'ziling-mystic': '/skins/ziling-mystic/assets/bg.png',
  'seraphine-anthem': '/skins/seraphine-anthem/assets/bg.png',
  'jinx-mayhem': '/skins/jinx-mayhem/assets/bg.png',
  'lux-radiance': '/skins/lux-radiance/assets/bg.png',
  'yasuo-gale': '/skins/yasuo-gale/assets/bg.png',
  'vayne-nightfall': '/skins/vayne-nightfall/assets/bg.png',
  'ezreal-relicrun': '/skins/ezreal-relicrun/assets/bg.png',
  'sona-etwahl': '/skins/sona-etwahl/assets/bg.png',
  'mf-bountyhunter': '/skins/mf-bountyhunter/assets/bg.png',
  'ahri-ninefold': '/skins/ahri-ninefold/assets/bg.png',
  'kaisa-voidborn': '/skins/kaisa-voidborn/assets/bg.png',
  'aurora': '/skins/aurora/assets/bg.png',
  'midnight': '/skins/midnight/assets/bg.png',
}

/** 有分档背景图（tiers/t{n}/bg.png，人物状态随档位递进）的皮肤；缺档由服务端回退原 bg。 */
const TIERED_BG_SKINS = new Set([
  'hanli-daoist', 'ahri-ninefold', 'liangshen',
  'mupeiling-blossom', 'yinyue-lunar', 'nangongwan-moon', 'ziling-mystic',
  'ezreal-relicrun', 'jinx-mayhem', 'kaisa-voidborn', 'lux-radiance',
  'mf-bountyhunter', 'seraphine-anthem', 'sona-etwahl', 'vayne-nightfall',
  'yasuo-gale',
])

/** 非分档皮肤的档位滤镜递进（朴素 → 原色 → 金气 → 辉煌）。 */
const TIER_BG_FILTERS: readonly string[] = [
  'brightness(0.92) saturate(0.9)',
  'none',
  'brightness(1.08) saturate(1.25) sepia(0.12)',
  'brightness(1.15) saturate(1.45) contrast(1.05)',
]

/**
 * 磨玻璃 CSS（全皮肤）：body::before fixed 铺背景图（独立层可加滤镜），
 * #root 提升到图之上；表面 token 半透明化（PANEL_VEIL 色表加 alpha）；
 * 布局大列 backdrop-blur。档位联动：分档图皮肤换图，其余按档位滤镜。
 */
function buildGlassCss(): string {
  if (!skinStudioSettings.get().glass) return ''
  const tier = effectiveTier()
  const rules: string[] = [
    `body[class*='xl-skin-'] { position: relative; }`,
    `body[class*='xl-skin-'] #root { position: relative; z-index: 1; }`,
  ]
  // 全皮肤并集（GLASS_BG + 分档皮肤）逐一铺背景层
  const allGlassSkins = [...Object.keys(GLASS_BG), ...TIERED_BG_SKINS]
  for (const skinId of allGlassSkins) {
    const v = SKIN_CURSORS[skinId]
    const veil = PANEL_VEIL[skinId]
    if (v === undefined || veil === undefined) continue
    const tiered = TIERED_BG_SKINS.has(skinId)
    // bgRev 参数：自定义背景上传后 bump，让浏览器立刻拉新图（CSS url 变化）
    const bgRev = skinStudioSettings.get().bgRev
    const bg = (tiered
      ? `/skins/${skinId}/assets/tiers/t${tier}/bg.png`
      : GLASS_BG[skinId] ?? '') + (bgRev > 0 ? `?v=${bgRev}` : '')
    // 分档图皮肤不加滤镜（图已按档位专门生成）；其余皮肤按档位滤镜递进
    const filter = tiered ? 'none' : TIER_BG_FILTERS[tier] ?? 'none'
    const rgba = (rgb: readonly number[], a: number): string =>
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`
    rules.push(
      `body.${v.cssClass}::before {`,
      `  content: ''; position: fixed; inset: 0; z-index: 0;`,
      `  background: url('${bg}') center/cover no-repeat;`,
      filter === 'none' ? '' : `  filter: ${filter};`,
      `}`,
      // 磨砂只做侧栏：半透明化 sidebar-fill（变量按最近祖先解析压过 body
      // 内联 token）；正文对话区的 bg-* token 保持皮肤实色，正常显示。
      `body.${v.cssClass} #root {`,
      `  --dsw-specific-sidebar-fill: ${rgba(veil.sidebar, 0.34)};`,
      `}`,
    )
  }
  // 不加 backdrop 模糊（用户要求纯透出无磨砂）：半透明面板直接透出背景图。
  return rules.join('\n')
}

// ── 挂载 / 卸载 ────────────────────────────────────────────────────────

/** 注入全局特效样式标签（幂等；返回清除函数）。 */
function injectGlobalCss(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (document.querySelector(`style[data-plugin-css='${CURSOR_STYLE_TAG}']`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = '@dsh-skin-studio/gallery'
  tag.dataset.pluginCss = CURSOR_STYLE_TAG
  tag.textContent = buildGlobalCss()
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

/** 创建一款皮肤的装饰元素（返回 DOM 容器，内含若干个动画子元素）。 */
function buildDecorContainer(skinId: string, isDark: boolean): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.dataset.xlDecor = '1'
  const specKey = Object.keys(DECOR).find(id => id === skinId)
  const spec = specKey !== undefined ? DECOR[specKey] : undefined
  if (spec === undefined) return wrap
  // 动画开关在 JS 端判（与吉祥物一致）：本环境 class 规则里的 animation
  // 会被 prefers-reduced-motion media 清覆；reduce 时改为静态展示装饰元素。
  // animations: 'always' 设置下忽略系统 reduce（见 settings.ts）。
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && skinStudioSettings.get().animations !== 'always'
  // 境界档位：装饰密度随档位递增（灵气越盛，漫天元素越多）
  const tierBoost = 1 + effectiveTier() * 0.6
  const count = Math.max(3, Math.round(spec.count * tierBoost))
  const sizeRange = spec.sizeMax - spec.sizeMin
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement('i')
    const size = spec.sizeMin + (sizeRange > 0 ? (Math.random() * sizeRange) : 0) + 1
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.left = `${Math.random() * 100}%`
    el.style.top = `${Math.random() * 100}%`
    el.style.background = spec.colors[Math.floor(Math.random() * spec.colors.length)] ?? '#fff'
    if (reduced) {
      el.style.opacity = '0.55'
    } else {
      el.style.opacity = '0'
      el.style.animation = `${spec.anim} ${4 + Math.random() * 6}s ${Math.random() * 8}s linear infinite`
    }
    if (isDark && spec.prefix === 'plum') {
      el.style.boxShadow = '0 0 4px rgb(255 255 255 / .25)'
    }
    wrap.appendChild(el)
  }
  return wrap
}

/** 维护 body.xl-skin-{id} class + 重建装饰层。 */
function applySkinClass(skinId: string, scheme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return
  const body = document.body
  // 清掉上一个皮肤 class
  for (const v of Object.values(SKIN_CURSORS)) body.classList.remove(v.cssClass)
  body.classList.remove('xl-cursor-click')

  // 更新装饰层
  document.querySelectorAll<HTMLDivElement>('[data-xl-decor]').forEach(n => n.remove())
  const visual = SKIN_CURSORS[skinId]
  if (visual === undefined) return
  body.classList.add(visual.cssClass)
  const wrap = buildDecorContainer(skinId, scheme === 'dark')
  // z-index 由注入的 CSS 提供（前景飘落层 2147483000），此处不再内联覆盖
  document.body.prepend(wrap)
}

// ── 点击态临时 class + 按钮涟漪 ─────────────────────────────────────────

/** 全局事件代理：mousedown → 光标点击态 + 注入按钮涟漪。 */
function installPointerFx(): () => void {
  if (typeof document === 'undefined') return () => {}
  const onDown = (e: MouseEvent): void => {
    if ((e.target as HTMLElement | null)?.closest?.('#root, body, [data-dsh-skin-studio]')) {
      // 全局 body 点击态（配合 body.xl-skin-*）
      document.body.classList.add('xl-cursor-click')
      // 按钮涟漪：仅在命中皮肤中心 UI 或皮肤 class 下的按钮时注入
      const btn = (e.target as HTMLElement | null)?.closest?.('button, [role="button"]')
      if (btn !== null && btn !== undefined) spawnRipple(btn as HTMLElement, e)
    }
  }
  const onUp = (): void => document.body.classList.remove('xl-cursor-click')
  const onLeave = (): void => document.body.classList.remove('xl-cursor-click')
  document.addEventListener('mousedown', onDown, true)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('blur', onLeave)
  return () => {
    document.removeEventListener('mousedown', onDown, true)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('blur', onLeave)
  }
}

/** 在按钮内注入涟漪 span（继承其圆角，纯 transform/opacity 动画）。 */
function spawnRipple(btn: HTMLElement, e: MouseEvent): void {
  const rect = btn.getBoundingClientRect()
  const d = Math.max(rect.width, rect.height) * 2.2
  const span = document.createElement('span')
  span.className = 'xl-ripple'
  const left = e.clientX - rect.left - 40
  const top = e.clientY - rect.top - 40
  span.style.left = `${left}px`
  span.style.top = `${top}px`
  span.style.width = '10px'
  span.style.height = '10px'
  btn.appendChild(span)
  window.setTimeout(() => { span.remove() }, 480)
}

/**
 * 皮肤特效层入口：订阅 theme/change 维护 body.xl-skin-* + 装饰 + 样式注入。
 * @returns 卸载函数（样式标签移除 + class 清空 + 事件解绑 + 装饰层移除）。
 */
export function mountSkinEffects(snapshotProvider: () => ThemeSnapshot | null,
  subscribe: (cb: (snap: ThemeSnapshot) => void) => () => void): () => void {
  if (typeof document === 'undefined') return () => {}
  let disposeCss = injectGlobalCss()
  const disposePointer = installPointerFx()

  const apply = (snap: ThemeSnapshot | null): void => {
    const active = snap?.active
    if (active === undefined) { applySkinClass('', 'light'); return }
    applySkinClass(active.id, active.colorScheme)
  }

  /** 重建特效层：CSS 标签（光标配色/动画策略）+ 装饰层（密度）。 */
  const rebuild = (): void => {
    disposeCss()
    disposeCss = injectGlobalCss()
    apply(snapshotProvider())
  }

  // 立即应用当前皮肤（若已激活）
  apply(snapshotProvider())
  const off = subscribe(apply)

  // 设置变化（动画策略 / 磨玻璃开关 / 光标开关 / 自定义背景版本）：重建 CSS + 重铺装饰层
  let lastAnimations = skinStudioSettings.get().animations
  let lastGlass = skinStudioSettings.get().glass
  let lastCursorFx = skinStudioSettings.get().cursorFx
  let lastBgRev = skinStudioSettings.get().bgRev
  const offSettings = skinStudioSettings.subscribe(s => {
    if (s.animations === lastAnimations && s.glass === lastGlass && s.cursorFx === lastCursorFx && s.bgRev === lastBgRev) return
    lastAnimations = s.animations
    lastGlass = s.glass
    lastCursorFx = s.cursorFx
    lastBgRev = s.bgRev
    rebuild()
  })

  // 境界档位变化：光标配色变体（CSS 重建）+ 装饰密度（重铺）
  const offTier = subscribeTier(() => { rebuild() })

  return () => {
    offTier()
    offSettings()
    off()
    disposePointer()
    disposeCss()
    applySkinClass('', 'light')
    document.querySelectorAll<HTMLDivElement>('[data-xl-decor]').forEach(n => n.remove())
  }
}
