import { useMemo } from "react";
import type { FormField } from "@zod-to-form/core";
import type * as z from "zod";
import { transpile } from "../worker/transpile.ts";
import { evaluate } from "../worker/evaluate.ts";

export function useSchemaFromSource(
  editorContent: string,
  fields: FormField[] | null,
): z.ZodObject<z.ZodRawShape> | null {
  return useMemo(() => {
    if (!fields || fields.length === 0) return null;
    const transpileResult = transpile(editorContent);
    if (!transpileResult.ok) return null;
    const evalResult = evaluate(transpileResult.code);
    if (!evalResult.ok) return null;
    return evalResult.schema as z.ZodObject<z.ZodRawShape>;
  }, [editorContent, fields]);
}
