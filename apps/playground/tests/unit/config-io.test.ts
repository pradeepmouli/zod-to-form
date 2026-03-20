import { describe, it, expect } from "vitest";
import { importConfig, exportConfig } from "../../src/lib/config-io.ts";

describe("config-io", () => {
  it("imports valid JSON config", async () => {
    const json = JSON.stringify({ components: { text: "Input" }, fields: {} });
    const result = await importConfig(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.components).toEqual({ text: "Input" });
    }
  });

  it("returns error for invalid JSON", async () => {
    const result = await importConfig("not json{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid JSON");
    }
  });

  it("warns on unrecognized fields", async () => {
    const json = JSON.stringify({ components: {}, unknownField: true });
    const result = await importConfig(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("unknownField") || w.includes("validation"))).toBe(true);
    }
  });

  it("warns on invalid component type", async () => {
    const json = JSON.stringify({ components: "not-an-object" });
    const result = await importConfig(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.some((w) => w.includes("components"))).toBe(true);
    }
  });

  it("imports from File input", async () => {
    const json = JSON.stringify({ components: { select: "Select" } });
    const file = new File([json], "z2f.config.json", {
      type: "application/json",
    });
    const result = await importConfig(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.components).toEqual({ select: "Select" });
    }
  });

  it("round-trips through export/import", async () => {
    const config = { components: { a: "b" }, fields: { x: "y" } };
    const exported = exportConfig(config);
    const result = await importConfig(exported);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config).toEqual(config);
    }
  });
});
