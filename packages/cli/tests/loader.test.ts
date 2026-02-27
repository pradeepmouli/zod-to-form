import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadSchema } from '../src/loader.js';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'zodform-cli-loader-'));
}

describe('loadSchema', () => {
  it('loads a named exported zod schema from ts file via jiti', async () => {
    const dir = await createTempDir();
    const schemaPath = path.join(dir, 'schema.ts');

    await writeFile(
      schemaPath,
      `import { z } from 'zod';\nexport const userSchema = z.object({ name: z.string() });\n`,
      'utf8'
    );

    const schema = await loadSchema(schemaPath, 'userSchema');
    expect(schema).toBeTruthy();
    expect((schema as { _zod?: unknown })._zod).toBeDefined();
  });

  it('throws clear error when schema file is missing', async () => {
    const missingPath = path.join(await createTempDir(), 'missing.ts');

    await expect(loadSchema(missingPath, 'userSchema')).rejects.toThrow(
      /Unable to load schema file/
    );
  });

  it('throws clear error when export is not found', async () => {
    const dir = await createTempDir();
    const schemaPath = path.join(dir, 'schema.ts');

    await writeFile(
      schemaPath,
      `import { z } from 'zod';\nexport const somethingElse = z.string();\n`,
      'utf8'
    );

    await expect(loadSchema(schemaPath, 'userSchema')).rejects.toThrow(/was not found/);
  });

  it('throws clear error when export is not a zod schema', async () => {
    const dir = await createTempDir();
    const schemaPath = path.join(dir, 'schema.ts');

    await writeFile(schemaPath, `export const userSchema = { foo: 'bar' };\n`, 'utf8');

    await expect(loadSchema(schemaPath, 'userSchema')).rejects.toThrow(/is not a Zod schema/);
  });
});
