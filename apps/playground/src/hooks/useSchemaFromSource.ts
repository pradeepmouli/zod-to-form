import { useMemo } from "react";
import type { FormField } from "@zod-to-form/core";
import type { ZodFormRegistry } from "@zod-to-form/core";
import type * as z from "zod";
import { transpile } from "../worker/transpile.ts";
import { evaluate } from "../worker/evaluate.ts";

interface SchemaResult {
  schema: z.ZodObject<z.ZodRawShape> | null;
  formRegistry: ZodFormRegistry | undefined;
}

export function useSchemaFromSource(
  editorContent: string,
  fields: FormField[] | null,
): SchemaResult {
  return useMemo(() => {
    if (!fields || fields.length === 0) return { schema: null, formRegistry: undefined };
    const transpileResult = transpile(editorContent);
    if (!transpileResult.ok) return { schema: null, formRegistry: undefined };
    const evalResult = evaluate(transpileResult.code);
    if (!evalResult.ok) return { schema: null, formRegistry: undefined };
    return {
      schema: evalResult.schema as z.ZodObject<z.ZodRawShape>,
      formRegistry: evalResult.formRegistry,
    };
  }, [editorContent, fields]);
}
