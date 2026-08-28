import { describe, it, expect } from "vitest";
import { createMockHost } from "../dev/mockHost.ts";
import { apply as applyGallery } from "../src/client/index.ts";
import { skinRegistry } from "../src/client/registry/skinRegistry.ts";

describe("demo wiring probe", () => {
  it("registers builtins and lists them", async () => {
    const host = createMockHost([]);
    applyGallery(host.ctx);
    const themes = host.ctx.theme.getTheme().themes.map(t => t.id);
    expect(themes).toContain("mupeiling-blossom");
    // 数量与内置清单解耦：主题 = builtin（18 基线 + 新增皮肤）+ 官方 light/dark/system
    expect(themes.length).toBeGreaterThanOrEqual(21);
    const list = await skinRegistry.list("builtin");
    expect(list.length).toBeGreaterThanOrEqual(18);
  });
});
