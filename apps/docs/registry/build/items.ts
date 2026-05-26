import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildConfigSource, generateFormComponent } from '@zod-to-form/codegen';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../sample/schema.js';
import type { RegistryItemFile, RegistryItem, RegistryIndex } from './types.js';
import { REGISTRY_DEPENDENCIES, CODEGEN_REGISTRY_DEPENDENCIES, STARTER_DOCS } from './docs.js';

const SAMPLE_SCHEMA_SRC = readFileSync(
  fileURLToPath(new URL('../sample/schema.ts', import.meta.url)),
  'utf8'
);

/**
 * The shadcn field adapter components shipped by every starter. The seven
 * component files wrap the consumer's installed shadcn/ui primitives; `index`
 * re-exports them plus a keyed `components` map for the ZodForm runtime
 * registry. All eight install under the `@components/zod-form/` alias.
 */
const ADAPTER_COMPONENT_NAMES = [
  'input',
  'textarea',
  'checkbox',
  'switch',
  'select',
  'radio-group',
  'date-picker'
] as const;

/**
 * Strip the `.js` extension from RELATIVE import/export specifiers only.
 *
 * The repo-convention adapter `index.tsx` uses `.js` relative specifiers (e.g.
 * `from './input.js'`) so it resolves correctly under Node ESM in this repo.
 * Consumer bundlers (Next/webpack) resolve `./input.js` literally and fail —
 * there is no `input.js`, only `input.tsx`. Extensionless (`./input`) resolves
 * correctly. This transform touches ONLY relative (`./` or `../`) specifiers;
 * it never rewrites `@/` alias or bare package imports.
 */
function stripRelativeJsExtensions(source: string): string {
  return source.replace(/(from\s+['"])(\.\.?\/[^'"]+?)\.js(['"])/g, '$1$2$3');
}

/**
 * Read the eight shadcn adapter files from `registry/components/shadcn/` and
 * return `files[]` entries targeting `@components/zod-form/<name>.tsx`.
 *
 * The seven component files ship VERBATIM — their imports (`@/components/ui/*`
 * extensionless + `@zod-to-form/core` type) are already consumer-correct.
 * `index.tsx` ships with its relative `.js` extensions stripped (see
 * {@link stripRelativeJsExtensions}).
 */
function adapterFiles(): RegistryItemFile[] {
  const read = (name: string): string =>
    readFileSync(
      fileURLToPath(new URL(`../components/shadcn/${name}.tsx`, import.meta.url)),
      'utf8'
    );

  const componentFiles: RegistryItemFile[] = ADAPTER_COMPONENT_NAMES.map((name) => ({
    path: `zod-form/${name}.tsx`,
    type: 'registry:component',
    content: read(name),
    target: `@components/zod-form/${name}.tsx`
  }));

  return [
    ...componentFiles,
    {
      path: 'zod-form/index.tsx',
      type: 'registry:component',
      content: stripRelativeJsExtensions(read('index')),
      target: '@components/zod-form/index.tsx'
    }
  ];
}

/**
 * Generate the sample z2f.config.ts source.
 *
 * @param componentSource - The import path written into `componentSource` and
 *   `componentTypeImport`. All three items now point at `'@/components/zod-form'`
 *   — the shared shadcn adapter module shipped by every starter.
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

const ZOD_FORM_USAGE = `import { ZodForm } from '@zod-to-form/react';
import { schema } from '@/lib/zod-form/schema';
import { components } from '@/components/zod-form';

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
    // @zod-to-form/core is imported only by the shipped z2f.config.ts (build-time tooling),
    // so it's a devDependency. A direct import needs a direct dep under pnpm strict installs.
    devDependencies: ['@zod-to-form/core'],
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
        content: sampleConfigSource('@/components/zod-form'),
        target: '@lib/zod-form/z2f.config.ts'
      },
      ...adapterFiles(),
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
    // z2f.config.ts (build-time tooling) imports @zod-to-form/core; devDep keeps the
    // owned generated component free of a runtime zod-to-form dependency.
    devDependencies: ['@zod-to-form/core'],
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
        content: sampleConfigSource('@/components/zod-form'),
        target: '@lib/zod-form/z2f.config.ts'
      },
      ...adapterFiles(),
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

const VITE_USAGE = `// vite.config.ts — add the z2f plugin BEFORE @vitejs/plugin-react.
// Point configPath at the z2f.config.ts this starter installed (under your @lib
// alias — default src/lib/zod-form/). Without it the plugin only auto-discovers
// z2f.config.* at the project ROOT and silently falls back to defaults (ui: html):
//   import z2fVite from '@zod-to-form/vite';
//   import react from '@vitejs/plugin-react';
//   export default defineConfig({
//     plugins: [z2fVite({ configPath: 'src/lib/zod-form/z2f.config.ts' }), react()]
//   });
//
// tsconfig.json — register the ambient ?z2f types so the import below type-checks:
//   { "compilerOptions": { "types": ["@zod-to-form/vite/client"] } }
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
    devDependencies: ['@zod-to-form/vite', '@zod-to-form/core'],
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
        content: sampleConfigSource('@/components/zod-form'),
        target: '@lib/zod-form/z2f.config.ts'
      },
      ...adapterFiles(),
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

/**
 * Strip `files[].content` from a registry item so it is safe to embed in the
 * registry INDEX (`registry.json`). The shadcn convention is that the index
 * lists items with file REFERENCES (path/type/target) only; inlined file bodies
 * belong exclusively in the per-item `r/<name>.json` files.
 */
function toIndexItem(item: RegistryItem): RegistryItem {
  return { ...item, files: item.files.map(({ content: _content, ...ref }) => ref) };
}

export function buildRegistryIndex(): RegistryIndex {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: '@zod-to-form',
    homepage: 'https://zod.toform.dev',
    items: [buildReactItem(), buildCodegenItem(), buildViteItem()].map(toIndexItem)
  };
}
