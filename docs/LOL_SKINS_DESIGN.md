# 英雄联盟英雄皮肤系列（10 款）

> v0.2 新增。视觉标准：**神话级皮肤质感**（参考 MVP 冠军系列的盔甲细节、
> 自发光粒子、体积光、电影级光影），出图模型 gpt-image-2（1536×1024 横幅 /
> 1024×1536 立绘 / 1024×1024 Q 版雪碧图，绿幕色键抠像成透明 PNG）。

## 一、皮肤清单

| id | 皮肤名 | 色系 | 主色 | 光标母题 | 前景装饰 |
| --- | --- | --- | --- | --- | --- |
| seraphine-anthem | 萨勒芬妮 · 星颂 | light | #A855F7 | 星光音符 | 音符星尘（闪烁） |
| jinx-mayhem | 金克斯 · 弹幕狂潮 | dark | #22D3EE | 鲨鱼火箭 | 弹幕火花（坠落） |
| lux-radiance | 拉克丝 · 光棱圣辉 | light | #D99A1B | 星光法杖 | 圣光光尘（闪烁） |
| yasuo-gale | 亚索 · 斩风疾影 | light | #0E9394 | 疾风刃 | 风叶（缓落） |
| vayne-nightfall | 维恩 · 夜狩 | dark | #8B7BD8 | 圣银弩箭 | 夜蛾银光（缓落） |
| ezreal-relicrun | 伊泽瑞尔 · 符文远征 | light | #2E86D9 | 符文护手 | 符文光粒（闪烁） |
| sona-etwahl | 娑娜 · 弦语仙音 | light | #7C5CBF | 竖琴拨 | 音符（上漂） |
| mf-bountyhunter | 厄运小姐 · 赏金女王 | dark | #E0405A | 金色弹头 | 金壳火雨（坠落） |
| ahri-ninefold | 阿狸 · 九尾魅影 | light | #E86A92 | 狐火宝珠 | 狐火（上漂） |
| kaisa-voidborn | 卡莎 · 虚空降临 | dark | #A78BFA | 虚空蝶 | 虚空蝶（上漂） |

## 二、每款皮肤的组成（与凡人系列完全同构）

- `skin.json` + `src/index.ts`：官方 ThemeRuntime token 表（14 项，弹层
  overlay 用主题底色）。
- `assets/bg.png`：整页横幅（人物居右 1/3、左侧雾化留白），配主题色斜向
  纱罩（skinEffects `BANNER_VEIL`，亮色 .86→.05 / 暗色 .90→.08）。
- `assets/hero.png` / `preview.png`：详情立绘 / 卡片缩略（bg 中心裁剪缩放）。
- `assets/sprite_anim.png`：Q 版吉祥物 2×2 四帧行走雪碧图（透明 PNG）。
- `assets/cursors/{prefix}-{default,hover,click}.svg`：三态光标（默认=母题
  +光晕、悬停=虚线环、点击=爆发射线）。
- 语录：`packages/gallery/src/client/quotes/{champ}.ts`，中/英各 200 句
  （英雄名台词风 + 程序员问候 8 条 + 修仙×码农跨界梗 + LOL 黄历组合句，
  词表拼 `lol-shared.ts` 公共宜忌）。
- 面板特效：神话辉光 hover（主题强调色外发光）+ 主题色点击涟漪。

## 三、出图 prompt 模板（gen/generate.mjs，仓库外工具）

- 横幅：`横幅网页背景插画，宽幅构图：画面右侧三分之一是人物（人设描述），
  左侧三分之二是朦胧留白场景（意境），整体低对比雾气感，中部偏左留白供
  界面文字叠加，不要文字/水印/边框。英雄联盟神话级皮肤质感（参考 MVP
  冠军系列）：盔甲与服饰细节精致华丽、自发光粒子特效、体积光、电影级
  光影、色彩层次丰富、超高画质、人物细节拉满。`
- 立绘：竖幅全身，人物居中占主体，背景虚化同意境。
- 雪碧图：2×2 四格 Q 版四帧行走 + 纯绿 #00FF00 背景，纯 node PNG 色键
  抠像（gen/codec.mjs：解码→绿幕透明→重编码）。

> 注：出图脚本与 API key 均在仓库外（E:\goodlookingDS\gen\ 与 imgkey.txt），
> key 不入库。
