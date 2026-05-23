# z2f shadcn Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a static shadcn registry under the `@zod-to-form` namespace (three starter items — `starter-react`, `starter-codegen`, `starter-vite`) served from `zod.toform.dev/r/*`, generated at build time, so zod-to-form is installable via `npx shadcn add` and submittable to the shadcn directory.

**Architecture:** A Node build script (run via `tsx`) generates `registry.json` + three `starter-*.json` item files into `apps/docs/static/r/`. It reuses `@zod-to-form/codegen`'s `buildConfigSource` (the same generator `z2f init` uses) for the shipped `z2f.config.ts`, and `@zod-to-form/core` `walkSchema` + `@zod-to-form/codegen` `generateFormComponent` for the codegen item's `.tsx`. Output is committed and served statically by the existing Cloudflare Pages docs deploy (Docusaurus serves `static/` at the site root). No Worker, no runtime config generation, no new secrets.

**Tech Stack:** TypeScript (strict), `tsx`, `@zod-to-form/core`, `@zod-to-form/codegen`, Zod v4, Vitest, Ajv (JSON-schema validation in tests).

**Spec:** `docs/superpowers/specs/2026-05-21-z2f-shadcn-registry-design.md`

---

## File Structure

- `apps/docs/registry/sample/schema.ts` — the sample Zod schema shipped in every item (source of truth for generation + the `schema.ts` file users receive).
- `apps/docs/registry/build/types.ts` — TypeScript types for the shadcn registry + registry-item JSON we emit.
- `apps/docs/registry/build/items.ts` — pure functions that build each item object (`buildReactItem`, `buildCodegenItem`, `buildViteItem`) and the index (`buildRegistryIndex`). No file I/O — fully unit-testable.
- `apps/docs/registry/build/docs.ts` — the shared `docs` string (init + playground guidance) and the shared `registryDependencies` list.
- `apps/docs/registry/schema/registry-item.schema.json` — vendored copy of shadcn's `registry-item.json` JSON Schema, used by tests for conformance.
- `scripts/build-registry.mts` — orchestrator: imports the sample schema, calls the item builders, writes `apps/docs/static/r/*.json`.
- `apps/docs/registry/build/__tests__/items.test.ts` — Vitest unit + schema-conformance tests.
- `apps/docs/static/r/registry.json`, `starter-react.json`, `starter-codegen.json`, `starter-vite.json` — generated output (committed).
- `package.json` (root) — add `registry:build` script + wire into docs build.

---

## Task 1: Sample schema fixture

**Files:**
- Create: `apps/docs/registry/sample/schema.ts`
- Test: `apps/docs/registry/build/__tests__/items.test.ts`

- [ ] **Step 1: Write the sample schema**

```ts
// apps/docs/registry/sample/schema.ts
import { z } from 'zod';

export const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .meta({ title: 'Name', examples: ['Jane Doe'] }),
  email: z
    .string()
    .email('Please enter a valid email')
    .meta({ title: 'Email', examples: ['jane@example.com'] }),
  age: z.number().min(18, 'Must be at least 18').optional().meta({ title: 'Age' }),
  subscribe: z.boolean().default(false).meta({ title: 'Subscribe to updates' })
});
```

- [ ] **Step 2: Write a failing test that the schema walks to 4 fields**

```ts
// apps/docs/registry/build/__tests__/items.test.ts
import { describe, it, expect } from 'vitest';
import { walkSchema } from '@zod-to-form/core';
import { schema } from '../../sample/schema.js';

describe('sample schema', () => {
  it('walks to four named fields', () => {
    const fields = walkSchema(schema, {});
    expect(fields.map((f) => f.name)).toEqual(['name', 'email', 'age', 'subscribe']);
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
(If the docs package has no vitest config yet, add a minimal `apps/docs/vitest.config.ts` mirroring `apps/playground/vitest.config.ts`, then re-run.)
Expected: PASS — `walkSchema` returns the four fields in order.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/registry/sample/schema.ts apps/docs/registry/build/__tests__/items.test.ts
git commit -m "feat(registry): add sample schema fixture for z2f shadcn registry"
```

---

## Task 2: Registry types + shared docs/deps

**Files:**
- Create: `apps/docs/registry/build/types.ts`
- Create: `apps/docs/registry/build/docs.ts`

- [ ] **Step 1: Write the registry types**

```ts
// apps/docs/registry/build/types.ts
export type RegistryItemFile = {
  path: string;
  type: 'registry:file' | 'registry:component' | 'registry:lib';
  content: string;
  target: string;
};

export type RegistryItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json';
  name: string;
  type: 'registry:block';
  title: string;
  description: string;
  dependencies: string[];
  devDependencies?: string[];
  registryDependencies: string[];
  files: RegistryItemFile[];
  docs: string;
};

export type RegistryIndex = {
  $schema: 'https://ui.shadcn.com/schema/registry.json';
  name: '@zod-to-form';
  homepage: 'https://zod.toform.dev';
  items: RegistryItem[];
};
```

- [ ] **Step 2: Write shared docs + registryDependencies**

```ts
// apps/docs/registry/build/docs.ts
export const REGISTRY_DEPENDENCIES = ['input', 'label', 'checkbox', 'button'];

export const STARTER_DOCS = [
  'This starter ships a sample Zod schema and a z2f config wired to shadcn components.',
  '',
  'Next steps:',
  '1. Re-generate the config for YOUR components and schemas:',
  '   npx @zod-to-form/cli init',
  '2. Design and iterate your schema visually in the playground:',
  '   https://zod.toform.dev/play/'
].join('\n');
```

- [ ] **Step 3: Commit**

```bash
git add apps/docs/registry/build/types.ts apps/docs/registry/build/docs.ts
git commit -m "feat(registry): add registry item types and shared docs/deps"
```

---

## Task 3: `buildReactItem` (default mode)

**Files:**
- Create: `apps/docs/registry/build/items.ts`
- Test: `apps/docs/registry/build/__tests__/items.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// add to apps/docs/registry/build/__tests__/items.test.ts
import { buildReactItem } from '../items.js';

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

  it('ships schema.ts, z2f.config.ts, and a ZodForm usage file with inlined content', () => {
    const paths = item.files.map((f) => f.path);
    expect(paths).toEqual(
      expect.arrayContaining(['schema.ts', 'z2f.config.ts', 'zod-form.tsx'])
    );
    for (const f of item.files) {
      expect(f.content.length).toBeGreaterThan(0);
      expect(f.target.startsWith('@/')).toBe(true);
    }
  });

  it('config content is produced by buildConfigSource (shadcn preset)', () => {
    const config = item.files.find((f) => f.path === 'z2f.config.ts')!;
    expect(config.content).toContain('defineConfig');
    expect(config.content).toContain('shadcn');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: FAIL — `buildReactItem` is not exported.

- [ ] **Step 3: Implement `buildReactItem`**

```ts
// apps/docs/registry/build/items.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildConfigSource } from '@zod-to-form/codegen';
import type { RegistryItem } from './types.js';
import { REGISTRY_DEPENDENCIES, STARTER_DOCS } from './docs.js';

const SAMPLE_SCHEMA_SRC = readFileSync(
  fileURLToPath(new URL('../sample/schema.ts', import.meta.url)),
  'utf8'
);

// The config the registry ships. Targets the conventional alias path that
// `init`'s inferComponentModulePath defaults to, so it works for
// convention-following shadcn projects without their components.json.
function sampleConfigSource(): string {
  return buildConfigSource({
    componentSource: '@/components/zod-form-components',
    componentTypeImport: '@/components/zod-form-components',
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
import { schema } from './schema';

export function ExampleForm() {
  return <ZodForm schema={schema} onSubmit={(data) => console.log(data)} />;
}
`;

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
        target: '@/lib/zod-form/schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource(),
        target: '@/lib/zod-form/z2f.config.ts'
      },
      {
        path: 'zod-form.tsx',
        type: 'registry:component',
        content: ZOD_FORM_USAGE,
        target: '@/components/zod-form.tsx'
      }
    ],
    docs: STARTER_DOCS
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: PASS — all `buildReactItem` assertions green. (If the config-content assertions fail, open `buildConfigSource` output once and align the expected substrings — `defineConfig`/`shadcn` — to the real generator output.)

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/build/items.ts apps/docs/registry/build/__tests__/items.test.ts
git commit -m "feat(registry): build starter-react item (runtime ZodForm mode)"
```

---

## Task 4: `buildCodegenItem` (owned generated component)

**Files:**
- Modify: `apps/docs/registry/build/items.ts`
- Test: `apps/docs/registry/build/__tests__/items.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// add to items.test.ts
import { buildCodegenItem } from '../items.js';

describe('buildCodegenItem', () => {
  const item = buildCodegenItem();

  it('is named starter-codegen and drops the z2f runtime dep', () => {
    expect(item.name).toBe('starter-codegen');
    expect(item.dependencies).not.toContain('@zod-to-form/react');
    expect(item.dependencies).toEqual(
      expect.arrayContaining(['zod', 'react-hook-form', '@hookform/resolvers'])
    );
  });

  it('ships a generated form component built from the sample schema', () => {
    const gen = item.files.find((f) => f.path === 'generated-form.tsx');
    expect(gen).toBeDefined();
    expect(gen!.content).toContain('useForm');
    expect(gen!.content).toContain('zodResolver');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: FAIL — `buildCodegenItem` not exported.

- [ ] **Step 3: Implement `buildCodegenItem`**

```ts
// add to apps/docs/registry/build/items.ts
import { walkSchema } from '@zod-to-form/core';
import { generateFormComponent } from '@zod-to-form/codegen';
import { schema } from '../sample/schema.js';

function generatedComponentSource(): string {
  const fields = walkSchema(schema, {});
  // Mirror the CLI's CodegenConfig shape (see packages/cli/src/index.ts:254).
  return generateFormComponent(fields, {
    exportName: 'schema',
    componentName: 'GeneratedForm',
    schemaImportPath: './schema',
    ui: 'shadcn',
    mode: 'submit',
    formProvider: false
  });
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
    registryDependencies: REGISTRY_DEPENDENCIES,
    files: [
      {
        path: 'schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@/lib/zod-form/schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource(),
        target: '@/lib/zod-form/z2f.config.ts'
      },
      {
        path: 'generated-form.tsx',
        type: 'registry:component',
        content: generatedComponentSource(),
        target: '@/components/generated-form.tsx'
      }
    ],
    docs: STARTER_DOCS
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: PASS. (If `generateFormComponent`'s required `CodegenConfig` fields differ from the object above, open `packages/cli/src/index.ts` around line 254 and copy the exact required fields — do not invent new ones.)

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/build/items.ts apps/docs/registry/build/__tests__/items.test.ts
git commit -m "feat(registry): build starter-codegen item (owned generated component)"
```

---

## Task 5: `buildViteItem` + `buildRegistryIndex`

**Files:**
- Modify: `apps/docs/registry/build/items.ts`
- Test: `apps/docs/registry/build/__tests__/items.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// add to items.test.ts
import { buildViteItem, buildRegistryIndex } from '../items.js';

describe('buildViteItem', () => {
  const item = buildViteItem();
  it('is named starter-vite and dev-depends on the vite plugin', () => {
    expect(item.name).toBe('starter-vite');
    expect(item.devDependencies).toContain('@zod-to-form/vite');
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
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: FAIL — `buildViteItem` / `buildRegistryIndex` not exported.

- [ ] **Step 3: Implement both**

```ts
// add to apps/docs/registry/build/items.ts
import type { RegistryIndex } from './types.js';

const VITE_USAGE = `// vite.config.ts — add the z2f plugin:
//   import { z2f } from '@zod-to-form/vite';
//   export default defineConfig({ plugins: [z2f()] });
//
// then import the generated form from your schema:
import Form from './schema.ts?z2f';
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
    registryDependencies: REGISTRY_DEPENDENCIES,
    files: [
      {
        path: 'schema.ts',
        type: 'registry:lib',
        content: SAMPLE_SCHEMA_SRC,
        target: '@/lib/zod-form/schema.ts'
      },
      {
        path: 'z2f.config.ts',
        type: 'registry:lib',
        content: sampleConfigSource(),
        target: '@/lib/zod-form/z2f.config.ts'
      },
      {
        path: 'vite-usage.tsx',
        type: 'registry:component',
        content: VITE_USAGE,
        target: '@/components/zod-form-vite.tsx'
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/registry/build/items.ts apps/docs/registry/build/__tests__/items.test.ts
git commit -m "feat(registry): build starter-vite item and registry index"
```

---

## Task 6: JSON-Schema conformance test

**Files:**
- Create: `apps/docs/registry/schema/registry-item.schema.json`
- Modify: `apps/docs/registry/build/__tests__/items.test.ts`
- Modify: `apps/docs/package.json` (add `ajv` devDependency)

- [ ] **Step 1: Vendor the shadcn registry-item schema**

Run: `curl -sS https://ui.shadcn.com/schema/registry-item.json -o apps/docs/registry/schema/registry-item.schema.json`
Then open the file and confirm it is a valid JSON Schema (has `$schema` / `properties`). This is a real fetch, not a placeholder — if the URL 404s, get the schema from `shadcn-ui/ui` repo `packages/shadcn/src/registry/schema.ts`.

- [ ] **Step 2: Add `ajv` and write the failing conformance test**

Run: `pnpm --filter @zod-to-form/docs add -D ajv`

```ts
// add to items.test.ts
import Ajv from 'ajv';
import itemSchema from '../../schema/registry-item.schema.json';
import { buildReactItem, buildCodegenItem, buildViteItem } from '../items.js';

describe('schema conformance', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(itemSchema);

  for (const build of [buildReactItem, buildCodegenItem, buildViteItem]) {
    it(`${build.name} output conforms to registry-item schema`, () => {
      const ok = validate(build());
      if (!ok) console.error(validate.errors);
      expect(ok).toBe(true);
    });
  }
});
```

- [ ] **Step 3: Run it**

Run: `pnpm --filter @zod-to-form/docs exec vitest run apps/docs/registry/build/__tests__/items.test.ts`
Expected: PASS. If it fails, the printed `validate.errors` name the exact non-conforming field — fix the offending property in `items.ts` (e.g. an unsupported `type` enum value or missing required field) and re-run. Do NOT relax the schema.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/registry/schema/registry-item.schema.json apps/docs/registry/build/__tests__/items.test.ts apps/docs/package.json pnpm-lock.yaml
git commit -m "test(registry): validate generated items against shadcn registry-item schema"
```

---

## Task 7: Build script + output files

**Files:**
- Create: `scripts/build-registry.mts`
- Modify: `package.json` (root) — add `registry:build` script
- Create (generated): `apps/docs/static/r/registry.json`, `starter-react.json`, `starter-codegen.json`, `starter-vite.json`

- [ ] **Step 1: Write the build script**

```ts
// scripts/build-registry.mts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildRegistryIndex,
  buildReactItem,
  buildCodegenItem,
  buildViteItem
} from '../apps/docs/registry/build/items.js';

const outDir = join(process.cwd(), 'apps', 'docs', 'static', 'r');
mkdirSync(outDir, { recursive: true });

const write = (name: string, data: unknown) =>
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + '\n', 'utf8');

write('registry.json', buildRegistryIndex());
write('starter-react.json', buildReactItem());
write('starter-codegen.json', buildCodegenItem());
write('starter-vite.json', buildViteItem());

console.log(`[build-registry] wrote 4 files to ${outDir}`);
```

- [ ] **Step 2: Add the root npm script**

In root `package.json` `"scripts"`, add:

```json
"registry:build": "tsx scripts/build-registry.mts"
```

- [ ] **Step 3: Run the build script**

Run: `pnpm registry:build`
Expected: `[build-registry] wrote 4 files to .../apps/docs/static/r` and four JSON files exist.

- [ ] **Step 4: Sanity-check the output**

Run: `cat apps/docs/static/r/registry.json | head -20` and confirm `name` is `@zod-to-form` and `items` lists the three starters. Run `cat apps/docs/static/r/starter-react.json` and confirm `files[].content` is populated (not empty).

- [ ] **Step 5: Commit (script + generated output)**

```bash
git add scripts/build-registry.mts package.json apps/docs/static/r/
git commit -m "feat(registry): add build-registry script and generated registry files"
```

---

## Task 8: Wire into the docs build (prevent stale output)

**Files:**
- Modify: `package.json` (root) and/or `scripts/build-combined.mts`
- Test: manual

- [ ] **Step 1: Run the registry build before the docs build**

Open `scripts/build-combined.mts`. Immediately before the Docusaurus build step, add a call to run `registry:build` (so `static/r/*` is fresh before `static/` is published). Concretely, near the top of the build sequence add:

```ts
run('Building registry (shadcn)', 'pnpm registry:build');
```

(Use the same `run(label, cmd)` helper the file already uses for the playground build.)

- [ ] **Step 2: Add a CI freshness guard**

In root `package.json` `"scripts"`, add a check that fails if committed output is stale:

```json
"registry:check": "pnpm registry:build && git diff --exit-code apps/docs/static/r/"
```

- [ ] **Step 3: Verify the guard**

Run: `pnpm registry:check`
Expected: exit 0 (no diff) immediately after Task 7's commit. If it reports a diff, commit the regenerated files.

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/build-combined.mts
git commit -m "build(registry): regenerate registry in combined build + add freshness check"
```

---

## Task 9: Local end-to-end smoke test (manual, gated before submission)

**Files:** none (verification only)

- [ ] **Step 1: Serve the built docs locally**

Run: `pnpm --filter @zod-to-form/docs build && pnpm --filter @zod-to-form/docs serve`
Confirm `http://localhost:3000/r/registry.json` and `http://localhost:3000/r/starter-react.json` return the JSON (HTTP 200).

- [ ] **Step 2: Install into a throwaway shadcn app for each mode**

In a scratch dir: `npx create-next-app@latest scratch --yes && cd scratch && npx shadcn@latest init --yes`, then for each item:

Run: `npx shadcn@latest add http://localhost:3000/r/starter-react.json`
Run: `npx shadcn@latest add http://localhost:3000/r/starter-codegen.json`
Run: `npx shadcn@latest add http://localhost:3000/r/starter-vite.json`
Expected: files land at the aliased paths (`lib/zod-form/schema.ts`, `components/...`), `input`/`label`/`checkbox`/`button` get pulled in via `registryDependencies`, and `package.json` gains the listed deps.

- [ ] **Step 3: Record results**

Note any failures (alias resolution, missing primitive, schema rejection) and fix in `items.ts`, then re-run `pnpm registry:build` and re-test. This step gates the directory submission (separate follow-on, see spec §"Directory submission").

---

## Self-Review

- **Spec coverage:** static files (T7), 3 named items all modes (T3–T5), `buildConfigSource` at build time (T3), codegen via walkSchema+generateFormComponent (T4), inlined content + alias targets (T3–T5), schema conformance (T6), hosting via `static/r/` + freshness guard (T7–T8), smoke test + directory follow-on (T9). Covered.
- **Placeholders:** none — every code step has concrete content; the two "align to real output" notes (config substrings in T3, CodegenConfig fields in T4) point at exact source locations to copy from rather than inventing APIs.
- **Type consistency:** `RegistryItem`/`RegistryIndex`/`RegistryItemFile` defined in T2 and used unchanged in T3–T7; `buildReactItem`/`buildCodegenItem`/`buildViteItem`/`buildRegistryIndex` names consistent across tasks and the build script.

---

## Risks / notes for the implementer

- `generateFormComponent`'s `CodegenConfig` is re-exported from `@zod-to-form/core`; if the minimal object in Task 4 is missing a required field, copy the exact shape from `packages/cli/src/index.ts` (~line 254) — never guess field names.
- `buildConfigSource` output wording (`defineConfig`, `shadcn`) drives the Task 3 assertions; if the generator emits different identifiers, align the test to the real output (the generator is the source of truth).
- The vendored JSON Schema (T6) can lag shadcn; if conformance is over-strict, prefer fetching the current schema over loosening assertions.
- Directory submission (adding the `@zod-to-form` entry to `shadcn-ui/ui` `directory.json` + SVG logo) is a separate follow-on after T9 passes — tracked in the spec, not this plan.
