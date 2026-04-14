import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { walkSchema } from '@zod-to-form/core';
import { generateFormComponent } from '@zod-to-form/codegen';
import { compileTarget } from '../../src/query-mode/transform.js';

/**
 * Parity gate (T070a / FR-019 / SC-006): the source the plugin emits
 * for a query-mode target MUST be byte-identical to what the CLI's
 * `generateFormComponent` would produce given the same effective
 * config + schema.
 *
 * Both code paths share `generateFormComponent` from @zod-to-form/codegen,
 * so byte equality follows trivially when the plugin doesn't inject any
 * extra config fields. This test pins that contract — a future plugin
 * change that quietly adds fields to the codegen-facing config (e.g. an
 * extra optimization flag, a wrapping import) would break it.
 *
 * The plugin-only deltas are intentional and stay confined to:
 *   - schemaImportPath (auto-derived from the schema basename when the
 *     user didn't supply one)
 *   - exportName (auto-detected from the namespace when the user didn't
 *     supply one)
 *   - componentName='Form' for `__rewrite_<n>` variants (the rewrite-
 *     mode hard-coded export name)
 *
 * We hold those constant in the test so the comparison stays apples-to-
 * apples.
 */

interface ParityCase {
  name: string;
  exportName: string;
  componentName: string;
  schema: import('zod/v4/core').$ZodType;
}

const CASES: ParityCase[] = [
  {
    name: 'simple object — primitive fields only',
    exportName: 'simpleSchema',
    componentName: 'SimpleForm',
    schema: z.object({
      name: z.string().min(2),
      age: z.number().int().min(0),
      active: z.boolean()
    })
  },
  {
    name: 'optional + nullable fields',
    exportName: 'profileSchema',
    componentName: 'ProfileForm',
    schema: z.object({
      bio: z.string().optional(),
      website: z.string().url().nullable(),
      newsletter: z.boolean().default(false)
    })
  },
  {
    name: 'enum + literal types',
    exportName: 'preferencesSchema',
    componentName: 'PreferencesForm',
    schema: z.object({
      theme: z.enum(['light', 'dark', 'system']),
      version: z.literal(2)
    })
  },
  {
    name: 'date + email + url validators',
    exportName: 'eventSchema',
    componentName: 'EventForm',
    schema: z.object({
      title: z.string().min(1),
      starts: z.date(),
      organizer: z.string().email(),
      website: z.string().url()
    })
  },
  {
    name: 'nested object',
    exportName: 'addressSchema',
    componentName: 'AddressForm',
    schema: z.object({
      street: z.string(),
      city: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    })
  }
];

/**
 * Build the codegen-facing config the plugin would synthesize for the
 * given case — `schemaImportPath` defaults to `./<basename>` because
 * the plugin's `compileTarget` derives that from the schema file path.
 */
function pluginConfigFor(c: ParityCase): import('@zod-to-form/core').CodegenConfig {
  return {
    componentName: c.componentName,
    mode: 'submit',
    ui: 'html',
    exportName: c.exportName,
    schemaImportPath: `./${c.name.replace(/\s+/g, '_')}`
  };
}

describe('codegen parity (plugin compileTarget ↔ CLI generateFormComponent)', () => {
  for (const c of CASES) {
    it(`produces identical output for: ${c.name}`, () => {
      const config = pluginConfigFor(c);

      // CLI path: walk + generate directly.
      const cliFields = walkSchema(c.schema);
      const cliSource = generateFormComponent(cliFields, config);

      // Plugin path: compileTarget feeds the same generateFormComponent
      // through the (schemaFile, variant, namespace) shape.
      const namespace = { [c.exportName]: c.schema };
      const pluginResult = compileTarget({
        namespace,
        schemaFile: `/abs/${c.name.replace(/\s+/g, '_')}.ts`,
        variant: '',
        config: {
          componentName: c.componentName,
          mode: 'submit',
          ui: 'html',
          exportName: c.exportName,
          // Match the CLI's schemaImportPath derivation to keep the
          // comparison apples-to-apples.
          schemaImportPath: config.schemaImportPath
        }
      });

      expect(pluginResult.generatedSource).toBe(cliSource);
    });
  }

  it('parity holds when the plugin is left to auto-detect exportName', () => {
    // No exportName in the config → the plugin's selectExport picks the
    // single Zod export from the namespace. The CLI requires an explicit
    // exportName, so we feed the same name on both sides for fairness.
    const schema = z.object({ a: z.string(), b: z.number() });
    const namespace = { mySchema: schema };

    const config = {
      componentName: 'MyForm',
      mode: 'submit' as const,
      ui: 'html' as const,
      exportName: 'mySchema',
      schemaImportPath: './my'
    };

    const cliSource = generateFormComponent(walkSchema(schema), config);

    const pluginResult = compileTarget({
      namespace,
      schemaFile: '/abs/my.ts',
      variant: '',
      // Note: no exportName in the plugin's input config — auto-detect.
      config: {
        componentName: 'MyForm',
        mode: 'submit',
        ui: 'html',
        schemaImportPath: './my'
      }
    });

    expect(pluginResult.exportName).toBe('mySchema');
    expect(pluginResult.generatedSource).toBe(cliSource);
  });

  it('rewrite-mode variants emit under the fixed component name `Form` (parity carve-out)', () => {
    // Documented divergence: rewrite-mode variants override
    // componentName to `'Form'` so the synthesized
    // `import { Form as _z2fGeneratedForm_<n> }` stays decoupled from
    // the user's chosen name. Pin that override here so a refactor
    // can't silently undo it.
    const schema = z.object({ a: z.string() });
    const result = compileTarget({
      namespace: { mySchema: schema },
      schemaFile: '/abs/x.ts',
      variant: '__rewrite_1',
      config: {
        componentName: 'UserChoice',
        mode: 'submit',
        ui: 'html',
        exportName: 'mySchema'
      }
    });
    expect(result.generatedSource).toMatch(/(function|const)\s+Form\b/);
    expect(result.generatedSource).not.toMatch(/(function|const)\s+UserChoice\b/);
  });
});
