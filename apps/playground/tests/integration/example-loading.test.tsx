import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EXAMPLES } from "../../src/components/examples/examples.ts";
import { STARTER_SCHEMA } from "../../src/components/examples/starter.ts";
import { transpile } from "../../src/worker/transpile.ts";
import { evaluate } from "../../src/worker/evaluate.ts";
import { walkSchema } from "@zod-to-form/core";

describe("Example loading integration", () => {
  it("has at least 5 curated examples (SC-004)", () => {
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(5);
  });

  it("every example has required fields", () => {
    for (const ex of EXAMPLES) {
      expect(ex.id).toBeTruthy();
      expect(ex.title).toBeTruthy();
      expect(ex.description).toBeTruthy();
      expect(["basic", "advanced", "patterns"]).toContain(ex.category);
      expect(ex.source).toBeTruthy();
      expect(ex.tags.length).toBeGreaterThan(0);
    }
  });

  it("every example has a unique id", () => {
    const ids = EXAMPLES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all three categories are represented", () => {
    const categories = new Set(EXAMPLES.map((e) => e.category));
    expect(categories.has("basic")).toBe(true);
    expect(categories.has("advanced")).toBe(true);
    expect(categories.has("patterns")).toBe(true);
  });

  it("every example transpiles and evaluates to FormField[]", () => {
    for (const ex of EXAMPLES) {
      const transpiled = transpile(ex.source);
      expect(transpiled.ok, `Example "${ex.id}" failed to transpile: ${!transpiled.ok ? transpiled.error.message : ""}`).toBe(true);
      if (!transpiled.ok) continue;
      const result = evaluate(transpiled.code);
      expect(result.ok, `Example "${ex.id}" failed to evaluate: ${!result.ok ? result.error.message : ""}`).toBe(true);
      if (!result.ok) continue;
      const fields = walkSchema(result.schema);
      expect(fields.length, `Example "${ex.id}" produced 0 fields`).toBeGreaterThan(0);
    }
  });

  it("starter schema produces valid FormField[]", () => {
    const transpiled = transpile(STARTER_SCHEMA);
    expect(transpiled.ok).toBe(true);
    if (!transpiled.ok) return;
    const result = evaluate(transpiled.code);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const fields = walkSchema(result.schema);
    expect(fields.length).toBeGreaterThan(0);
  });
});

describe("Example loading flow simulation", () => {
  let originalConfirm: typeof globalThis.confirm;

  beforeEach(() => {
    originalConfirm = globalThis.confirm;
  });

  afterEach(() => {
    globalThis.confirm = originalConfirm;
  });

  it("loading an example replaces editor content", () => {
    let editorContent = STARTER_SCHEMA;
    const setContent = (c: string) => { editorContent = c; };

    const selectedExample = EXAMPLES[0]!;
    setContent(selectedExample.source);

    expect(editorContent).toBe(selectedExample.source);
    expect(editorContent).not.toBe(STARTER_SCHEMA);
  });

  it("unsaved changes prompt user before replacing (confirm accepted)", () => {
    globalThis.confirm = vi.fn(() => true);

    let editorContent = STARTER_SCHEMA;
    const initialContent = STARTER_SCHEMA;
    const setContent = (c: string) => { editorContent = c; };

    editorContent = "const schema = z.object({ custom: z.string() });\nschema;";
    const hasChanges = editorContent !== initialContent;

    const selectedExample = EXAMPLES[1]!;
    if (hasChanges) {
      const confirmed = globalThis.confirm("You have unsaved changes. Load this example?");
      if (confirmed) {
        setContent(selectedExample.source);
      }
    }

    expect(globalThis.confirm).toHaveBeenCalledOnce();
    expect(editorContent).toBe(selectedExample.source);
  });

  it("unsaved changes prompt user before replacing (confirm rejected)", () => {
    globalThis.confirm = vi.fn(() => false);

    let editorContent = "const schema = z.object({ custom: z.string() });\nschema;";
    const setContent = (c: string) => { editorContent = c; };
    const hasChanges = editorContent !== STARTER_SCHEMA;

    const selectedExample = EXAMPLES[2]!;
    if (hasChanges) {
      const confirmed = globalThis.confirm("You have unsaved changes. Load this example?");
      if (confirmed) {
        setContent(selectedExample.source);
      }
    }

    expect(globalThis.confirm).toHaveBeenCalledOnce();
    expect(editorContent).not.toBe(selectedExample.source);
    expect(editorContent).toBe("const schema = z.object({ custom: z.string() });\nschema;");
  });

  it("no prompt when content is unchanged from starter", () => {
    globalThis.confirm = vi.fn(() => true);

    let editorContent = STARTER_SCHEMA;
    const setContent = (c: string) => { editorContent = c; };
    const hasChanges = editorContent !== STARTER_SCHEMA;

    const selectedExample = EXAMPLES[0]!;
    if (hasChanges) {
      globalThis.confirm("You have unsaved changes. Load this example?");
    }
    setContent(selectedExample.source);

    expect(globalThis.confirm).not.toHaveBeenCalled();
    expect(editorContent).toBe(selectedExample.source);
  });
});
