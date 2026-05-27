// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../../sample/schema.js';
import { buildReactItem, buildCodegenItem, buildViteItem, buildRegistryIndex } from '../items.js';
import { REGISTRY_DEPENDENCIES, STARTER_DOCS } from '../docs.js';
import itemSchema from '../../schema/registry-item.schema.json';

/**
 * The shadcn adapter files every starter ships at the new @components/z2f/ layout.
 * Select/RadioGroup/DatePicker ship as local wrappers.
 * Input/Textarea/Checkbox/Switch remain raw ui/* re-exports in index.tsx.
 */
const ADAPTER_TARGETS = [
  '@components/z2f/types.ts',
  '@components/z2f/select.tsx',
  '@components/z2f/radio-group.tsx',
  '@components/z2f/date-picker.tsx',
  '@components/z2f/index.tsx'
];

describe('sample schema', () => {
  it('walks to seven named fields', () => {
    const fields = walkSchema(schema);
    expect(fields.map((f) => f.key)).toEqual([
      'name',
      'email',
      'age',
      'subscribe',
      'role',
      'birthDate',
      'joinedAt'
    ]);
  });

  it('exercises all required field types', () => {
    const fields = walkSchema(schema);
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    // string field
    expect(byKey['name']!.component).toBe('Input');
    // boolean → Checkbox
    expect(byKey['subscribe']!.component).toBe('Checkbox');
    // enum → Select
    expect(byKey['role']!.component).toBe('Select');
    // z.string().date() → native date input (Input with type='date')
    expect(byKey['birthDate']!.component).toBe('Input');
    expect(byKey['birthDate']!.props['type']).toBe('date');
    // z.date() → DatePicker wrapper
    expect(byKey['joinedAt']!.component).toBe('DatePicker');
  });
});

describe('buildReactItem', () => {
  const item = buildReactItem();

  it('is a registry:block named starter-react', () => {
    expect(item.name).toBe('starter-react');
    expect(item.type).toBe('registry:block');
  });

  it('depends on the z2f runtime and peers', () => {
    expect(item.dependencies).toEqual(
      expect.arrayContaining([
        '@zod-to-form/react',
        'zod',
        'react-hook-form',
        '@hookform/resolvers'
      ])
    );
  });

  it('ships example-schema.ts, z2f.config.ts, the shadcn adapters, and an ExampleForm usage file with inlined content', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).toEqual(
      expect.arrayContaining(['example-schema.ts', 'z2f.config.ts', 'example-form.tsx'])
    );
    for (const f of item.files) {
      expect(f.content!.length).toBeGreaterThan(0);
    }
  });

  it('z2f.config.ts targets the project root (no @lib/ alias prefix)', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    // Root-level config: target is a bare filename, no registry alias prefix
    expect(config.target).toBe('z2f.config.ts');
  });

  it('schema installs at @lib/example-schema.ts', () => {
    const schemaFile = item.files.find((f) => f.path === 'example-schema.ts')!;
    expect(schemaFile.target).toBe('@lib/example-schema.ts');
  });

  it('example form installs at @components/example-form.tsx', () => {
    const form = item.files.find((f) => f.path === 'example-form.tsx')!;
    expect(form.target).toBe('@components/example-form.tsx');
  });

  it('no longer ships old zod-form-components.tsx or old zod-form/ targets', () => {
    const paths = item.files.map((f) => f.path);
    const targets = item.files.map((f) => f.target);
    expect(paths).not.toContain('zod-form-components.tsx');
    expect(targets).not.toContain('@components/zod-form-components.tsx');
    expect(targets).not.toContain('@lib/zod-form/schema.ts');
    expect(targets).not.toContain('@lib/zod-form/z2f.config.ts');
    expect(targets).not.toContain('@components/zod-form.tsx');
  });

  it('ships all shadcn adapter files at @components/z2f/', () => {
    const targets = item.files.map((f) => f.target);
    expect(targets).toEqual(expect.arrayContaining(ADAPTER_TARGETS));
  });

  it('config targets @/components/z2f with shadcn UI defaults', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/z2f'");
    expect(config.content).toContain("ui: 'shadcn'");
  });

  it('config carries the Base UI override shape, NOT SHADCN_OVERRIDES', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    const content = config.content!;
    // The shipped @/components/z2f components include raw Base UI Checkbox/Switch;
    // the config must NOT spread the Radix-prop SHADCN_OVERRIDES.
    expect(content).not.toContain('SHADCN_OVERRIDES');
    expect(content).not.toContain("preset: 'shadcn'");
    // Checkbox/Switch bind to Base UI checked/onCheckedChange props.
    expect(content).toContain("checked: '!!field.value'");
    expect(content).toContain("onCheckedChange: 'field.onChange'");
    expect(content).toContain('Checkbox: {');
    expect(content).toContain('Switch: {');
    // Select/RadioGroup/DatePicker keep uniform controlled adapter shape.
    expect(content).toContain('DatePicker: { controlled: true }');
    // Schema import uses the installed alias, not a bare relative path.
    expect(content).toContain("'@/lib/example-schema'");
    expect(content).not.toContain("'./schema'");
  });

  it('ExampleForm usage imports from @/components/z2f and @/lib/example-schema', () => {
    const usage = item.files.find((f) => f.path === 'example-form.tsx')!;
    expect(usage.content).toContain("import { components } from '@/components/z2f'");
    expect(usage.content).toContain("from '@/lib/example-schema'");
    expect(usage.content).toMatch(/components=\{components\}/);
  });

  it('ExampleForm usage passes componentConfig with Base UI overrides to <ZodForm>', () => {
    const usage = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = usage.content!;
    // componentConfig prop is wired to ZodForm
    expect(content).toMatch(/componentConfig=\{componentConfig\}/);
    // Checkbox/Switch are mapped to Base UI checked/onCheckedChange.
    expect(content).toContain("checked: '!!field.value'");
    expect(content).toContain("onCheckedChange: 'field.onChange'");
    expect(content).toContain('Checkbox: {');
    expect(content).toContain('Switch: {');
    // Other controlled components remain uniform adapters.
    expect(content).toContain('DatePicker: { controlled: true }');
  });

  it('has the correct $schema, registryDependencies, and docs', () => {
    expect(item.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json');
    expect(item.registryDependencies).toEqual(REGISTRY_DEPENDENCIES);
    expect(item.docs).toBe(STARTER_DOCS);
  });
});

describe('buildCodegenItem', () => {
  const item = buildCodegenItem();

  it('is named starter-codegen and drops the z2f runtime dep', () => {
    expect(item.name).toBe('starter-codegen');
    expect(item.dependencies).not.toContain('@zod-to-form/react');
    expect(item.dependencies).toEqual(
      expect.arrayContaining(['zod', 'react-hook-form', '@hookform/resolvers'])
    );
  });

  it('does NOT ship the old zod-form-components.tsx stub', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).not.toContain('zod-form-components.tsx');
  });

  it('ships all shadcn adapter files at @components/z2f/', () => {
    const targets = item.files.map((f) => f.target);
    expect(targets).toEqual(expect.arrayContaining(ADAPTER_TARGETS));
  });

  it('config componentSource points at @/components/z2f', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/z2f'");
    expect(config.content).not.toContain('zod-form-components');
    expect(config.content).not.toContain('zod-form/');
  });

  it('config carries the Base UI override shape, NOT SHADCN_OVERRIDES', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    const content = config.content!;
    expect(content).not.toContain('SHADCN_OVERRIDES');
    // Checkbox/Switch bind to Base UI checked/onCheckedChange props.
    expect(content).toContain("checked: '!!field.value'");
    expect(content).toContain("onCheckedChange: 'field.onChange'");
    expect(content).toContain('Checkbox: {');
    expect(content).toContain('Switch: {');
    // Select/RadioGroup/DatePicker keep uniform controlled adapter shape.
    expect(content).toContain('DatePicker: { controlled: true }');
    // Schema import uses the installed alias.
    expect(content).toContain("'@/lib/example-schema'");
    expect(content).not.toContain("'./schema'");
  });

  it('ships a generated form component (example-form.tsx) built from the sample schema', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx');
    expect(gen).toBeDefined();
    expect(gen!.content).toContain('useForm');
    expect(gen!.content).toContain('zodResolver');
  });

  it('generated form installs at @components/example-form.tsx', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    expect(gen.target).toBe('@components/example-form.tsx');
  });

  it('imports the schema via @/lib/example-schema (new layout), not old @/lib/zod-form/schema', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    expect(gen.content).toContain("from '@/lib/example-schema'");
    expect(gen.content).not.toContain("from '@/lib/zod-form/schema'");
    expect(gen.content).not.toMatch(/from '\.\/schema'/);
  });

  it('imports StripIndexSignature from @/components/z2f (typesModule, not inlined)', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;
    // typesModule set → import emitted, inline block NOT present
    expect(content).toContain("import type { StripIndexSignature } from '@/components/z2f'");
    expect(content).not.toContain('type StripIndexSignature<T>');
  });

  it('imports every Field* primitive it references (no undefined identifiers)', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;

    // The shadcn field template references <Field> (not <FormItem>).
    expect(content).toMatch(/import \{[^}]*Field[^}]*\} from/);
    // No Form* layout primitives should appear — they are replaced by Field*.
    expect(content).not.toMatch(/import \{[^}]*FormItem[^}]*\} from/);

    const inScope = new Set<string>();
    for (const m of content.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from/g)) {
      const names = m[1] ?? '';
      for (const raw of names.split(',')) {
        const name = (raw.trim().split(/\s+as\s+/)[0] ?? '').trim();
        if (name) inScope.add(name);
      }
    }
    for (const m of content.matchAll(/\b(?:type|function|const)\s+([A-Za-z_$][\w$]*)/g)) {
      if (m[1]) inScope.add(m[1]);
    }

    // Every Field* JSX tag used must be imported.
    const usedFieldTags = new Set<string>();
    for (const m of content.matchAll(/<\/?(Field[A-Za-z]*)(?=[\s/>])/g)) {
      if (m[1]) usedFieldTags.add(m[1]);
    }
    expect(usedFieldTags.size).toBeGreaterThan(0);
    for (const token of usedFieldTags) {
      expect(inScope.has(token), `${token} is used as a JSX tag but not imported`).toBe(true);
    }
  });

  it('imports BOTH field adapters and Field* wrappers from @/components/z2f (not old paths)', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;
    expect(content).toContain("from '@/components/z2f'");
    expect(content).not.toContain("from '@/components/ui/form'");
    expect(content).not.toContain("from '@/components/zod-form'");
    // The single import from the adapter module must include the field adapters
    // used by the sample schema AND the Field* layout wrappers.
    const adapterImport = content.split('\n').find((l) => l.includes("from '@/components/z2f'"))!;
    for (const name of ['Input', 'Checkbox', 'DatePicker', 'Field', 'FieldLabel']) {
      expect(adapterImport, `adapter import should include ${name}`).toContain(name);
    }
  });

  it('renders Checkbox via Controller with Base UI checked/onCheckedChange binding', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;
    expect(content).toMatch(/checked=\{!!field\.value\}/);
    expect(content).toMatch(/onCheckedChange=\{field\.onChange\}/);
    expect(content).not.toMatch(/=== true/);
  });

  it('renders Select via adapter (controlled value/onChange), not raw <select>', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;
    expect(content).toMatch(/<Select\b/);
    expect(content).not.toMatch(/<select\b/);
  });

  it('renders string date field (birthDate) as native Input with type=date', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;
    // z.string().date() → uncontrolled register with type="date"
    expect(content).toMatch(/type="date"/);
    // Should NOT use a DatePicker for string-date fields
    // (DatePicker is only for z.date() — the joinedAt field)
    expect(content).toMatch(/<DatePicker\b/);
  });

  it('renders z.date() field (joinedAt) via DatePicker adapter', () => {
    const gen = item.files.find((f) => f.path === 'example-form.tsx')!;
    const content = gen.content!;
    expect(content).toMatch(/<DatePicker\b/);
    expect(content).toMatch(/<Input\b/);
    expect(content).not.toMatch(/<input\b/);
  });

  it('declares the shadcn `field` registry dependency (Field* primitives)', () => {
    expect(item.registryDependencies).toContain('field');
  });

  it('does NOT declare date-picker as a registry dependency (it is an embedded owned file)', () => {
    // Listing date-picker would cause `shadcn add` to fatally fetch a non-existent registry item.
    expect(item.registryDependencies).not.toContain('date-picker');
  });

  it('does NOT declare the old `form` registry dependency', () => {
    // Generated forms now use Field* (field registry dep), not Form* (form registry dep).
    expect(item.registryDependencies).not.toContain('form');
  });
});

describe('buildViteItem', () => {
  const item = buildViteItem();

  it('is named starter-vite and dev-depends on the vite plugin', () => {
    expect(item.name).toBe('starter-vite');
    expect(item.devDependencies).toContain('@zod-to-form/vite');
  });

  it('does NOT depend on @zod-to-form/react at runtime (plugin emits self-contained generated components)', () => {
    expect(item.dependencies ?? []).not.toContain('@zod-to-form/react');
  });

  it('does NOT ship the old zod-form-components.tsx stub', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).not.toContain('zod-form-components.tsx');
  });

  it('ships all shadcn adapter files at @components/z2f/', () => {
    const targets = item.files.map((f) => f.target);
    expect(targets).toEqual(expect.arrayContaining(ADAPTER_TARGETS));
  });

  it('config componentSource points at @/components/z2f', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/z2f'");
    expect(config.content).not.toContain('zod-form-components');
    expect(config.content).not.toContain('zod-form/');
  });

  it('config carries the Base UI override shape, NOT SHADCN_OVERRIDES', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    const content = config.content!;
    expect(content).not.toContain('SHADCN_OVERRIDES');
    // Checkbox/Switch bind to Base UI checked/onCheckedChange props.
    expect(content).toContain("checked: '!!field.value'");
    expect(content).toContain("onCheckedChange: 'field.onChange'");
    expect(content).toContain('Checkbox: {');
    expect(content).toContain('Switch: {');
    // Select/RadioGroup/DatePicker keep uniform controlled adapter shape.
    expect(content).toContain('DatePicker: { controlled: true }');
    // Schema import uses the installed alias.
    expect(content).toContain("'@/lib/example-schema'");
    expect(content).not.toContain("'./schema'");
  });

  it('VITE_USAGE does NOT contain an explicit configPath argument', () => {
    const viteFile = item.files.find((f) => f.path === 'vite-usage.tsx')!;
    expect(viteFile.content).not.toContain('configPath');
    // Plugin auto-discovers root z2f.config.ts
    expect(viteFile.content).toContain('z2fVite()');
  });

  it('vite usage imports schema from @/lib/example-schema (new layout)', () => {
    const viteFile = item.files.find((f) => f.path === 'vite-usage.tsx')!;
    expect(viteFile.content).toContain("'@/lib/example-schema.ts?z2f'");
    expect(viteFile.content).not.toContain('zod-form/');
  });

  it('vite usage installs at @components/example-form.tsx', () => {
    const viteFile = item.files.find((f) => f.path === 'vite-usage.tsx')!;
    expect(viteFile.target).toBe('@components/example-form.tsx');
  });
});

describe('shipped shadcn adapter files', () => {
  const item = buildReactItem();
  const byTarget = (target: string) => item.files.find((f) => f.target === target)!;

  it('ships the index with NO .js extensions in its relative imports', () => {
    const index = byTarget('@components/z2f/index.tsx');
    expect(index.content).toBeDefined();
    // No relative specifier may keep the .js extension after the strip transform.
    expect(index.content).not.toMatch(/from\s+['"]\.\.?\/[^'"]+\.js['"]/);
    // The components map is still re-exported so the ZodForm runtime can consume it.
    expect(index.content).toContain('export const components');
  });

  it('ships all owned wrapper files with NO .js extensions in their relative imports', () => {
    // Select/RadioGroup/DatePicker ship as owned wrappers.
    // Input/Textarea/Checkbox/Switch are raw ui/* re-exports in index.tsx.
    for (const name of ['select', 'radio-group', 'date-picker']) {
      const source = readFileSync(
        fileURLToPath(new URL(`../../components/shadcn/${name}.tsx`, import.meta.url)),
        'utf8'
      );
      const shipped = byTarget(`@components/z2f/${name}.tsx`);
      // Relative specifiers (e.g. './types.js') must be stripped so consumer
      // bundlers resolve them; @/ alias and bare package imports are untouched.
      expect(shipped.content).not.toMatch(/from\s+['"]\.\.?\/[^'"]+\.js['"]/);
      // The strip transform is the ONLY change: stripping the on-disk source must
      // reproduce the shipped content exactly.
      const stripped = source.replace(/(from\s+['"])(\.\.?\/[^'"]+?)\.js(['"])/g, '$1$2$3');
      expect(shipped.content, `${name} must ship with only .js stripped`).toBe(stripped);
    }
  });

  it('ships the shared types module (ControlledFieldProps, FormFieldOption, StripIndexSignature)', () => {
    const types = byTarget('@components/z2f/types.ts');
    expect(types).toBeDefined();
    expect(types.content).toContain('ControlledFieldProps');
    expect(types.content).toContain('FormFieldOption');
    expect(types.content).toContain('StripIndexSignature');
    expect(types.type).toBe('registry:lib');
  });

  it('shipped adapter sources contain NO @zod-to-form/* import statements (zero runtime z2f dependency)', () => {
    // Every owned runtime file must be free of actual `import … from '@zod-to-form/*'` lines.
    // Comments that mention @zod-to-form are OK; only import statements are banned.
    // The only z2f touchpoint is z2f.config.ts (build-time tooling, a devDep).
    const runtimeTargets = ADAPTER_TARGETS;
    for (const target of runtimeTargets) {
      const file = byTarget(target);
      // Match actual import/export … from '@zod-to-form/...' statements
      expect(
        file.content,
        `${target} must not have import statements for @zod-to-form/*`
      ).not.toMatch(/(?:import|export)[^'"]*from\s+['"]@zod-to-form\//);
    }
  });
});

describe('buildRegistryIndex', () => {
  const index = buildRegistryIndex();

  it('lists all three starter items under the @zod-to-form namespace', () => {
    expect(index.name).toBe('@zod-to-form');
    expect(index.items.map((i) => i.name)).toEqual([
      'starter-react',
      'starter-codegen',
      'starter-vite'
    ]);
  });

  it('every item devDepends on @zod-to-form/core (the z2f.config.ts import)', () => {
    for (const item of index.items) {
      expect(item.devDependencies, item.name).toContain('@zod-to-form/core');
    }
  });

  it('index items have NO files[].content (reference-only, not inlined)', () => {
    for (const item of index.items) {
      const { name } = item;
      for (const file of item.files) {
        expect(
          file.content,
          `${name}/${file.path} must not have content in the index`
        ).toBeUndefined();
      }
    }
  });

  it('per-item builders still return files WITH content (content split is index-only)', () => {
    const reactFiles = buildReactItem().files;
    for (const f of reactFiles) {
      expect(f.content, `buildReactItem file ${f.path} must have content`).toBeDefined();
      expect(f.content!.length).toBeGreaterThan(0);
    }
  });

  it('index file targets use new @components/z2f/ layout, not old @components/zod-form/', () => {
    for (const item of index.items) {
      for (const file of item.files) {
        if (file.target) {
          expect(file.target, `${item.name}/${file.path}`).not.toContain('zod-form/');
        }
      }
    }
  });
});

describe('schema conformance', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  // Ajv 8 ships with draft-07 support but registers it under "http://" while
  // the vendored schema declares "$schema" with "https://". Strip the $schema
  // key before compiling so Ajv uses its built-in draft-07 support without a
  // meta-schema URL mismatch.
  const { $schema: _ignored, ...schemaWithoutRef } = itemSchema;
  const validate = ajv.compile(schemaWithoutRef);

  for (const build of [buildReactItem, buildCodegenItem, buildViteItem]) {
    it(`${build.name} output conforms to registry-item schema`, () => {
      const ok = validate(build());
      if (!ok) console.error(validate.errors);
      expect(ok).toBe(true);
    });
  }

  it('index items (content-stripped) also conform to registry-item schema', () => {
    for (const item of buildRegistryIndex().items) {
      const { name } = item;
      const ok = validate(item);
      if (!ok) console.error(name, validate.errors);
      expect(ok, `${name} index item failed schema validation`).toBe(true);
    }
  });
});
