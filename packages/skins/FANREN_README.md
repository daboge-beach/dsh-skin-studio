# 凡人修仙传皮肤系列 · 使用指南

> 国风仙侠主题皮肤 5 连发：慕沛灵 / 韩立 / 银月 / 南宫婉 / 紫灵

## 皮肤清单

| 皮肤 id | 名称 | 风格 | 明暗 | 吉祥物动画 |
|---------|------|------|------|-----------|
| `mupeiling-blossom` | 慕沛灵 · 桃夭 | 粉白国风 · 桃花薄雾 | light | 饮茶 |
| `hanli-daoist` | 韩立 · 青竹 | 青绿道风 · 翠竹雷光 | light | 舞剑 |
| `yinyue-lunar` | 银月 · 月华 | 银蓝仙光 · 月华冷辉 | dark | 跳舞 |
| `nangongwan-moon` | 南宫婉 · 寒梅 | 月白清辉 · 朱雀赤纹 | light | 抚琴 |
| `ziling-mystic` | 紫灵 · 紫霞 | 暗紫妖魅 · 紫纱流霞 | dark | 打坐 |

每套皮肤包含：

```
packages/skins/{skin-id}/
├── skin.json          # 皮肤清单（palette + assets 声明）
├── package.json       # npm 包定义（dsh.client.inject）
├── src/index.ts       # ctx.theme.register() 注册入口
├── preview.png        # 画廊缩略图（800×600）
└── assets/
    ├── hero.png       # 角色立绘（1024×1536）
    ├── preview.png    # 缩略图副本
    └── sprite_anim.png # 4 帧吉祥物动画（1536×1536，2×2 网格）
```

## 安装

```bash
# 在 dsh-skin-studio monorepo 内
pnpm install
pnpm --filter @dsh-skin-studio/skin-mupeiling-blossom build

# 注册到 DSH
dsh plugin add @dsh-skin-studio/skin-mupeiling-blossom
```

或直接在 DSH 设置里通过 Skin Studio 画廊一键试穿/应用。

## 切换皮肤

```bash
dsh theme set mupeiling-blossom
dsh theme set hanli-daoist
```

## 设计文档

- 完整设计方案（配色/光标/按钮特效）：`docs/FANREN_SKINS_DESIGN.md`
- 角色设定档案：`docs/FANREN_CHARACTERS.md`
- 前端实现需求：`docs/FRONTEND_REQUIREMENTS.md`

## 吉祥物动画说明

`sprite_anim.png` 为 2×2 网格的 4 帧动画，前端用 CSS `background-position` 步进切帧：

```css
.mascot {
  width: 128px;
  height: 128px;
  background-size: 256px 256px;
  animation: mascot-loop 1.2s steps(1) infinite;
}
@keyframes mascot-loop {
  0%   { background-position: 0% 0%; }
  25%  { background-position: 100% 0%; }
  50%  { background-position: 0% 100%; }
  75%  { background-position: 100% 100%; }
}
```

## 声明

本系列皮肤为个人欣赏用途创作的同人作品，基于忘语《凡人修仙传》世界观。若需公开发布，请先确认 IP 授权事宜。
