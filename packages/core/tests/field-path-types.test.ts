// SPDX-License-Identifier: MIT
// Type-only tests for US5 — array-traversal field paths in `FieldConfig`
// (010-editor-primitives). These run as part of the type-check pass; the
// runtime portion is a no-op describe.

import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import type { ZodFormsConfig } from '../src/config.js';

const innerSchema = z.object({
  name: z.string(),
  typeCall: z.object({ type: z.string() })
});

const Schema = z.object({
  attributes: z.array(innerSchema),
  superType: z.string().optional(),
  meta: z.object({
    description: z.string()
  })
});

type Schemas = { TheSchema: typeof Schema };

describe('SchemaFieldPath array traversal', () => {
  it('accepts [] and [].<inner> paths in fields keys', () => {
    const config: ZodFormsConfig<Record<string, unknown>, Schemas> = {
      components: { source: '@app/components', overrides: {} },
      schemas: {
        TheSchema: {
          fields: {
            'attributes[].name': { component: 'Input' },
            'attributes[].typeCall.type': { component: 'TypeSelector' },
            'meta.description': { component: 'Textarea' },
            superType: { component: 'TypeSelector' }
          }
        }
      }
    };
    expectTypeOf(config).toBeObject();
  });

  it('rejects misspelled child of array element', () => {
    const config: ZodFormsConfig<Record<string, unknown>, Schemas> = {
      components: { source: '@app/components', overrides: {} },
      schemas: {
        TheSchema: {
          fields: {
            // @ts-expect-error 'typo' is not a property of array-element schema
            'attributes[].typo': { component: 'Input' }
          }
        }
      }
    };
    void config;
  });

  it('still accepts numeric-index paths for backward compatibility', () => {
    const config: ZodFormsConfig<Record<string, unknown>, Schemas> = {
      components: { source: '@app/components', overrides: {} },
      schemas: {
        TheSchema: {
          fields: {
            'attributes.0.name': { component: 'Input' }
          }
        }
      }
    };
    void config;
  });

  it('accepts top-level untyped string keys via the global fields fallback', () => {
    const config: ZodFormsConfig = {
      components: { source: '@app/components', overrides: {} },
      fields: {
        'arbitrary[].nested.path': { component: 'Custom' }
      }
    };
    void config;
  });
});
