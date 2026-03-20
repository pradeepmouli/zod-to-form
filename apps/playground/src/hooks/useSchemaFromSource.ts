import { useMemo, useRef } from "react";
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
  const lastGood = useRef<SchemaResult>({ schema: null, formRegistry: undefined });

  return useMemo(() => {
    if (!fields || fields.length === 0) return lastGood.current;
    const transpileResult = transpile(editorContent);
    if (!transpileResult.ok) return lastGood.current;
    const evalResult = evaluate(transpileResult.code);
    if (!evalResult.ok) return lastGood.current;
    const result: SchemaResult = {
      schema: evalResult.schema as z.ZodObject<z.ZodRawShape>,
      formRegistry: evalResult.formRegistry,
    };
    lastGood.current = result;
    return result;
  }, [editorContent, fields]);
}
