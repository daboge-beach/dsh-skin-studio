# 🎨 DSH Skin Studio — 18 skins × 5 tiers × reasoning-effort sync (mascot + cursor + chime)

## What is this?

A DeepSeek Harness plugin that turns your terminal into a themed workspace:

- **18 skins** across 3 themes: League of Legends ×10, 凡人修仙传 (A Mortal's Journey) ×5, DeepSeek meme "Liang Shen" ×1, plus 2 minimal essentials
- **5-tier visual system** that follows your reasoning effort level — higher effort = higher character evolution
- **Full-screen mascot** that wanders your workspace, celebrates task completion, and drops programming quotes
- **Custom cursors, background music-free chimes, glassmorphism, and 200 bilingual quotes per character**

## Demo

![Demo GIF](https://github.com/daboge-beach/dsh-skin-studio/blob/main/docs/demo.gif)

## The killer feature: Reasoning-Effort Sync

Drag the tier slider under the message box and it **actually changes your model's reasoning effort** (via official `sessions.selectModel` — same path as the model menu). Switch to GLM-5.2 Max? Han Li ascends to Spirit Transformation. Switch to Low? Back to Qi Condensation.

| Series | Tier 1 → Tier 5 |
|---|---|
| 凡人修仙传 | 炼气 → 筑基 → 结丹 → 元婴 → **化神** |
| League of Legends | Base → Epic → Legendary → Ultimate → **Prestige** |
| Liang Shen (meme) | 凉子 → 梁子 → 梁圣 → 梁神 → **梁·AGI** |

Each tier has its own **background wallpaper, mascot sprite, cursor variant, and decoration density** — all AI-generated with gpt-image-2.

## Quick Start

```bash
# Clone + setup (auto-downloads 384MB of skin assets via Git LFS)
git clone https://github.com/daboge-beach/dsh-skin-studio.git
cd dsh-skin-studio && pnpm run setup

# Link the plugin into your DSH web profile
dsh plugin --profile web add ./packages/gallery
```

## Features at a glance

| Feature | Description |
|---|---|
| 🎨 18 skins × 5 tiers | 90+ AI-generated character backgrounds & sprites |
| 🔄 Effort sync | Slider ↔ real reasoning effort (official API) |
| 🐱 Mascot | Wanders, celebrates task completion, 200 bilingual quotes |
| 🖱️ Custom cursors | Per-skin tri-state + tier color variants |
| 🔔 Task-done alerts | Synthesized chime (guzheng/horn/ding) + mascot celebration |
| 📸 BG see-through | Character wallpaper with translucent panels |
| 🖼️ Custom backgrounds | Upload your own image per tier, crop/fit modes |
| ↩️ Factory reset | One click back to native DSH |
| 🌐 Bilingual | Full zh/en README, auto-detect UI language |

## Links

- **GitHub**: https://github.com/daboge-beach/dsh-skin-studio
- **Releases**: v0.5.0 with full changelog
- **CI**: GitHub Actions (87 tests, typecheck, build)
- **License**: MIT

---

*Made with 🎨 for the DeepSeek Harness community. The "Liang Shen" meme skin is a loving parody — cartoon caricature, not a real person's likeness.* 🙏
