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

/** The shadcn adapter files every starter ships. */
const ADAPTER_TARGETS = [
  '@components/zod-form/types.ts',
  '@components/zod-form/input.tsx',
  '@components/zod-form/textarea.tsx',
  '@components/zod-form/checkbox.tsx',
  '@components/zod-form/switch.tsx',
  '@components/zod-form/select.tsx',
  '@components/zod-form/radio-group.tsx',
  '@components/zod-form/date-picker.tsx',
  '@components/zod-form/index.tsx'
];

describe('sample schema', () => {
  it('walks to five named fields', () => {
    const fields = walkSchema(schema);
    expect(fields.map((f) => f.key)).toEqual(['name', 'email', 'age', 'subscribe', 'joinedAt']);
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

  it('ships schema.ts, z2f.config.ts, the shadcn adapters, and a ZodForm usage file with inlined content', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).toEqual(expect.arrayContaining(['schema.ts', 'z2f.config.ts', 'zod-form.tsx']));
    for (const f of item.files) {
      expect(f.content!.length).toBeGreaterThan(0);
      // targets use shadcn registry placeholders (@components/, @ui/, @lib/, @hooks/)
      // not the project import prefix @/
      expect(f.target).toMatch(/^@(components|ui|lib|hooks)\//);
    }
  });

  it('no longer ships the old zod-form-components.tsx stub (replaced by the adapter module)', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).not.toContain('zod-form-components.tsx');
    expect(item.files.map((f) => f.target)).not.toContain('@components/zod-form-components.tsx');
  });

  it('ships all eight shadcn adapter files at @components/zod-form/', () => {
    const targets = item.files.map((f) => f.target);
    expect(targets).toEqual(expect.arrayContaining(ADAPTER_TARGETS));
  });

  it('config targets @/components/zod-form with shadcn UI defaults', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/zod-form'");
    expect(config.content).toContain("ui: 'shadcn'");
  });

  it('config carries the adapter overrides (controlled markings), NOT SHADCN_OVERRIDES', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    const content = config.content!;
    // The shipped @/components/zod-form adapters expect plain value/onChange, so
    // the config must mark controlled adapters via `controlled: true` and must
    // NOT spread the Radix-prop SHADCN_OVERRIDES (which the adapters don't accept).
    expect(content).not.toContain('SHADCN_OVERRIDES');
    expect(content).not.toContain("preset: 'shadcn'");
    expect(content).toContain('Checkbox: { controlled: true }');
    expect(content).toContain('DatePicker: { controlled: true }');
  });

  it('ZodForm usage imports the components map from @/components/zod-form and passes it', () => {
    const usage = item.files.find((f) => f.path === 'zod-form.tsx')!;
    expect(usage.content).toContain("import { components } from '@/components/zod-form'");
    expect(usage.content).toMatch(/components=\{components\}/);
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

  it('ships all eight shadcn adapter files at @components/zod-form/', () => {
    const targets = item.files.map((f) => f.target);
    expect(targets).toEqual(expect.arrayContaining(ADAPTER_TARGETS));
  });

  it('config componentSource points at @/components/zod-form', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/zod-form'");
    expect(config.content).not.toContain('zod-form-components');
  });

  it('config carries the adapter overrides, NOT SHADCN_OVERRIDES', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    const content = config.content!;
    expect(content).not.toContain('SHADCN_OVERRIDES');
    expect(content).toContain('Checkbox: { controlled: true }');
    expect(content).toContain('DatePicker: { controlled: true }');
  });

  it('ships a generated form component built from the sample schema', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx');
    expect(gen).toBeDefined();
    expect(gen!.content).toContain('useForm');
    expect(gen!.content).toContain('zodResolver');
  });

  it('imports the schema via the @/ alias, not a relative path', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx')!;
    expect(gen.content).toContain("from '@/lib/zod-form/schema'");
    expect(gen.content).not.toMatch(/from '\.\/schema'/);
  });

  it('imports every Form* primitive it references (no undefined identifiers)', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx')!;
    const content = gen.content!;

    // At minimum, the shadcn field template references <FormItem>.
    expect(content).toMatch(/import \{[^}]*FormItem[^}]*\} from/);

    // Collect every identifier that is in scope: imported, or declared as a
    // local `type`/`function`/`const`. Local type aliases like FormData /
    // FormOutput appear as generic args (Partial<FormData>) — they are in
    // scope and must not be flagged as missing imports.
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

    // Every Form* identifier used as a JSX element (opening/closing tag) must be
    // in scope, so the generated component compiles in a consumer's project.
    // Match `<Form...` / `</Form...` only when followed by whitespace, `/`, or
    // `>` — this excludes generic type args like `Partial<FormData>`.
    const usedFormTags = new Set<string>();
    for (const m of content.matchAll(/<\/?(Form[A-Za-z]*)(?=[\s/>])/g)) {
      if (m[1]) usedFormTags.add(m[1]);
    }
    expect(usedFormTags.size).toBeGreaterThan(0);
    for (const token of usedFormTags) {
      expect(inScope.has(token), `${token} is used as a JSX tag but not imported`).toBe(true);
    }
  });

  it('imports BOTH field adapters and Form* wrappers from @/components/zod-form (not @/components/ui/form)', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx')!;
    const content = gen.content!;
    expect(content).toContain("from '@/components/zod-form'");
    expect(content).not.toContain("from '@/components/ui/form'");
    // The single import from the adapter module must include the field adapters
    // used by the sample schema AND the Form* layout wrappers.
    const adapterImport = content
      .split('\n')
      .find((l) => l.includes("from '@/components/zod-form'"))!;
    for (const name of ['Input', 'Checkbox', 'DatePicker', 'FormItem', 'FormControl']) {
      expect(adapterImport, `adapter import should include ${name}`).toContain(name);
    }
  });

  it('renders controlled fields as named adapter components, not raw HTML inputs', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx')!;
    const content = gen.content!;
    // The date field (joinedAt) must render via the DatePicker adapter, and the
    // boolean field (subscribe) via the Checkbox adapter — using the adapters'
    // value/onChange field shape, NOT raw <input>.
    expect(content).toMatch(/<DatePicker\b/);
    expect(content).toMatch(/<Checkbox\b/);
    expect(content).toMatch(/<Input\b/);
    expect(content).not.toMatch(/<input\b/);
  });

  it('declares the shadcn `form` registry dependency', () => {
    expect(item.registryDependencies).toContain('form');
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

  it('ships all eight shadcn adapter files at @components/zod-form/', () => {
    const targets = item.files.map((f) => f.target);
    expect(targets).toEqual(expect.arrayContaining(ADAPTER_TARGETS));
  });

  it('config componentSource points at @/components/zod-form', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/zod-form'");
    expect(config.content).not.toContain('zod-form-components');
  });

  it('config carries the adapter overrides, NOT SHADCN_OVERRIDES', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    const content = config.content!;
    expect(content).not.toContain('SHADCN_OVERRIDES');
    expect(content).toContain('Checkbox: { controlled: true }');
    expect(content).toContain('DatePicker: { controlled: true }');
  });
});

describe('shipped shadcn adapter files', () => {
  const item = buildReactItem();
  const byTarget = (target: string) => item.files.find((f) => f.target === target)!;

  it('ships the index with NO .js extensions in its relative imports', () => {
    const index = byTarget('@components/zod-form/index.tsx');
    expect(index.content).toBeDefined();
    // No relative specifier may keep the .js extension after the strip transform.
    expect(index.content).not.toMatch(/from\s+['"]\.\.?\/[^'"]+\.js['"]/);
    // The components are still re-exported (extensionless) so the module resolves.
    expect(index.content).toContain("from './input'");
    expect(index.content).toContain('export const components');
  });

  it('ships the seven component files with NO .js extensions in their relative imports', () => {
    for (const name of [
      'input',
      'textarea',
      'checkbox',
      'switch',
      'select',
      'radio-group',
      'date-picker'
    ]) {
      const source = readFileSync(
        fileURLToPath(new URL(`../../components/shadcn/${name}.tsx`, import.meta.url)),
        'utf8'
      );
      const shipped = byTarget(`@components/zod-form/${name}.tsx`);
      // Relative specifiers (e.g. './types.js') must be stripped so consumer
      // bundlers resolve them; @/ alias and bare package imports are untouched.
      expect(shipped.content).not.toMatch(/from\s+['"]\.\.?\/[^'"]+\.js['"]/);
      // The strip transform is the ONLY change: stripping the on-disk source must
      // reproduce the shipped content exactly.
      const stripped = source.replace(/(from\s+['"])(\.\.?\/[^'"]+?)\.js(['"])/g, '$1$2$3');
      expect(shipped.content, `${name} must ship with only .js stripped`).toBe(stripped);
    }
  });

  it('ships the shared ControlledFieldProps types module the controlled adapters import', () => {
    const types = byTarget('@components/zod-form/types.ts');
    expect(types).toBeDefined();
    expect(types.content).toContain('ControlledFieldProps');
    expect(types.type).toBe('registry:lib');
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
