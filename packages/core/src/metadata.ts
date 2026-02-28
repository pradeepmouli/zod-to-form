import { z } from 'zod';
import type { FormMeta, ZodFormRegistry } from './types.js';

export type ResolvedMetadata = FormMeta & {
  title?: string;
  description?: string;
  examples?: unknown[];
  deprecated?: boolean;
};

export function resolveMetadata(schema: unknown, formRegistry?: ZodFormRegistry): ResolvedMetadata {
  const globalMeta = z.globalRegistry.get(schema as never) as
    | {
        title?: string;
        description?: string;
        examples?: unknown[];
        deprecated?: boolean;
      }
    | undefined;
  const formMeta = formRegistry?.get(schema as never) as FormMeta | undefined;

  return {
    title: globalMeta?.title,
    description: globalMeta?.description,
    examples: globalMeta?.examples,
    deprecated: globalMeta?.deprecated,
    ...formMeta
  };
}
