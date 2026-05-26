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
 * The shadcn adapter component files shipped by every starter.
 * Input/Textarea/Checkbox/Switch are now raw @/components/ui/* re-exports in
 * index.tsx — they have no adapter file on disk. Only Select/RadioGroup/DatePicker
 * retain local adapter files; all three install under `@components/z2f/`.
 */
const ADAPTER_COMPONENT_NAMES = ['select', 'radio-group', 'date-picker'] as const;

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
 * Read the shadcn adapter files from `registry/components/shadcn/` and return
 * `files[]` entries targeting `@components/z2f/<name>.tsx`.
 *
 * Only Select/RadioGroup/DatePicker ship as discrete adapter files.
 * Input/Textarea/Checkbox/Switch are raw @/components/ui/* re-exports in
 * index.tsx and have no on-disk adapter file.
 *
 * Relative `.js` specifiers are stripped on the way out (see
 * {@link stripRelativeJsExtensions}) — consumer bundlers (Next/webpack) resolve
 * `./types.js` literally and fail; the extensionless form resolves correctly.
 * The `@/components/ui/*` alias and bare package imports are untouched.
 *
 * The shared `types.ts` MUST ship alongside the adapters — Select/RadioGroup/
 * DatePicker reference it, so omitting it would break the consumer `tsc`.
 */
function adapterFiles(): RegistryItemFile[] {
  const read = (relPath: string): string =>
    readFileSync(
      fileURLToPath(new URL(`../components/shadcn/${relPath}`, import.meta.url)),
      'utf8'
    );

  const componentFiles: RegistryItemFile[] = ADAPTER_COMPONENT_NAMES.map((name) => ({
    path: `z2f/${name}.tsx`,
    type: 'registry:component',
    content: stripRelativeJsExtensions(read(`${name}.tsx`)),
    target: `@components/z2f/${name}.tsx`
  }));

  return [
    {
      path: 'z2f/types.ts',
      type: 'registry:lib',
      content: stripRelativeJsExtensions(read('types.ts')),
      target: '@components/z2f/types.ts'
    },
    ...componentFiles,
    {
      path: 'z2f/index.tsx',
      type: 'registry:component',
      content: stripRelativeJsExtensions(read('index.tsx')),
      target: '@components/z2f/index.tsx'
    }
  ];
}

/**
 * Component overrides tuned for the shipped `@/components/z2f` ADAPTERS against
 * shadcn's **Base UI** component set.
 *
 * NOTE: This intentionally differs from core's `SHADCN_OVERRIDES`. That map
 * targets the raw shadcn Radix primitives. The Base UI components in
 * `@/components/z2f` bind Checkbox/Switch directly to the re-exported
 * `@/components/ui/checkbox` and `@/components/ui/switch` (Base UI primitives),
 * so they carry explicit `props` mappings for `checked`/`onCheckedChange`.
 * Select/RadioGroup/DatePicker go through adapters that normalise to the plain
 * `value`/`onChange` shape, so `controlled: true` without a `props` map is correct.
 *
 * Key Base UI facts (verified Task 0):
 * - Checkbox/Switch `onCheckedChange(checked: boolean, eventDetails)` — value-first,
 *   plain boolean (never `boolean | 'indeterminate'`). No `=== true` normalization needed.
 * - `checked: '!!field.value'` guards undefined→false for React controlled/uncontrolled warning.
 * - Checkbox/Switch have no root `ref` prop for the focusable input (Base UI uses `inputRef`);
 *   codegen does NOT thread `field.ref` to these components.
 * - Switch has no `onBlur` on its root prop surface.
 *
 * This single definition is SHARED by both {@link sampleConfigSource} (the
 * shipped `z2f.config.ts`) and {@link generatedComponentSource} (the
 * pre-generated `example-form.tsx`) so the config and the codegen output stay
 * in lockstep.
 */
const ADAPTER_OVERRIDES = {
  Input: {},
  Textarea: {},
  Checkbox: {
    controlled: true,
    props: { checked: '!!field.value', onCheckedChange: 'field.onChange' }
  },
  Switch: {
    controlled: true,
    props: { checked: '!!field.value', onCheckedChange: 'field.onChange' }
  },
  Select: { controlled: true },
  RadioGroup: { controlled: true },
  DatePicker: { controlled: true }
} as const;

/**
 * Generate the sample z2f.config.ts source.
 *
 * @param componentSource - The import path written into `componentSource` and
 *   `componentTypeImport`. All three items now point at `'@/components/z2f'`
 *   — the shared shadcn adapter module shipped by every starter.
 *
 * The emitted config carries {@link ADAPTER_OVERRIDES} (the SAME overrides the
 * pre-generated `example-form.tsx` uses) — NOT core's `SHADCN_OVERRIDES`. We
 * deliberately omit `preset: 'shadcn'` here: `buildConfigSource` force-spreads
 * `...SHADCN_OVERRIDES` whenever a preset is set, which would emit Radix prop
 * bindings the shipped Base UI adapters DON'T accept. By dropping the preset
 * and passing the adapter overrides explicitly, the config's `overrides` block
 * becomes the controlled markings the adapters expect, so any codegen re-run
 * (CLI or `?z2f`) emits the correct bindings. `defaults.ui: 'shadcn'` is
 * preserved explicitly below.
 */
function sampleConfigSource(componentSource: string): string {
  return buildConfigSource({
    componentSource,
    componentTypeImport: componentSource,
    schemaTypeImport: './schema',
    schemaExports: ['schema'],
    overrides: { ...ADAPTER_OVERRIDES },
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
import { schema } from '@/lib/example-schema';
import { components } from '@/components/z2f';

// componentConfig tells the runtime which components are controlled and how
// to bind their props. Checkbox/Switch use Base UI's checked/onCheckedChange
// API; the '!!field.value' expression coerces undefined→false, preventing
// React's uncontrolled→controlled warning.
const componentConfig = {
  components: {
    source: '@/components/z2f',
    overrides: {
      Checkbox: { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } },
      Switch:   { controlled: true, props: { checked: '!!field.value', onCheckedChange: 'field.onChange' } },
      Select:    { controlled: true },
      RadioGroup: { controlled: true },
      DatePicker: { controlled: true }
    }
  }
} as const;

export function ExampleForm() {
  return (
    <ZodForm
      schema={schema}
      components={components}
      componentConfig={componentConfig}
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
    schemaImportPath: '@/lib/example-schema',
    ui: 'shadcn',
    mode: 'submit',
    formProvider: false,
    // Source BOTH the field adapters and the shadcn Form* layout wrappers from
    // the single `@/components/z2f` module: the adapter index.tsx ships the
    // Base UI field components AND re-exports FormItem/FormControl/FormLabel/etc.
    // The Base UI adapter overrides make Checkbox/Switch bind to the checked/
    // onCheckedChange props directly; Select/RadioGroup/DatePicker go through
    // adapters that accept the uniform value/onChange shape.
    componentConfig: {
      components: {
        source: '@/components/z2f',
        preset: 'shadcn',
        overrides: { ...ADAPTER_OVERRIDES }
      }
    },
    // Import StripIndexSignature from the owned barrel instead of inlining,
    // so the generated form has a single import surface with zero @zod-to-form/*.
    typesModule: '@/components/z2f'
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
        path: 'example-schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@lib/example-schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource('@/components/z2f'),
        target: 'z2f.config.ts'
      },
      ...adapterFiles(),
      {
        path: 'example-form.tsx',
        type: 'registry:component',
        content: ZOD_FORM_USAGE,
        target: '@components/example-form.tsx'
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
        path: 'example-schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@lib/example-schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource('@/components/z2f'),
        target: 'z2f.config.ts'
      },
      ...adapterFiles(),
      {
        path: 'example-form.tsx',
        type: 'registry:component',
        content: generatedComponentSource(),
        target: '@components/example-form.tsx'
      }
    ],
    docs: STARTER_DOCS
  };
}

const VITE_USAGE = `// vite.config.ts — add the z2f plugin BEFORE @vitejs/plugin-react.
// The plugin auto-discovers z2f.config.ts at the project root (where this
// starter installs it), so no extra plugin options are needed:
//   import z2fVite from '@zod-to-form/vite';
//   import react from '@vitejs/plugin-react';
//   export default defineConfig({
//     plugins: [z2fVite(), react()]
//   });
//
// tsconfig.json — register the ambient ?z2f types so the import below type-checks:
//   { "compilerOptions": { "types": ["@zod-to-form/vite/client"] } }
//
// then import the generated form from your schema:
import Form from '@/lib/example-schema.ts?z2f';
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
        path: 'example-schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@lib/example-schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource('@/components/z2f'),
        target: 'z2f.config.ts'
      },
      ...adapterFiles(),
      {
        path: 'vite-usage.tsx',
        type: 'registry:component',
        content: VITE_USAGE,
        target: '@components/example-form.tsx'
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
