import { globalRegistry } from 'zod/v4/core';
import type { FormMeta, ZodFormRegistry } from './types.js';

export type ResolvedMetadata = FormMeta & {
  title?: string;
  description?: string;
  examples?: unknown[];
  deprecated?: boolean;
};

/** Merge global + form registry metadata for a schema. Form registry keys take precedence. */
export function resolveMetadata(schema: unknown, formRegistry?: ZodFormRegistry): ResolvedMetadata {
  // SAFETY: `as never` bridges untyped `schema` to the registry's generic constraint — callers always pass $ZodType-compatible values
  const globalMeta = globalRegistry.get(schema as never) as
    | {
        title?: string;
        description?: string;
        examples?: unknown[];
        deprecated?: boolean;
      }
    | undefined;
  // SAFETY: same as above — schema is $ZodType at runtime
  const formMeta = formRegistry?.get(schema as never) as FormMeta | undefined;

  return {
    title: globalMeta?.title,
    description: globalMeta?.description,
    examples: globalMeta?.examples,
    deprecated: globalMeta?.deprecated,
    ...formMeta
  };
}
