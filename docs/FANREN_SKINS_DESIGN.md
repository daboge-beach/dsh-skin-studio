# 凡人修仙传主题皮肤系统 · 前端开发需求

> **给前端 AI 的话**：本文档是"凡人修仙传"主题皮肤系统的完整设计方案。所有角色形象、配色、光标、特效均依据原著小说描写设计，已附设计图。请严格按本方案实现，不要自行替换角色或配色。

---

## 一、设计概览

**主题**：国风仙侠 · 凡人修仙传
**套数**：5 套角色皮肤
**统一基调**：国风仙侠，所有皮肤的背景/光标/按钮都围绕这一美学

| # | 皮肤名 | 核心角色 | 配色系 | colorScheme |
|---|---|---|---|---|
| 1 | `mupeiling-blossom` | 慕沛灵 | 粉白国风 · 桃花薄雾 | light |
| 2 | `hanli-daoist` | 韩立 | 青绿道风 · 翠竹雷光 | light |
| 3 | `yinyue-lunar` | 银月 | 银蓝仙光 · 月华冷辉 | dark |
| 4 | `nangongwan-moon` | 南宫婉 | 月白清辉 · 朱雀赤纹 | light |
| 5 | `ziling-mystic` | 紫灵 | 暗紫妖魅 · 紫纱流霞 | dark |

---

## 二、每套皮肤的完整设计

### 皮肤 1 · 慕沛灵 `mupeiling-blossom`

**角色依据**：越国慕家嫡女，落云宗药园女修，容貌秀丽，一袭红粉色长裙外搭轻薄纱衣，气质孤高冷艳又带柔情。

#### 配色（粉白国风）

```css
:root {
  --xl-bg-base:          #FBEAF0;   /* 桃花薄雾底色 */
  --xl-bg-layer-1:       #FFFFFF;   /* 雪白卡片 */
  --xl-bg-layer-2:       #F4C0D1;   /* 粉纱层 */
  --xl-border-l1:        #F4C0D1;
  --xl-border-l2:        #ED93B1;
  --xl-brand-primary:    #D4537E;   /* 桃花主色 */
  --xl-brand-hover:      #ED93B1;
  --xl-label-primary:    #993556;   /* 深玫红文字 */
  --xl-label-secondary:  #C77B98;
  --xl-state-success:    #10b981;
  --xl-state-warning:    #FBBF24;
  --xl-state-error:      #E24B4A;
}
```

#### 鼠标光标（花瓣法宝）

依据：慕沛灵修仙家族出身，设定为花瓣形本命法宝。

- **默认态**：五瓣花形，粉色半透明花瓣围绕深粉花蕊（SVG `cursor: url(blossom-default.svg), auto`）
- **悬停态**：花瓣外环出现旋转虚线光圈，花瓣颜色加深（CSS `:hover` 时切换 `cursor: url(blossom-hover.svg), pointer`）
- **点击态**：点击瞬间花瓣向外绽放，三层涟漪扩散（JS 监听 `mousedown` 注入临时 DOM，300ms 后移除）

#### 按钮特效（灵气流动 + 涟漪）

- **圆角**：`border-radius: 14px`（柔美系）
- **悬停**：按钮内部出现流动的白色光带（CSS `@keyframes` 平移 `background-position`）
- **点击**：从点击点向外扩散两层粉色涟漪（JS 注入 `.ripple` 元素，`@keyframes scale + opacity`）
- **禁用**：整体 `opacity: 0.4`，文字变灰粉

#### 背景图层

- **主背景**：桃花林水墨画风格的渐变背景，浅粉到米白
- **装饰元素**：缓慢飘落的桃花花瓣（CSS 动画，10-15 片花瓣不同速度下落）
- **侧边栏**：半透明粉纱效果（`backdrop-filter: blur(8px)`）

---

### 皮肤 2 · 韩立 `hanli-daoist`

**角色依据**：天南越国青牛镇人，相貌普通皮肤黝黑，一袭青袍，本命法宝青竹蜂云剑（七十二把金雷竹飞剑，含辟邪神雷），行事低调沉稳。

#### 配色（青绿道风）

```css
:root {
  --xl-bg-base:          #EAF3DE;   /* 竹林晨光 */
  --xl-bg-layer-1:       #F4F8EC;
  --xl-bg-layer-2:       #C0DD97;
  --xl-border-l1:        #C0DD97;
  --xl-border-l2:        #97C459;
  --xl-brand-primary:    #639922;   /* 青竹主色 */
  --xl-brand-hover:      #97C459;
  --xl-label-primary:    #3B6D11;   /* 深竹绿文字 */
  --xl-label-secondary:  #5F8A3D;
  --xl-state-success:    #639922;
  --xl-state-warning:    #FBBF24;   /* 辟邪神雷金 */
  --xl-state-error:      #BA7517;
  --xl-accent-thunder:   #FBBF24;   /* 金雷光专属 */
}
```

#### 鼠标光标（青竹蜂云剑）

依据：韩立本命法宝，金雷竹所制，翠绿色剑身泛金雷光。

- **默认态**：斜置竹剑指针，翠绿剑身 + 深绿剑锋（SVG 矢量）
- **悬停态**：剑身叠加金色雷纹光晕（`hover` 时切换带金光的 cursor）
- **点击态**：剑尖迸发三道金色剑气（`mousedown` 注入 SVG 动画，金光线段从剑尖向外发散）

#### 按钮特效（符文闪烁 + 辟邪神雷）

- **圆角**：`border-radius: 4px`（**直角道风**，区别于柔美系）
- **悬停**：按钮四角出现金色篆体"雷""符"等字符，闪烁淡入淡出（CSS `::before/::after` + `@keyframes opacity`）
- **点击**：按钮边缘迸发金色雷电波纹（上下两条金色折线波，参考设计图）
- **字体**：按钮文字用 `font-family: "STKaiti", "KaiTi", serif`（楷体增强道风）

#### 背景图层

- **主背景**：青竹林水墨风，深浅绿渐变
- **装饰元素**：偶尔飘落的竹叶（CSS 动画，频率比桃花低，更"静"）
- **侧边栏**：竹简纹理背景（SVG pattern）

---

### 皮肤 3 · 银月 `yinyue-lunar`

**角色依据**：灵界银月狼族公主，青竹蜂云剑器灵，银发灵动兽耳，可化兽耳少女/白衣少妇/银狐等多形态，神秘空灵。

#### 配色（银蓝仙光）

```css
:root {
  --xl-bg-base:          #0F1B2E;   /* 深夜空 */
  --xl-bg-layer-1:       #1E2D4A;
  --xl-bg-layer-2:       #2D4068;
  --xl-border-l1:        #378ADD;
  --xl-border-l2:        #85B7EB;
  --xl-brand-primary:    #B5D4F4;   /* 月华银蓝 */
  --xl-brand-hover:      #85B7EB;
  --xl-label-primary:    #E6F1FB;
  --xl-label-secondary:  #85B7EB;
  --xl-state-success:    #5DCAA5;
  --xl-state-warning:    #FBBF24;
  --xl-state-error:      #F0997B;
  --xl-accent-star:      #FFFFFF;   /* 星辉白 */
}
```

#### 鼠标光标（月牙法器）

依据：银月之名与月相相关，设定为月牙形法器。

- **默认态**：上弦月形法器，银蓝填充 + 蓝色描边
- **悬停态**：月牙周围出现星辉环绕（虚线圆圈 + 散布的白色星点）
- **点击态**：月光从月牙向下迸射三道银白色光柱

#### 按钮特效（星辉流转 + 冰晶扩散）

- **圆角**：`border-radius: 14px`（柔美系）
- **悬停**：按钮表面出现缓慢移动的白色星点（3-5 个 `box-shadow` 模拟星辉）
- **点击**：从中心向外扩散六角冰晶图案（SVG 雪花 + `scale + opacity` 动画）

#### 背景图层

- **主背景**：深夜空渐变（深蓝到近黑），顶部有银河光带
- **装饰元素**：缓慢闪烁的星点（CSS `@keyframes opacity` 随机延迟），偶尔有流星划过
- **侧边栏**：半透明深蓝玻璃效果

---

### 皮肤 4 · 南宫婉 `nangongwan-moon`

**角色依据**：掩月宗元婴大修士，韩立正牌道侣，被誉为"冰山仙子"。墨发如瀑，白玉簪挽发，冰肌玉骨，本命法宝朱雀环。

#### 配色（月白清辉 + 朱雀赤纹）

```css
:root {
  --xl-bg-base:          #F1EFE8;   /* 月白宣纸 */
  --xl-bg-layer-1:       #FAFAFA;
  --xl-bg-layer-2:       #D3D1C7;
  --xl-border-l1:        #D3D1C7;
  --xl-border-l2:        #B4B2A9;
  --xl-brand-primary:    #5F5E5A;   /* 墨灰主色 */
  --xl-brand-hover:      #888780;
  --xl-label-primary:    #2C2C2A;   /* 浓墨文字 */
  --xl-label-secondary:  #5F5E5A;
  --xl-state-success:    #639922;
  --xl-state-warning:    #FBBF24;   /* 月华金 */
  --xl-state-error:      #E24B4A;   /* 朱雀赤 */
  --xl-accent-vermilion: #E24B4A;   /* 朱雀纹专属 */
}
```

#### 鼠标光标（白玉簪）

依据：南宫婉以白玉簪挽发，是她的标志性饰物。

- **默认态**：竖置白玉簪，椭圆簪身 + 顶部玉饰
- **悬停态**：玉簪周围出现金色月华环绕（虚线椭圆 + 顶部玉饰泛金光）
- **点击态**：玉饰瞬间闪现朱雀赤纹（红色短线条 + 顶部红色弧光，呼应朱雀环）

#### 按钮特效（月华流转 + 朱雀火纹）

- **圆角**：`border-radius: 2px`（**冷峻锐角**，区别于其他皮肤）
- **悬停**：按钮上下出现金色月华光带（椭圆光斑缓慢平移）
- **点击**：按钮上下边缘出现朱雀火纹（红色折线纹样，呼应朱雀环）
- **字体**：`font-family: "STSong", "SimSun", serif`（宋体增强古韵）

#### 背景图层

- **主背景**：月白宣纸质感，极淡的水墨远山
- **装饰元素**：寒梅飘落（白/灰花瓣，频率低，营造清冷感）
- **侧边栏**：纯白无装饰，极简冷峻

---

### 皮肤 5 · 紫灵 `ziling-mystic`

**角色依据**：真名汪凝，乱星海妙音门门主之女，全书第一美女。一袭紫衣，轻纱遮面，妩媚神秘，眼尾微挑带狡黠。

#### 配色（暗紫妖魅）

```css
:root {
  --xl-bg-base:          #1A1421;   /* 暗夜紫黑 */
  --xl-bg-layer-1:       #2D2238;
  --xl-bg-layer-2:       #443552;
  --xl-border-l1:        #534AB7;
  --xl-border-l2:        #7F77DD;
  --xl-brand-primary:    #AFA9EC;   /* 紫霞主色 */
  --xl-brand-hover:      #7F77DD;
  --xl-label-primary:    #E8E4F7;
  --xl-label-secondary:  #AFA9EC;
  --xl-state-success:    #5DCAA5;
  --xl-state-warning:    #FBBF24;
  --xl-state-error:      #D85A30;
  --xl-accent-stars:     #FBBF24;   /* 星辰金 */
}
```

#### 鼠标光标（紫纱面饰）

依据：紫灵以轻纱遮面登场，是她的标志性形象。

- **默认态**：水滴形紫纱面饰，半透明紫色 + 深紫描边
- **悬停态**：面饰周围出现流转的紫霞光圈（虚线圆 + 白色星点）
- **点击态**：从面饰中心向上迸发妙音声波（紫色波纹线条，呼应妙音门）

#### 按钮特效（紫霞流转 + 妙音声波）

- **圆角**：`border-radius: 14px`（柔美系）
- **悬停**：按钮表面出现紫色光带流转（两条曲线从左到右平移）
- **点击**：从按钮中心向外扩散两层紫色声波同心圆（呼应妙音门音律属性）

#### 背景图层

- **主背景**：暗紫到深黑的夜空渐变
- **装饰元素**：散落的金色星辰（静态星点 + 少量闪烁），偶有紫色流霞飘过
- **侧边栏**：半透明深紫纱幔效果

---

## 三、切换功能与过渡动画

### 切换入口

在皮肤中心画廊（`GalleryPanel`）点击任意皮肤卡片的"应用"按钮触发切换。

### 过渡动画规范

切换时**必须**有以下过渡，避免突兀：

```css
/* 1. 整体淡入淡出（400ms）*/
body {
  transition: background-color 400ms ease, color 400ms ease;
}

/* 2. CSS 变量平滑过渡（用 view-transitions API 或手动插值）*/
::view-transition-old(root) { animation: fade-out 300ms ease; }
::view-transition-new(root) { animation: fade-in 400ms ease; }

/* 3. 专属过渡特效：切换瞬间全屏一闪 */
.xl-transition-flash {
  position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  animation: flash 600ms ease-out;
}
@keyframes flash {
  0%   { opacity: 0; }
  30%  { opacity: 0.3; }   /* 全屏覆盖一层皮肤主色 */
  100% { opacity: 0; }
}
```

### 每套皮肤的切换专属特效

| 皮肤 | 切换瞬间全屏特效 |
|---|---|
| 慕沛灵 | 粉色花瓣从屏幕中心向外绽放 |
| 韩立 | 金色雷光从屏幕四角向中心聚拢 |
| 银月 | 银白月光从顶部向下倾泻 |
| 南宫婉 | 朱雀赤纹从屏幕中心向四周扩散 |
| 紫灵 | 紫色星辰从下向上升起 |

---

## 四、技术实现要点

### 1. CSS 变量命名

所有皮肤统一用 `--xl-*` 前缀（xianxia-linux / 仙侠主题），避免与 DSH 官方 `--dsw-*` 冲突。皮肤激活时，通过 `ctx.theme.overrideTokens()` 把 `--xl-*` 映射到对应的 `--dsw-alias-*`。

### 2. 光标资源

每套皮肤需要 3 个 SVG 文件（default/hover/click），打包到皮肤的 `assets/cursors/` 目录：

```
packages/skins/mupeiling-blossom/assets/cursors/
├── blossom-default.svg
├── blossom-hover.svg
└── blossom-click.svg
```

通过 CSS 加载：

```css
body.xl-skin-mupeiling {
  cursor: url('/skins/mupeiling-blossom/assets/cursors/blossom-default.svg'), auto;
}
body.xl-skin-mupeiling button:hover {
  cursor: url('/skins/mupeiling-blossom/assets/cursors/blossom-hover.svg'), pointer;
}
```

### 3. 背景装饰动画

所有飘落/闪烁动画用纯 CSS `@keyframes` 实现，**不依赖 JS 动画库**。性能要求：60fps，`transform` 和 `opacity` 优先。

### 4. 可访问性

- 所有动画包裹在 `@media (prefers-reduced-motion: no-preference)` 中
- 光标提供 fallback：`cursor: url(...), pointer`（最后是原生指针）
- 文字对比度满足 WCAG AA（4.5:1），暗色皮肤特别注意

---

## 五、文件结构

```
packages/skins/
├── mupeiling-blossom/
│   ├── skin.json
│   ├── src/index.ts          # ctx.theme.register()
│   ├── assets/
│   │   ├── cursors/          # 3 个光标 SVG
│   │   ├── background.svg    # 主背景
│   │   └── petals/           # 飘落花瓣素材
│   └── styles/
│       ├── tokens.css        # --xl-* 变量
│       ├── background.css    # 背景与装饰动画
│       └── buttons.css       # 按钮特效
├── hanli-daoist/             # 同结构
├── yinyue-lunar/
├── nangongwan-moon/
└── ziling-mystic/
```

---

## 六、验收标准

### 视觉验收

- [ ] 5 套皮肤切换后，整体配色符合设计图
- [ ] 每套皮肤的光标三态正确（默认/悬停/点击）
- [ ] 按钮四态（默认/悬停/点击/禁用）特效符合设计
- [ ] 背景装饰动画流畅（桃花/竹叶/星点/寒梅/紫霞）
- [ ] 切换皮肤时有过渡动画 + 专属全屏一闪

### 角色还原度验收（重点）

- [ ] 慕沛灵皮肤：粉白国风，桃花元素，柔美
- [ ] 韩立皮肤：青绿道风，竹剑光标，直角按钮，金雷特效
- [ ] 银月皮肤：银蓝冷调，月牙光标，星辉特效
- [ ] 南宫婉皮肤：月白清辉 + 朱雀赤纹，白玉簪光标，锐角按钮
- [ ] 紫灵皮肤：暗紫妖魅，紫纱光标，妙音声波特效

### 性能验收

- [ ] 所有动画 60fps（Chrome DevTools Performance）
- [ ] 单个皮肤资源包 < 200KB（SVG 为主，不用位图）
- [ ] 切换皮肤 < 500ms 完成过渡

---

## 七、给前端 AI 的提示

1. **所有角色形象、法宝、配色都已核实原著**，不要自行替换。如对角色设定有疑问，先问我。
2. **光标和按钮特效是核心差异化**，请仔细对照设计图实现，不要简化成"换个颜色"。
3. **圆角差异是有意的**：柔美系 rx14、道风系 rx4、冷峻系 rx2，这本身是角色性格的视觉表达。
4. **背景动画用 CSS 不用 JS**，保证性能和可维护性。
5. **字体搭配**：韩立用楷体、南宫婉用宋体，增强国风感；其他三套用默认无衬线即可。
