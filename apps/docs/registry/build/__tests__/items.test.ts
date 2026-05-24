import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../../sample/schema.js';
import { buildReactItem, buildCodegenItem, buildViteItem, buildRegistryIndex } from '../items.js';
import { REGISTRY_DEPENDENCIES, STARTER_DOCS } from '../docs.js';
import itemSchema from '../../schema/registry-item.schema.json';

describe('sample schema', () => {
  it('walks to four named fields', () => {
    const fields = walkSchema(schema);
    expect(fields.map((f) => f.key)).toEqual(['name', 'email', 'age', 'subscribe']);
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

  it('ships schema.ts, z2f.config.ts, zod-form-components.tsx, and a ZodForm usage file with inlined content', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'schema.ts',
        'z2f.config.ts',
        'zod-form-components.tsx',
        'zod-form.tsx'
      ])
    );
    for (const f of item.files) {
      expect(f.content!.length).toBeGreaterThan(0);
      // targets use shadcn registry placeholders (@components/, @ui/, @lib/, @hooks/)
      // not the project import prefix @/
      expect(f.target).toMatch(/^@(components|ui|lib|hooks)\//);
    }
  });

  it('config content is produced by buildConfigSource (shadcn preset)', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("preset: 'shadcn'");
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

  it('does NOT ship zod-form-components.tsx (self-contained generated component, no runtime map needed)', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).not.toContain('zod-form-components.tsx');
  });

  it('config componentSource points at @/components/ui/form, not the missing runtime map', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/ui/form'");
    expect(config.content).not.toContain('zod-form-components');
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

  it('does NOT ship zod-form-components.tsx (?z2f-generated forms are self-contained, no runtime map needed)', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).not.toContain('zod-form-components.tsx');
  });

  it('config componentSource points at @/components/ui/form, not the missing runtime map', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain("'@/components/ui/form'");
    expect(config.content).not.toContain('zod-form-components');
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
