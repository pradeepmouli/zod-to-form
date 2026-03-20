import { describe, it, expect } from "vitest";
import { evaluate } from "../../src/worker/evaluate.ts";

describe("evaluate", () => {
  it("extracts a valid Zod schema", () => {
    const result = evaluate('const schema = z.object({ name: z.string() }); return schema;');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schema).toBeDefined();
      expect("_zod" in result.schema).toBe(true);
    }
  });

  it("auto-returns the last expression via wrapLastExpression", () => {
    const result = evaluate('const schema = z.object({ name: z.string() });\nschema;');
    expect(result.ok).toBe(true);
  });

  it("rejects import statements", () => {
    const result = evaluate('import { z } from "zod";');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("import");
    }
  });

  it("rejects require statements", () => {
    const result = evaluate('const z = require("zod");');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("import");
    }
  });

  it("returns error for non-schema result", () => {
    const result = evaluate("return 42;");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("runtime");
      expect(result.error.message).toContain("Zod schema");
    }
  });

  it("returns error for runtime exceptions", () => {
    const result = evaluate("undefinedVar.foo;");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("runtime");
    }
  });

  it("provides z, zod, and core in scope", () => {
    const result = evaluate("return z.string();");
    expect(result.ok).toBe(true);
  });
});
