import { useMemo, useRef } from 'react';
import type { FormField } from '@zod-to-form/core';
import type { ZodFormRegistry } from '@zod-to-form/core';
import type * as z from 'zod';
import { transpile } from '../worker/transpile.ts';
import { evaluate } from '../worker/evaluate.ts';

interface SchemaResult {
  schema: z.ZodObject<z.ZodRawShape> | null;
  formRegistry: ZodFormRegistry | undefined;
  stale: boolean;
}

/**
 * Re-evaluates the editor source on the main thread to obtain a live Zod schema
 * for `<ZodForm>` binding. Only runs when the worker has confirmed valid fields,
 * minimizing redundant evaluation. Returns a `stale` flag when falling back to
 * a previous result.
 */
export function useSchemaFromSource(
  editorContent: string,
  fields: FormField[] | null
): SchemaResult {
  const lastGood = useRef<SchemaResult>({ schema: null, formRegistry: undefined, stale: false });

  return useMemo(() => {
    const staleResult = (): SchemaResult => ({
      ...lastGood.current,
      stale: lastGood.current.schema !== null
    });

    // null fields = worker hasn't returned yet or errored; fall back to last good
    if (fields === null) return staleResult();

    // empty fields is a valid result (e.g. z.object({})), proceed with evaluation
    const transpileResult = transpile(editorContent);
    if (!transpileResult.ok) return staleResult();

    const evalResult = evaluate(transpileResult.code);
    if (!evalResult.ok) return staleResult();

    const result: SchemaResult = {
      schema: evalResult.schema as z.ZodObject<z.ZodRawShape>,
      formRegistry: evalResult.formRegistry,
      stale: false
    };
    lastGood.current = result;
    return result;
  }, [editorContent, fields]);
}
