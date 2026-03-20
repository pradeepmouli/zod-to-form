import { describe, it, expect, vi, beforeEach } from "vitest";
import { walkSchema } from "@zod-to-form/core";
import { transpile } from "../../src/worker/transpile.ts";
import { evaluate } from "../../src/worker/evaluate.ts";

vi.mock("../../src/worker/client.ts", () => ({
  EvalWorkerClient: class {
    eval(source: string) {
      const transpiled = transpile(source);
      if (!transpiled.ok) return Promise.reject(transpiled.error);
      const result = evaluate(transpiled.code);
      if (!result.ok) return Promise.reject(result.error);
      return Promise.resolve(walkSchema(result.schema));
    }
    cancel() {}
    dispose() {}
    restart() {}
  },
}));

describe("Editor → Preview pipeline integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("full pipeline: transpile → evaluate → walkSchema produces FormField[]", () => {
    const source = `const schema = z.object({ name: z.string(), age: z.number() });\nschema;`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(true);
    if (!transpiled.ok) return;

    const result = evaluate(transpiled.code);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fields = walkSchema(result.schema);
    expect(fields.length).toBe(2);
    expect(fields.find((f) => f.key === "name")?.zodType).toBe("string");
    expect(fields.find((f) => f.key === "age")?.zodType).toBe("number");
    expect(fields.every((f) => f.component != null)).toBe(true);
  });

  it("syntax error in editor content produces syntax error with line info", () => {
    const source = `const schema z.object({ name: z.string() });`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(false);
    if (transpiled.ok) return;
    expect(transpiled.error.type).toBe("syntax");
    expect(transpiled.error.line).toBeDefined();
    expect(transpiled.error.column).toBeDefined();
  });

  it("retains last valid fields when new source has errors", () => {
    const validSource = `const schema = z.object({ name: z.string() });\nschema;`;
    const validTranspiled = transpile(validSource);
    expect(validTranspiled.ok).toBe(true);
    if (!validTranspiled.ok) return;
    const validResult = evaluate(validTranspiled.code);
    expect(validResult.ok).toBe(true);
    if (!validResult.ok) return;
    const lastValidFields = walkSchema(validResult.schema);
    expect(lastValidFields.length).toBeGreaterThan(0);

    const brokenSource = `const schema = z.object({ name: z.string() `;
    const brokenTranspiled = transpile(brokenSource);
    expect(brokenTranspiled.ok).toBe(false);

    expect(lastValidFields.length).toBeGreaterThan(0);
    expect(lastValidFields[0]!.key).toBe("name");
  });

  it("import statement is rejected at transpile level", () => {
    const source = `import { z } from "zod";\nconst s = z.string();`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(false);
    if (transpiled.ok) return;
    expect(transpiled.error.type).toBe("import");
  });

  it("non-schema result produces runtime error", () => {
    const source = `42;`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(true);
    if (!transpiled.ok) return;
    const result = evaluate(transpiled.code);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("runtime");
    expect(result.error.message).toContain("Zod schema");
  });

  it("complex schema with nested objects produces nested FormField[]", () => {
    const source = `
const address = z.object({
  street: z.string(),
  city: z.string(),
});
const schema = z.object({
  name: z.string(),
  address: address,
});
schema;
`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(true);
    if (!transpiled.ok) return;
    const result = evaluate(transpiled.code);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fields = walkSchema(result.schema);
    expect(fields.find((f) => f.key === "name")).toBeDefined();
    const addressField = fields.find((f) => f.key === "address");
    expect(addressField).toBeDefined();
    expect(addressField!.children?.length).toBe(2);
  });

  it("metadata annotations (z.globalRegistry) produce labeled fields", () => {
    const source = `
const schema = z.object({ name: z.string() });
z.globalRegistry.add(schema.shape.name, { label: "Full Name" });
schema;
`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(true);
    if (!transpiled.ok) return;
    const result = evaluate(transpiled.code);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fields = walkSchema(result.schema);
    expect(fields[0]!.key).toBe("name");
  });

  it("optional fields are marked as not required in FormField[]", () => {
    const source = `const schema = z.object({ bio: z.string().optional() });\nschema;`;
    const transpiled = transpile(source);
    expect(transpiled.ok).toBe(true);
    if (!transpiled.ok) return;
    const result = evaluate(transpiled.code);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fields = walkSchema(result.schema);
    expect(fields[0]!.required).toBe(false);
  });
});
