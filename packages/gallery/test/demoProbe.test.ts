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
    expect(themes.length).toBe(9);
    const list = await skinRegistry.list("builtin");
    expect(list.length).toBe(7);
  });
});
