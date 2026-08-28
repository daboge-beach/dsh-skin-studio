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

## 检查清单 / Checklist

- [ ] `pnpm gen:skin` 生成的骨架能过 `pnpm validate-skins`
- [ ] preview.png 换成真实渲染图（不再是占位渐变）
- [ ] 明暗两款对照检查过文字可读性（label-primary vs bg-base）
- [ ] 光标热点校准过（点击点在图形尖端，不在画布中心）
- [ ] 新增语录跑过 `pnpm gen:quotes`（若做了语录）
- [ ] `pnpm build && pnpm test` 全绿，提交 PR

设计参考：`docs/SKIN_SPEC.md`（完整规范）、`docs/FANREN_SKINS_DESIGN.md`
与 `docs/LOL_SKINS_DESIGN.md`（现有系列的美术基准）。
