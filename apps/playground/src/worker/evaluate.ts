import * as z from "zod";
import { defineConfig, registerDeep, registerFlat } from "@zod-to-form/core";
import type { EvaluationError } from "../types/playground.ts";

export type EvalResult =
  | { ok: true; schema: z.ZodType }
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

    if (!result || typeof result !== "object" || !("_zod" in result)) {
      return {
        ok: false,
        error: {
          type: "runtime",
          message:
            "The code must return a Zod schema. Make sure the last expression evaluates to a schema (e.g., 'const schema = z.object({...}); schema;').",
        },
      };
    }

    return { ok: true, schema: result as z.ZodType };
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
