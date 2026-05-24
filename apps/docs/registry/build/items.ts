import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildConfigSource } from '@zod-to-form/codegen';
import type { RegistryItem } from './types.js';
import { REGISTRY_DEPENDENCIES, STARTER_DOCS } from './docs.js';

const SAMPLE_SCHEMA_SRC = readFileSync(
  fileURLToPath(new URL('../sample/schema.ts', import.meta.url)),
  'utf8'
);

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
import { schema } from '@/lib/zod-form/schema';

export function ExampleForm() {
  return (
    <ZodForm
      schema={schema}
      onSubmit={(_data) => {
        // handle submission
      }}
    />
  );
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
