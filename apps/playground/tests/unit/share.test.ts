import { describe, it, expect } from "vitest";
import { encodeShareState, decodeShareState } from "../../src/lib/share.ts";

describe("share", () => {
  it("round-trips code through encode/decode", () => {
    const state = { code: "const schema = z.string(); schema;" };
    const hash = encodeShareState(state);
    const decoded = decodeShareState(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.code).toBe(state.code);
  });

  it("preserves componentMap in round-trip", () => {
    const state = { code: "z.string();", map: "shadcn" as const };
    const hash = encodeShareState(state);
    const decoded = decodeShareState(hash);
    expect(decoded!.map).toBe("shadcn");
  });

  it("preserves activeTab in round-trip", () => {
    const state = { code: "z.string();", tab: "inspect" as const };
    const hash = encodeShareState(state);
    const decoded = decodeShareState(hash);
    expect(decoded!.tab).toBe("inspect");
  });

  it("defaults to 'default' map when not specified", () => {
    const state = { code: "z.string();" };
    const hash = encodeShareState(state);
    const decoded = decodeShareState(hash);
    expect(decoded!.map).toBe("default");
  });

  it("returns null for empty hash", () => {
    expect(decodeShareState("")).toBeNull();
    expect(decodeShareState("#")).toBeNull();
  });

  it("returns null for corrupt hash", () => {
    expect(decodeShareState("#code=!!!corrupt!!!")).toBeNull();
  });

  it("handles hash with leading #", () => {
    const state = { code: "z.number();" };
    const hash = encodeShareState(state);
    expect(hash.startsWith("#")).toBe(true);
    const decoded = decodeShareState(hash);
    expect(decoded).not.toBeNull();
  });
});
