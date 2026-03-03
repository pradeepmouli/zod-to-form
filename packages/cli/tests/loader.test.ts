import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  loadComponentConfig,
  loadDefaultComponentConfig,
  loadSchema,
  resolveDefaultComponentConfigPath
} from '../src/loader.js';

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

describe('loadComponentConfig', () => {
  it('loads a valid json component config', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'component-config.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: '@app/components',
          overwrite: true,
          types: ['userSchema'],
          include: ['*Schema'],
          exclude: ['internal*'],
          fieldTypes: {
            string: { component: 'Input' }
          },
          fields: {
            'user.name': { fieldType: 'string', props: { placeholder: 'Name' } }
          }
        },
        null,
        2
      ),
      'utf8'
    );

    const config = await loadComponentConfig(configPath);
    expect(config.components).toBe('@app/components');
    expect(config.overwrite).toBe(true);
    expect(config.types).toEqual(['userSchema']);
    expect(config.fieldTypes['string']?.component).toBe('Input');
    expect(config.fields?.['user.name']?.fieldType).toBe('string');
  });

  it('throws clear error for invalid include/exclude/types values', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'bad-arrays.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: '@app/components',
          fieldTypes: {
            string: { component: 'Input' }
          },
          include: [123]
        },
        null,
        2
      ),
      'utf8'
    );

    await expect(loadComponentConfig(configPath)).rejects.toThrow(
      /include must be an array of strings/
    );
  });

  it('loads a valid ts component config via jiti', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'component-config.ts');

    await writeFile(
      configPath,
      [
        'export default {',
        "  components: '@app/components',",
        '  fieldTypes: {',
        "    'cross-ref': { component: 'TypeSelector' }",
        '  },',
        '  fields: {',
        "    'DataForm.superType': { fieldType: 'cross-ref', props: { refType: 'Data' } }",
        '  }',
        '};'
      ].join('\n'),
      'utf8'
    );

    const config = await loadComponentConfig(configPath);
    expect(config.components).toBe('@app/components');
    expect(config.fieldTypes['cross-ref']?.component).toBe('TypeSelector');
  });

  it('throws clear error for invalid component config', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'bad-config.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: '',
          fieldTypes: {}
        },
        null,
        2
      ),
      'utf8'
    );

    await expect(loadComponentConfig(configPath)).rejects.toThrow(
      /components must be a non-empty string/
    );
  });

  it('resolves default component-config.ts before legacy z2f.config.ts', async () => {
    const dir = await createTempDir();
    const preferredPath = path.join(dir, 'component-config.ts');
    const legacyPath = path.join(dir, 'z2f.config.ts');

    await writeFile(
      preferredPath,
      `export default { components: '@new/components', fieldTypes: { string: { component: 'Input' } } };\n`,
      'utf8'
    );
    await writeFile(
      legacyPath,
      `export default { components: '@legacy/components', fieldTypes: { string: { component: 'Input' } } };\n`,
      'utf8'
    );

    const resolved = await resolveDefaultComponentConfigPath(dir);
    expect(resolved).toBe(preferredPath);

    const config = await loadDefaultComponentConfig(dir);
    expect(config?.components).toBe('@new/components');
  });

  it('falls back to legacy z2f.config.ts when component-config is absent', async () => {
    const dir = await createTempDir();
    const legacyPath = path.join(dir, 'z2f.config.ts');

    await writeFile(
      legacyPath,
      `export default { components: '@legacy/components', fieldTypes: { string: { component: 'Input' } } };\n`,
      'utf8'
    );

    const resolved = await resolveDefaultComponentConfigPath(dir);
    expect(resolved).toBe(legacyPath);

    const config = await loadDefaultComponentConfig(dir);
    expect(config?.components).toBe('@legacy/components');
  });
});
