import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  loadConfig,
  loadDefaultConfig,
  loadSchema,
  resolveDefaultConfigPath
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

describe('loadConfig', () => {
  it('loads a valid json config', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'component-config.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: {
            source: '@app/components'
          },
          overwrite: true,
          types: ['userSchema'],
          include: ['*Schema'],
          exclude: ['internal*'],
          fields: {
            'user.name': { component: 'Input', props: { placeholder: 'Name' } }
          }
        },
        null,
        2
      ),
      'utf8'
    );

    const config = await loadConfig(configPath);
    expect(config.components.source).toBe('@app/components');
    // top-level overwrite should be normalized to defaults.overwrite
    expect(config.defaults?.overwrite).toBe(true);
    expect(config.types).toEqual(['userSchema']);
    expect(config.fields?.['user.name']?.component).toBe('Input');
  });

  it('throws clear error for invalid include/exclude/types values', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'bad-arrays.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: {
            source: '@app/components'
          },
          include: [123]
        },
        null,
        2
      ),
      'utf8'
    );

    await expect(loadConfig(configPath)).rejects.toThrow(/include must be an array of strings/);
  });

  it('throws clear error for invalid formPrimitives values', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'bad-primitives.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: {
            source: '@app/components'
          },
          formPrimitives: {
            control: ''
          }
        },
        null,
        2
      ),
      'utf8'
    );

    await expect(loadConfig(configPath)).rejects.toThrow(
      /formPrimitives\.control must be a non-empty string/
    );
  });

  it('loads a valid ts config via jiti', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'component-config.ts');

    await writeFile(
      configPath,
      [
        'export default {',
        '  components: {',
        "    source: '@app/components',",
        '  },',
        '  fields: {',
        "    'DataForm.superType': { component: 'TypeSelector', props: { refType: 'Data' } }",
        '  }',
        '};'
      ].join('\n'),
      'utf8'
    );

    const config = await loadConfig(configPath);
    expect(config.components.source).toBe('@app/components');
    expect(config.fields?.['DataForm.superType']?.component).toBe('TypeSelector');
  });

  it('throws clear error for invalid config', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'bad-config.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: {
            source: ''
          }
        },
        null,
        2
      ),
      'utf8'
    );

    await expect(loadConfig(configPath)).rejects.toThrow(
      /components\.source must be a non-empty string/
    );
  });

  it('resolves default z2f.config.ts before component-config.ts', async () => {
    const dir = await createTempDir();
    const preferredPath = path.join(dir, 'z2f.config.ts');
    const secondaryPath = path.join(dir, 'component-config.ts');

    await writeFile(
      preferredPath,
      `export default { components: { source: '@preferred/components' } };\n`,
      'utf8'
    );
    await writeFile(
      secondaryPath,
      `export default { components: { source: '@secondary/components' } };\n`,
      'utf8'
    );

    const resolved = await resolveDefaultConfigPath(dir);
    expect(resolved).toBe(preferredPath);

    const config = await loadDefaultConfig(dir);
    expect(config?.components.source).toBe('@preferred/components');
  });

  it('falls back to component-config.ts when z2f.config.ts is absent', async () => {
    const dir = await createTempDir();
    const fallbackPath = path.join(dir, 'component-config.ts');

    await writeFile(
      fallbackPath,
      `export default { components: { source: '@fallback/components' } };\n`,
      'utf8'
    );

    const resolved = await resolveDefaultConfigPath(dir);
    expect(resolved).toBe(fallbackPath);

    const config = await loadDefaultConfig(dir);
    expect(config?.components.source).toBe('@fallback/components');
  });

  it('accepts new config shape with defaults and schemas (T049)', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'z2f.config.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: {
            source: '@app/components',
            overrides: {
              Input: {}
            }
          },
          defaults: {
            mode: 'submit',
            ui: 'shadcn',
            overwrite: true
          },
          schemas: {
            UserSchema: {
              name: 'UserForm',
              mode: 'auto-save',
              fields: {
                email: { component: 'Input', order: 1 }
              }
            }
          }
        },
        null,
        2
      ),
      'utf8'
    );

    const config = await loadConfig(configPath);
    expect(config.defaults?.mode).toBe('submit');
    expect(config.defaults?.overwrite).toBe(true);
    expect(config.schemas?.['UserSchema']?.name).toBe('UserForm');
    expect(config.schemas?.['UserSchema']?.fields?.['email']?.order).toBe(1);
  });

  it('normalizes old-style overwrite to defaults.overwrite (T049)', async () => {
    const dir = await createTempDir();
    const configPath = path.join(dir, 'z2f.config.json');

    await writeFile(
      configPath,
      JSON.stringify(
        {
          components: {
            source: '@app/components'
          },
          overwrite: true
        },
        null,
        2
      ),
      'utf8'
    );

    const config = await loadConfig(configPath);
    expect(config.defaults?.overwrite).toBe(true);
  });
});
