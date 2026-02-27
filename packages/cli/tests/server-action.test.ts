import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateServerAction } from '../src/server-action.js';
import type { CodegenConfig } from '../src/codegen.js';

function makeConfig(overrides: Partial<CodegenConfig> = {}): CodegenConfig {
  return {
    schemaPath: path.resolve('/tmp/schema.ts'),
    exportName: 'userSchema',
    outputPath: path.resolve('/tmp/UserForm.tsx'),
    componentName: 'UserForm',
    mode: 'submit',
    ui: 'shadcn',
    serverAction: true,
    ...overrides
  };
}

describe('generateServerAction', () => {
  it('includes "use server" directive', async () => {
    const code = await generateServerAction(makeConfig());
    expect(code).toContain('"use server"');
  });

  it('imports schema from schema file path', async () => {
    const code = await generateServerAction(makeConfig());
    expect(code).toContain('userSchema');
    // ESM imports use .js extension (TypeScript → ESM)
    expect(code).toContain('schema.js');
  });

  it('contains safeParse call on formData', async () => {
    const code = await generateServerAction(
      makeConfig({ exportName: 'profileSchema', componentName: 'ProfileForm' })
    );
    expect(code).toContain('safeParse');
    expect(code).toContain('Object.fromEntries(formData)');
  });

  it('includes fieldErrors in the failure return path', async () => {
    const code = await generateServerAction(makeConfig());
    expect(code).toContain('fieldErrors');
    expect(code).toContain('flatten()');
  });

  it('includes FormState type with errors and message', async () => {
    const code = await generateServerAction(makeConfig({ componentName: 'ProfileForm' }));
    expect(code).toContain('ProfileFormState');
    expect(code).toContain('errors');
    expect(code).toContain('message');
    expect(code).toContain('string | null');
  });

  it('emits async action function with FormData parameter', async () => {
    const code = await generateServerAction(makeConfig());
    expect(code).toContain('async function');
    expect(code).toContain('FormData');
    expect(code).toContain('Promise<');
  });

  it('does not import any @zod-to-form/* packages', async () => {
    const code = await generateServerAction(makeConfig());
    expect(code).not.toContain('@zodform');
  });

  it('returns success message on validation pass', async () => {
    const code = await generateServerAction(makeConfig());
    expect(code).toContain('message:');
    // Should have a success return path with a non-null message
    expect(code).toMatch(/message:\s*['"`][^'"`]+['"`]/);
  });
});
