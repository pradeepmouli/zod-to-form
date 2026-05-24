import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildConfigSource, generateFormComponent } from '@zod-to-form/codegen';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../sample/schema.js';
import type { RegistryItem, RegistryIndex } from './types.js';
import { REGISTRY_DEPENDENCIES, CODEGEN_REGISTRY_DEPENDENCIES, STARTER_DOCS } from './docs.js';

const SAMPLE_SCHEMA_SRC = readFileSync(
  fileURLToPath(new URL('../sample/schema.ts', import.meta.url)),
  'utf8'
);

/**
 * Generate the sample z2f.config.ts source.
 *
 * @param componentSource - The import path written into `componentSource` and
 *   `componentTypeImport`. Differs per item:
 *   - React item: `'@/components/zod-form-components'` — the runtime component
 *     map module shipped alongside the item.
 *   - Codegen/vite items: `'@/components/ui/form'` — the shadcn `form` registry
 *     item that `generated-form.tsx` (and `?z2f`-generated forms) actually import.
 */
function sampleConfigSource(componentSource: string): string {
  return buildConfigSource({
    componentSource,
    componentTypeImport: componentSource,
    schemaTypeImport: './schema',
    schemaExports: ['schema'],
    preset: 'shadcn',
    defaults: {
      mode: 'submit',
      ui: 'shadcn',
      overwrite: false,
      serverAction: false,
      formProvider: false
    }
  });
}

/**
 * Ships a `zod-form-components.tsx` module that maps field component names to the
 * consumer's installed shadcn/ui components. The map shape mirrors `defaultComponentMap`
 * from `@zod-to-form/react` — each key is a field component name (e.g. `Input`,
 * `Checkbox`, `Field`, `FieldLabel`, `FieldDescription`, `FieldMessage`) and each
 * value is the React component to render for that field type.
 *
 * Covers the components needed by the sample schema's four fields:
 *   name/email/age → Input (string/number)
 *   subscribe      → Checkbox (boolean)
 * Plus the wrapper components (`Field`, `FieldLabel`, `FieldDescription`, `FieldMessage`)
 * used by every field regardless of type.
 */
const ZOD_FORM_COMPONENTS_SRC = `import { defaultComponentMap } from '@zod-to-form/react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ComponentPropsWithoutRef } from 'react';

// ── Thin wrappers so the map matches ZodForm's expected component signatures ──

function Field({ children, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className="space-y-2" {...props}>{children}</div>;
}

function FieldLabel(props: ComponentPropsWithoutRef<typeof Label>) {
  return <Label {...props} />;
}

function FieldDescription({ children, ...props }: ComponentPropsWithoutRef<'p'>) {
  return <p className="text-sm text-muted-foreground" {...props}>{children}</p>;
}

function FieldMessage({ children, ...props }: ComponentPropsWithoutRef<'p'>) {
  return <p className="text-sm font-medium text-destructive" {...props}>{children}</p>;
}

/**
 * Component map wired to the project's installed shadcn/ui components.
 * Pass this to ZodForm via the components prop so the runtime renderer
 * uses the real shadcn Input, Checkbox, and Label instead of the built-in HTML stubs.
 *
 * Add or override entries to customise individual field components:
 *   import { Textarea } from '@/components/ui/textarea';
 *   export const components = { ...baseComponents, Textarea };
 */
export const components = {
  ...defaultComponentMap,
  Input,
  Checkbox,
  Field,
  FieldLabel,
  FieldDescription,
  FieldMessage,
} satisfies typeof defaultComponentMap;
`;

const ZOD_FORM_USAGE = `import { ZodForm } from '@zod-to-form/react';
import { schema } from '@/lib/zod-form/schema';
import { components } from '@/components/zod-form-components';

export function ExampleForm() {
  return (
    <ZodForm
      schema={schema}
      components={components}
      onSubmit={(_data) => {
        // handle submission
      }}
    />
  );
}
`;

function generatedComponentSource(): string {
  const fields = walkSchema(schema);
  return generateFormComponent(fields, {
    exportName: 'schema',
    componentName: 'GeneratedForm',
    schemaImportPath: '@/lib/zod-form/schema',
    ui: 'shadcn',
    mode: 'submit',
    formProvider: false,
    // The shadcn field template wraps fields in <FormItem>/<FormLabel>/
    // <FormControl>/<FormMessage>. generate.ts only emits the import line for
    // those primitives when componentConfig is set — so pass a minimal config
    // whose `source` points at shadcn's form module (the `form` registry item
    // installs to @/components/ui/form). Without this the generated .tsx
    // references undefined Form* identifiers and won't compile.
    componentConfig: {
      components: {
        source: '@/components/ui/form',
        preset: 'shadcn'
      }
    }
  });
}

export function buildReactItem(): RegistryItem {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'starter-react',
    type: 'registry:block',
    title: 'zod-to-form starter (runtime)',
    description:
      'Schema-driven React Hook Form from a Zod schema, rendered at runtime with <ZodForm>. Zod + react-hook-form + shadcn/ui, with validation and codegen via zod-to-form.',
    dependencies: ['@zod-to-form/react', 'zod', 'react-hook-form', '@hookform/resolvers'],
    registryDependencies: REGISTRY_DEPENDENCIES,
    files: [
      {
        path: 'schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@lib/zod-form/schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource('@/components/zod-form-components'),
        target: '@lib/zod-form/z2f.config.ts'
      },
      {
        path: 'zod-form-components.tsx',
        type: 'registry:component',
        content: ZOD_FORM_COMPONENTS_SRC,
        target: '@components/zod-form-components.tsx'
      },
      {
        path: 'zod-form.tsx',
        type: 'registry:component',
        content: ZOD_FORM_USAGE,
        target: '@components/zod-form.tsx'
      }
    ],
    docs: STARTER_DOCS
  };
}

export function buildCodegenItem(): RegistryItem {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'starter-codegen',
    type: 'registry:block',
    title: 'zod-to-form starter (codegen)',
    description:
      'Build-time generated React Hook Form component from a Zod schema — you own the .tsx, no runtime zod-to-form dependency. Zod + react-hook-form + shadcn/ui validation and codegen.',
    dependencies: ['zod', 'react-hook-form', '@hookform/resolvers'],
    registryDependencies: CODEGEN_REGISTRY_DEPENDENCIES,
    files: [
      {
        path: 'schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@lib/zod-form/schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource('@/components/ui/form'),
        target: '@lib/zod-form/z2f.config.ts'
      },
      {
        path: 'generated-form.tsx',
        type: 'registry:component',
        content: generatedComponentSource(),
        target: '@components/generated-form.tsx'
      }
    ],
    docs: STARTER_DOCS
  };
}

const VITE_USAGE = `// vite.config.ts — add the z2f plugin:
//   import { z2f } from '@zod-to-form/vite';
//   export default defineConfig({ plugins: [z2f()] });
//
// then import the generated form from your schema:
import Form from '@/lib/zod-form/schema.ts?z2f';
export default Form;
`;

export function buildViteItem(): RegistryItem {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'starter-vite',
    type: 'registry:block',
    title: 'zod-to-form starter (Vite plugin)',
    description:
      'Generate React Hook Form components from a Zod schema at build time with the zod-to-form Vite plugin (?z2f imports). Zod + react-hook-form + shadcn/ui.',
    dependencies: ['zod', 'react-hook-form', '@hookform/resolvers'],
    devDependencies: ['@zod-to-form/vite'],
    registryDependencies: CODEGEN_REGISTRY_DEPENDENCIES,
    files: [
      {
        path: 'schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@lib/zod-form/schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource('@/components/ui/form'),
        target: '@lib/zod-form/z2f.config.ts'
      },
      {
        path: 'vite-usage.tsx',
        type: 'registry:component',
        content: VITE_USAGE,
        target: '@components/zod-form-vite.tsx'
      }
    ],
    docs: STARTER_DOCS
  };
}

export function buildRegistryIndex(): RegistryIndex {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: '@zod-to-form',
    homepage: 'https://zod.toform.dev',
    items: [buildReactItem(), buildCodegenItem(), buildViteItem()]
  };
}
