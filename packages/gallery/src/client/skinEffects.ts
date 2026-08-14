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

/** 每款皮肤的视觉元数据：皮肤 class 后缀 + 光标文件名前缀 + 画布尺寸。 */
export interface SkinVisual {
  /** body 上的皮肤 class（`xl-skin-{cssClass}`）。 */
  cssClass: string
  /** assets/cursors/ 下三态文件的前缀。 */
  cursorPrefix: string
  /** 光标热点（pointer 尖端坐标，相对 32×32 画布）。 */
  hotspot: [number, number]
}

/** 凡人修仙传 5 款皮肤的光标元数据（aurora/midnight 无光标，跟随系统）。 */
export const SKIN_CURSORS: Record<string, SkinVisual> = {
  'mupeiling-blossom': { cssClass: 'xl-skin-blossom', cursorPrefix: 'blossom', hotspot: [16, 16] },
  'hanli-daoist': { cssClass: 'xl-skin-daoist', cursorPrefix: 'sword', hotspot: [11, 9] },
  'yinyue-lunar': { cssClass: 'xl-skin-lunar', cursorPrefix: 'moon', hotspot: [16, 15] },
  'nangongwan-moon': { cssClass: 'xl-skin-moon', cursorPrefix: 'hairpin', hotspot: [16, 4] },
  'ziling-mystic': { cssClass: 'xl-skin-mystic', cursorPrefix: 'veil', hotspot: [15, 12] },
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
  const rules: string[] = []
  for (const [skinId, v] of Object.entries(SKIN_CURSORS)) {
    const base = `/skins/${skinId}/assets/cursors`
    const [hx, hy] = v.hotspot
    // v.cssClass 已含 xl-skin- 前缀，此处不可再拼一层
    rules.push(
      `body.${v.cssClass} {`,
      `  cursor: url('${base}/${v.cursorPrefix}-default.svg') ${hx} ${hy}, auto;`,
      `}`,
      `body.${v.cssClass} :is(button, a, [role="button"], input, select, textarea, label, summary) {`,
      `  cursor: url('${base}/${v.cursorPrefix}-hover.svg') ${hx} ${hy}, pointer;`,
      `}`,
      `body.${v.cssClass}.xl-cursor-click :is(button, a, [role="button"], input, select, textarea, label, summary) {`,
      `  cursor: url('${base}/${v.cursorPrefix}-click.svg') ${hx} ${hy}, pointer;`,
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
  'mupeiling-blossom': { base: [251, 234, 240], layer1: [255, 255, 255], layer2: [244, 192, 209], sidebar: [251, 234, 240], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'hanli-daoist': { base: [234, 243, 222], layer1: [244, 248, 236], layer2: [192, 221, 151], sidebar: [234, 243, 222], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'yinyue-lunar': { base: [4, 44, 83], layer1: [12, 68, 124], layer2: [24, 95, 165], sidebar: [4, 44, 83], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
  'nangongwan-moon': { base: [241, 239, 232], layer1: [255, 255, 255], layer2: [211, 209, 199], sidebar: [241, 239, 232], aBase: 0.36, aSidebar: 0.80, aLayer1: 0.92, aLayer2: 0.85 },
  'ziling-mystic': { base: [38, 33, 92], layer1: [60, 52, 137], layer2: [83, 74, 183], sidebar: [38, 33, 92], aBase: 0.50, aSidebar: 0.82, aLayer1: 0.92, aLayer2: 0.86 },
}

/** 生成面板半透明 token 覆盖（作用域 body.xl-skin-* #root）。 */
function buildPanelVeilCss(): string {
  const rules: string[] = []
  for (const [skinId, v] of Object.entries(PANEL_VEIL)) {
    const cssClass = SKIN_CURSORS[skinId]?.cssClass
    if (cssClass === undefined) continue
    rules.push(
      `body.${cssClass} #root {`,
      `  --dsw-alias-bg-base: rgb(${v.base.join(' ')} / ${v.aBase});`,
      `  --dsw-alias-bg-layer-1: rgb(${v.layer1.join(' ')} / ${v.aLayer1});`,
      `  --dsw-alias-bg-layer-2: rgb(${v.layer2.join(' ')} / ${v.aLayer2});`,
      `  --dsw-specific-sidebar-fill: rgb(${v.sidebar.join(' ')} / ${v.aSidebar});`,
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

/** 皮肤 id → 装饰规格（与 FANREN §二/§三 背景图层对应）。 */
const DECOR: Record<string, DecorSpec> = {
  'mupeiling-blossom': { prefix: 'petal', colors: ['#ED93B1', '#D4537E', '#F4C0D1'], count: 14, anim: 'fx-fall', sizeMin: 6, sizeMax: 13 },
  'hanli-daoist': { prefix: 'bamboo-leaf', colors: ['#C0DD97', '#97C459', '#639922'], count: 9, anim: 'fx-fall-slow', sizeMin: 8, sizeMax: 14 },
  'yinyue-lunar': { prefix: 'star', colors: ['#FFFFFF', '#B5D4F4'], count: 16, anim: 'fx-twinkle', sizeMin: 2, sizeMax: 5 },
  'nangongwan-moon': { prefix: 'plum', colors: ['#E8E6E0', '#D3D1C7', '#FFFFFF'], count: 12, anim: 'fx-fall-slow', sizeMin: 5, sizeMax: 11 },
  'ziling-mystic': { prefix: 'zixia', colors: ['#AFA9EC', '#7F77DD', '#FBBF24'], count: 10, anim: 'fx-drift', sizeMin: 3, sizeMax: 9 },
}

/** 背景装饰的 base CSS（作用域在 body.xl-skin-* 下，reduced-motion 全关）。 */
function buildDecorCss(): string {
  return [
    // ── 主背景：人物立绘整页铺满 + 皮肤色斜向纱罩（FANREN §二「背景图层」）──
    // 竖版立绘 cover 在横屏会裁上下，position 偏上保住人物上半身；
    // 纱罩在中左侧（聊天栏）浓、右上淡出，文字可读且人物透出来。
    // background-color 为立绘加载前的渐变兜底。
    `body.xl-skin-blossom {`,
    `  background-color: #FDF3F7;`,
    `  background-image: linear-gradient(100deg, rgb(253 243 247 / .86) 0%, rgb(253 243 247 / .72) 30%, rgb(253 243 247 / .38) 55%, rgb(253 243 247 / .05) 100%), url('/skins/mupeiling-blossom/assets/bg.png');`,
    `  background-size: cover; background-position: center top; background-repeat: no-repeat; background-attachment: fixed;`,
    `}`,
    `body.xl-skin-daoist {`,
    `  background-color: #F4F8EC;`,
    `  background-image: linear-gradient(100deg, rgb(244 248 236 / .86) 0%, rgb(244 248 236 / .72) 30%, rgb(244 248 236 / .38) 55%, rgb(244 248 236 / .05) 100%), url('/skins/hanli-daoist/assets/bg.png');`,
    `  background-size: cover; background-position: center top; background-repeat: no-repeat; background-attachment: fixed;`,
    `}`,
    `body.xl-skin-lunar {`,
    `  background-color: #0F1B2E;`,
    `  background-image: linear-gradient(100deg, rgb(15 27 46 / .90) 0%, rgb(15 27 46 / .78) 32%, rgb(15 27 46 / .46) 58%, rgb(15 27 46 / .08) 100%), url('/skins/yinyue-lunar/assets/bg.png');`,
    `  background-size: cover; background-position: center top; background-repeat: no-repeat; background-attachment: fixed;`,
    `}`,
    `body.xl-skin-moon {`,
    `  background-color: #FAFAFA;`,
    `  background-image: linear-gradient(100deg, rgb(250 250 250 / .86) 0%, rgb(250 250 250 / .72) 30%, rgb(250 250 250 / .38) 55%, rgb(250 250 250 / .05) 100%), url('/skins/nangongwan-moon/assets/bg.png');`,
    `  background-size: cover; background-position: center top; background-repeat: no-repeat; background-attachment: fixed;`,
    `}`,
    `body.xl-skin-mystic {`,
    `  background-color: #221A2E;`,
    `  background-image: linear-gradient(100deg, rgb(34 26 46 / .90) 0%, rgb(34 26 46 / .78) 32%, rgb(34 26 46 / .46) 58%, rgb(34 26 46 / .08) 100%), url('/skins/ziling-mystic/assets/bg.png');`,
    `  background-size: cover; background-position: center top; background-repeat: no-repeat; background-attachment: fixed;`,
    `}`,
    // 装饰层：全屏、不拦截鼠标、置于最前（前景飘落，不被应用面板遮住）
    `body.xl-skin-blossom [data-xl-decor], body.xl-skin-daoist [data-xl-decor], `,
    `body.xl-skin-lunar [data-xl-decor], body.xl-skin-moon [data-xl-decor], body.xl-skin-mystic [data-xl-decor] {`,
    `  position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; overflow: hidden;`,
    `}`,
    `body.xl-skin-blossom [data-xl-decor] i, body.xl-skin-daoist [data-xl-decor] i, `,
    `body.xl-skin-lunar [data-xl-decor] i, body.xl-skin-moon [data-xl-decor] i, body.xl-skin-mystic [data-xl-decor] i {`,
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
    `body.xl-skin-daoist [data-xl-decor] i{ border-radius:2px 60% 2px 60% }`,
    `body.xl-skin-moon [data-xl-decor] i{ border-radius:50% }`,
  ].join('\n')
}

// ── 按钮特效（第一版：作用在皮肤中心自身 UI + body.xl-skin-* 全局选择器） ──

/**
 * 按钮特效 base CSS。
 * - 悬停光带：仅在不同皮肤语法下可见（因为 DSH 自带按钮不吃 class，第一版
 *   用全局 :is() 选择器覆盖在 body.xl-skin-* 下的 <button>）。
 * - 点击涟漪：由 JS 在 mousedown 注入 <span class="xl-ripple">，此处定义动画。
 * - 圆角有意差异：柔美系 14px / 道风 4px / 冷峻 2px（FANREN 文档写明勿改）。
 */
function buildButtonCss(): string {
  return [
    `@media (prefers-reduced-motion: no-preference) {`,
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
    `    content:"雷"; position:absolute; font-size:12px; color:#FBBF24;`,
    `    text-shadow:0 0 6px rgb(251 191 36 / .8); opacity:0; transition:opacity .2s; pointer-events:none;`,
    `  }`,
    `  body.xl-skin-daoist :is(button, [role="button"])::before { left:3px; top:-6px; }`,
    `  body.xl-skin-daoist :is(button, [role="button"])::after { right:3px; bottom:-6px; content:"符"; }`,
    `  body.xl-skin-daoist :is(button, [role="button"]):hover::before,`,
    `  body.xl-skin-daoist :is(button, [role="button"]):hover::after { opacity:1; }`,
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
    `  @keyframes xl-slide-sheen { 0%{ background-position: 200% 0 } 100%{ background-position: -100% 0 } }`,
    ``,
    `  /* 点击涟漪（JS 注入 .xl-ripple） */`,
    `  body.xl-skin-blossom :is(button, [role="button"]) .xl-ripple{ border:2px solid rgb(237 147 177 / .8); }`,
    `  body.xl-skin-lunar :is(button, [role="button"]) .xl-ripple,`,
    `  body.xl-skin-moon :is(button, [role="button"]) .xl-ripple{ border:2px solid rgb(226 75 74 / .8); }`,
    `  body.xl-skin-mystic :is(button, [role="button"]) .xl-ripple{ border:2px solid rgb(175 169 236 / .85); }`,
    `  .xl-ripple { position:absolute; pointer-events:none; border-radius:50%; transform:translate(-50%,-50%);`,
    `    animation: xl-ripple-out .45s ease-out forwards; }`,
    `  @keyframes xl-ripple-out { 0%{ width:10px;height:10px;opacity:.9 } 100%{ width:80px;height:80px;opacity:0 } }`,
    `}`,
  ].join('\n')
}

/** 汇总注入的全局特效 CSS（光标 + 面板半透明 + 装饰结构 + 按钮）。 */
function buildGlobalCss(): string {
  return [
    buildCursorCss(),
    buildPanelVeilCss(),
    buildDecorCss(),
    buildButtonCss(),
    // 按钮伪元素定位需 relative 容器：不强制改 DSH，这里给皮肤中心自己的按钮容器
    `[data-dsh-skin-studio] :is(button,[role="button"]){ position:relative; overflow:hidden; }`,
  ].join('\n')
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
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const sizeRange = spec.sizeMax - spec.sizeMin
  for (let i = 0; i < spec.count; i += 1) {
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
  const disposeCss = injectGlobalCss()
  const disposePointer = installPointerFx()

  const apply = (snap: ThemeSnapshot | null): void => {
    const active = snap?.active
    if (active === undefined) { applySkinClass('', 'light'); return }
    applySkinClass(active.id, active.colorScheme)
  }

  // 立即应用当前皮肤（若已激活）
  apply(snapshotProvider())
  const off = subscribe(apply)

  return () => {
    off()
    disposePointer()
    disposeCss()
    applySkinClass('', 'light')
    document.querySelectorAll<HTMLDivElement>('[data-xl-decor]').forEach(n => n.remove())
  }
}
