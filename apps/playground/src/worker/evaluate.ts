import * as z from "zod";
import { defineConfig, registerDeep, registerFlat } from "@zod-to-form/core";
import type { ZodFormRegistry } from "@zod-to-form/core";
import type { EvaluationError } from "../types/playground.ts";

export type EvalResult =
  | { ok: true; schema: z.ZodType; formRegistry?: ZodFormRegistry }
  | { ok: false; error: EvaluationError };

const IMPORT_RE = /\b(import)\s+|(\bimport)\s*\(|(\brequire)\s*\(/m;

function wrapLastExpression(code: string): string {
  const lines = code.trimEnd().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("//") || line.startsWith("/*")) continue;
    const cleaned = line.replace(/;$/, "").trim();
    if (
      cleaned &&
      !cleaned.startsWith("const ") &&
      !cleaned.startsWith("let ") &&
      !cleaned.startsWith("var ") &&
      !cleaned.startsWith("function ") &&
      !cleaned.startsWith("class ") &&
      !cleaned.startsWith("return ") &&
      !cleaned.startsWith("}") &&
      !cleaned.startsWith("{")
    ) {
      lines[i] = `return ${cleaned};`;
      break;
    }
    if (cleaned.startsWith("return ")) break;
    break;
  }
  return lines.join("\n");
}

function isZodSchema(value: unknown): value is z.ZodType {
  return !!value && typeof value === "object" && "_zod" in value;
}

export function evaluate(jsCode: string): EvalResult {
  if (IMPORT_RE.test(jsCode)) {
    return {
      ok: false,
      error: {
        type: "import",
        message: "Imports are not supported in the playground sandbox. Use the globally available 'z' (Zod) and 'core' objects instead.",
      },
    };
  }

  try {
    const scope = {
      z,
      zod: z,
      core: { defineConfig, registerDeep, registerFlat },
    };
    const argNames = Object.keys(scope);
    const argValues = Object.values(scope);

    const wrappedCode = wrapLastExpression(jsCode);
    const fn = new Function(...argNames, wrappedCode);
    const result = fn(...argValues);

    if (isZodSchema(result)) {
      return { ok: true, schema: result };
    }

    if (
      result &&
      typeof result === "object" &&
      "schema" in result &&
      isZodSchema(result.schema)
    ) {
      const formRegistry =
        result.formRegistry && typeof result.formRegistry === "object" && "get" in result.formRegistry
          ? (result.formRegistry as ZodFormRegistry)
          : undefined;
      return { ok: true, schema: result.schema as z.ZodType, formRegistry };
    }

    return {
      ok: false,
      error: {
        type: "runtime",
        message:
          "The code must return a Zod schema or { schema, formRegistry }. Make sure the last expression evaluates to a schema (e.g., 'schema;') or an object with both (e.g., '{ schema, formRegistry };').",
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      ok: false,
      error: {
        type: "runtime",
        message: error.message ?? "Runtime error during evaluation",
      },
    };
  }
}
