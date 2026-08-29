# 皮肤创作指南 · Skin Authoring Guide

> 从零到上架画廊的最短路径。10 分钟出骨架，剩下的是美术。

## 快速开始 / Quick Start

```bash
# 1. 生成皮肤包骨架（kebab-case id + 中文名）
pnpm gen:skin -- my-skin --name "我的皮肤" --scheme dark --primary "#6366f1" --author "你的名字"

# 2. 自动进画廊注册表（改 packages/gallery/.../builtinSkins.gen.ts）
pnpm gen:skin-data

# 3. 发布门禁校验（manifest / 预览图 / 资产 / 产物）
pnpm validate-skins

# 4. 打开 DSH，皮肤中心里就能看到并试穿
```

参数说明：

| 参数 | 必填 | 说明 |
|---|---|---|
| `<id>` | ✓ | kebab-case 目录名（`^[a-z][a-z0-9-]{1,62}[a-z0-9]$`） |
| `--name` | ✓ | 皮肤显示名（中文） |
| `--en` | | 英文名（缺省同 `--name`） |
| `--scheme` | | `dark`（默认）或 `light` |
| `--primary` | | 品牌色 `#RRGGBB`（缺省按色系给推荐值） |
| `--author` | | 作者署名（缺省 DSH Skin Studio） |

脚手架生成 `skin.json`（14 个 alias token 按 primary×色系自动推导）和
`assets/preview.png`（800×600 渐变占位图）。

## 目录结构 / Package Layout

```
packages/skins/my-skin/
├── skin.json              # manifest（唯一真源；tokens 由 gen-skin-data 消费）
└── assets/
    ├── preview.png        # 必需 800×600（4:3）画廊卡片缩略图
    ├── hero.png           # 可选 1024×1536 详情页竖版立绘
    ├── sprite_anim.png    # 可选 2×2 网格四帧吉祥物动画
    ├── cursors/           # 可选 三态光标（default/hover/click .svg，32×32）
    └── tiers/             # 可选 分档资产 t0-t4/{bg,hero,sprite_anim}.png
```

## 资产规格 / Asset Specs

| 资产 | 尺寸 | 说明 |
|---|---|---|
| `preview.png` | 800×600 | **必需**。真实渲染截图优于插画 |
| `hero.png` | 1024×1536 | 详情页大图；缺失回退纯色 |
| `sprite_anim.png` | 2×2 网格 | 四帧等分（左上→右上→左下→右下循环） |
| `cursors/*.svg` | 32×32 | `<前缀>-default/-hover/-click.svg`；热点指向图形尖端（详见现有皮肤） |
| `tiers/tN/*` | 同主资产 | 档位变体；缺档自动回退主资产 |

体积红线（validate-skins 强制）：单文件 ≤12MB，PNG 任一边 ≤7680px。
吉祥物语录（可选）：每语言 200 句，放 `src/client/quotes/<id>.ts` 后
`pnpm gen:quotes` 自动生成 `assets/quotes.json`。

## Token 表 / Tokens

`skin.json.tokens` 覆盖 DSH 的 alias token（缺项回退官方值）。核心五个：

```jsonc
{
  "--dsw-alias-bg-base":        "窗口底色",
  "--dsw-alias-bg-layer-1":     "卡片/气泡面",
  "--dsw-alias-brand-primary":  "品牌色（按钮/高亮/涟漪）",
  "--dsw-alias-label-primary":  "正文文字",
  "--dsw-alias-border-l1":      "一级描边"
}
```

其余九个（bg-layer-2 / bg-overlay / border-l2 / brand-hover /
label-secondary / state-error/success/warn / sidebar-fill）建议成对调整，
保持与核心五项同色温。完整语义见内置任意一款 skin.json。

## 单独分发（可选）/ Standalone Plugin

内置皮肤由画廊注册表统一注册，**不需要** `src/index.ts`。若想做成
独立 npm 包（脱离画廊在任意 DSH 上用），再加：

```
package.json      # dsh.client.inject: ["@deepseek-ai/dsh-client-ui-theme"]
src/index.ts      # ctx.theme.register({ id, colorScheme, tokens })
```

参考 `packages/skins/hanli-daoist/`。构建：`pnpm --filter <pkg> build`。

## 版权与免责 / IP & Disclaimer

- **同人定位**：涉及第三方 IP（英雄联盟 / 凡人修仙传 / 现实人物梗）的皮肤是社区
  同人创作，与权利方无任何隶属。请在皮肤包 `skin.json.description` 里如实标注
  灵感来源；**不要**在包名、标题里暗示官方合作
- **卡通演绎**：角色形象用 AI 生成或重绘的卡通风格，不使用官方原画/截图/拆包素材
- **现实人物**：以真实人物为梗的皮肤（如「梁神」）保持调侃但不贬损的卡通夸张，
  避免肖像化、错误暗示或令人误解的言论代言
- **可下架**：内容包与核心项目解耦——权利人异议时单个包可独立移除，不影响
  Skin Runtime 与其他皮肤
- 推荐新作者从**原创角色**起步（参考 aurora / midnight 的极简路线），作品寿命更长

## 性能预算 / Performance Budget

皮肤跑在宿主主线程上，预算是体验底线（`validate-skins` 强制加粗项）：

| 维度 | 预算 | 强制 |
|---|---|---|
| 单文件体积 | 建议 ≤6MB，**≤12MB** | ✓ error |
| PNG 像素 | 建议 ≤4096px，**≤7680px** | ✓ error |
| 皮肤包总量（zip） | 建议 ≤40MB，**≤50MB** | ✓ error（上传口） |
| 光标 | 32×32 SVG，静态（不用 SMIL/CSS 动画） | 建议 |
| 吉祥物 sprite | 2×2 四帧，动画由宿主按帧切换（非 GIF 循环） | 建议 |
| 同时动画 | 涟漪 / 装饰 / 吉祥物至多各一；尊重 prefers-reduced-motion | 建议 |
| 后台标签页 | 吉祥物漫步与装饰动画随 document.hidden 自动暂停 | 运行时行为 |

详情页/安装审阅会展示包体与图片清单（文件数 · 像素 · 体积），提交前先自查。

## 检查清单 / Checklist

- [ ] `pnpm gen:skin` 生成的骨架能过 `pnpm validate-skins`
- [ ] preview.png 换成真实渲染图（不再是占位渐变）
- [ ] 明暗两款对照检查过文字可读性（label-primary vs bg-base）
- [ ] 光标热点校准过（点击点在图形尖端，不在画布中心）
- [ ] 新增语录跑过 `pnpm gen:quotes`（若做了语录）
- [ ] 涉及第三方 IP 时已在 description 标注灵感来源（见版权与免责）
- [ ] 体积/像素在性能预算内（validate-skins 会拦）
- [ ] `pnpm build && pnpm test` 全绿，提交 PR

设计参考：`docs/SKIN_SPEC.md`（完整规范）、`docs/FANREN_SKINS_DESIGN.md`
与 `docs/LOL_SKINS_DESIGN.md`（现有系列的美术基准）。
