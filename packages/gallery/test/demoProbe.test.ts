import { describe, it, expect } from "vitest";
import { createMockHost } from "../dev/mockHost.ts";
import { apply as applyGallery } from "../src/client/index.ts";
import { skinRegistry } from "../src/client/registry/skinRegistry.ts";
import { BUILTIN_SKINS } from "../src/client/registry/builtinSkins.ts";

describe("demo wiring probe", () => {
  it("registers builtins and lists them", async () => {
    const host = createMockHost([]);
    applyGallery(host.ctx);
    const themes = host.ctx.theme.getTheme().themes.map(t => t.id);
    expect(themes).toContain("mupeiling-blossom");
    // 与内置清单完全耦合：每款内置皮肤都必须注册成主题（含官方款则只多不少）
    expect(themes.length).toBeGreaterThanOrEqual(BUILTIN_SKINS.length);
    for (const skin of BUILTIN_SKINS) {
      expect(themes, skin.id).toContain(skin.id);
    }
    const list = await skinRegistry.list("builtin");
    expect(list.map(s => s.id)).toEqual(BUILTIN_SKINS.map(s => s.id));
  });
});
