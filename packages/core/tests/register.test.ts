import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { registerDeep, registerFlat } from '../src/register.js';
import { walkSchema } from '../src/walker.js';
import type { FormMeta } from '../src/types.js';

describe('registerDeep', () => {
  it('registers flat metadata on the top-level schema', () => {
    const reg = z.registry<FormMeta>();
    const schema = z.object({ name: z.string() });

    registerDeep(reg, schema, { component: 'form' });

    expect(reg.get(schema)).toEqual({ component: 'form' });
  });

  it('registers fields metadata on each object field schema', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const age = z.number();
    const schema = z.object({ name, age });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Textarea', order: 1 },
        age: { component: 'Input', hidden: true }
      }
    });

    expect(reg.get(name)).toEqual({ component: 'Textarea', order: 1 });
    expect(reg.get(age)).toEqual({ component: 'Input', hidden: true });
  });

  it('does not store fields or arrayItems keys in the registry', () => {
    const reg = z.registry<FormMeta>();
    const schema = z.object({ name: z.string() });

    registerDeep(reg, schema, {
      component: 'form',
      fields: {
        name: { component: 'Input' }
      }
    });

    const meta = reg.get(schema);
    expect(meta).toEqual({ component: 'form' });
    expect(meta).not.toHaveProperty('fields');
    expect(meta).not.toHaveProperty('arrayItems');
  });

  it('registers array element metadata via arrayItems', () => {
    const reg = z.registry<FormMeta>();
    const element = z.string();
    const schema = z.object({ tags: z.array(element) });

    registerDeep(reg, schema, {
      fields: {
        tags: {
          component: 'ArrayField',
          arrayItems: { component: 'Input', order: 5 }
        }
      }
    });

    expect(reg.get(element)).toEqual({ component: 'Input', order: 5 });
  });

  it('recurses into nested objects', () => {
    const reg = z.registry<FormMeta>();
    const street = z.string();
    const city = z.string();
    const address = z.object({ street, city });
    const schema = z.object({ address });

    registerDeep(reg, schema, {
      fields: {
        address: {
          component: 'Fieldset',
          fields: {
            street: { component: 'Input' },
            city: { component: 'Input', hidden: true }
          }
        }
      }
    });

    expect(reg.get(address)).toEqual({ component: 'Fieldset' });
    expect(reg.get(street)).toEqual({ component: 'Input' });
    expect(reg.get(city)).toEqual({ component: 'Input', hidden: true });
  });

  it('recurses into array of objects', () => {
    const reg = z.registry<FormMeta>();
    const label = z.string();
    const item = z.object({ label });
    const schema = z.object({ items: z.array(item) });

    registerDeep(reg, schema, {
      fields: {
        items: {
          component: 'ArrayField',
          arrayItems: {
            component: 'Fieldset',
            fields: {
              label: { component: 'Input', order: 0 }
            }
          }
        }
      }
    });

    expect(reg.get(item)).toEqual({ component: 'Fieldset' });
    expect(reg.get(label)).toEqual({ component: 'Input', order: 0 });
  });

  it('skips fields keys not present in the schema shape', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const schema = z.object({ name });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Input' },
        nonexistent: { component: 'Textarea' }
      } as Record<string, FormMeta>
    });

    expect(reg.get(name)).toEqual({ component: 'Input' });
  });

  it('does not call registry.add when config is only traversal keys', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const schema = z.object({ name });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Input' }
      }
    });

    // Top-level schema had no flat metadata — should not be in registry
    expect(reg.get(schema)).toBeUndefined();
    expect(reg.get(name)).toEqual({ component: 'Input' });
  });

  it('integrates with walkSchema via formRegistry', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const bio = z.string();
    const schema = z.object({ name, bio });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Input', order: 0 },
        bio: { component: 'Textarea', order: 1, helpText: 'Tell us about yourself' }
      }
    });

    const fields = walkSchema(schema, { formRegistry: reg });

    expect(fields.map((f) => f.key)).toEqual(['name', 'bio']);
    expect(fields[0]?.component).toBe('Input');
    expect(fields[1]?.component).toBe('Textarea');
    expect(fields[1]?.helpText).toBe('Tell us about yourself');
  });

  it('registers metadata on optional wrapper schemas', () => {
    const reg = z.registry<FormMeta>();
    const schema = z.object({
      name: z.string(),
      bio: z.string().optional()
    });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Input' },
        bio: { component: 'Textarea' }
      }
    });

    // The shape entry for `bio` is the ZodOptional wrapper, not the inner ZodString
    const shape = (schema as any)._zod.def.shape;
    expect(reg.get(shape.bio)).toEqual({ component: 'Textarea' });
  });

  it('registers metadata on nullable wrapper schemas', () => {
    const reg = z.registry<FormMeta>();
    const schema = z.object({
      name: z.string().nullable()
    });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Input' }
      }
    });

    const shape = (schema as any)._zod.def.shape;
    expect(reg.get(shape.name)).toEqual({ component: 'Input' });
  });

  it('registers metadata on schemas with defaults', () => {
    const reg = z.registry<FormMeta>();
    const schema = z.object({
      age: z.number().default(18)
    });

    registerDeep(reg, schema, {
      fields: {
        age: { component: 'NumberInput' }
      }
    });

    const shape = (schema as any)._zod.def.shape;
    expect(reg.get(shape.age)).toEqual({ component: 'NumberInput' });
  });

  it('warns about config keys not present in the schema shape', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const reg = z.registry<FormMeta>();
    const schema = z.object({ name: z.string() });

    registerDeep(reg, schema, {
      fields: {
        name: { component: 'Input' },
        nonexistent: { component: 'Textarea' }
      } as Record<string, FormMeta>
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
    warnSpy.mockRestore();
  });
});

describe('registerFlat', () => {
  it('registers top-level field paths', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const age = z.number();
    const schema = z.object({ name, age });

    registerFlat(reg, schema, {
      name: { component: 'Input', order: 0 },
      age: { component: 'NumberInput', hidden: true }
    });

    expect(reg.get(name)).toEqual({ component: 'Input', order: 0 });
    expect(reg.get(age)).toEqual({ component: 'NumberInput', hidden: true });
  });

  it('resolves dot-path to nested object fields', () => {
    const reg = z.registry<FormMeta>();
    const street = z.string();
    const city = z.string();
    const address = z.object({ street, city });
    const schema = z.object({ address });

    registerFlat(reg, schema, {
      'address.street': { component: 'Input' },
      'address.city': { component: 'Input', hidden: true }
    });

    expect(reg.get(street)).toEqual({ component: 'Input' });
    expect(reg.get(city)).toEqual({ component: 'Input', hidden: true });
  });

  it('resolves array element via [] suffix', () => {
    const reg = z.registry<FormMeta>();
    const element = z.string();
    const schema = z.object({ tags: z.array(element) });

    registerFlat(reg, schema, {
      'tags[]': { component: 'TagInput' }
    });

    expect(reg.get(element)).toEqual({ component: 'TagInput' });
  });

  it('resolves fields inside array-of-objects via []', () => {
    const reg = z.registry<FormMeta>();
    const label = z.string();
    const item = z.object({ label });
    const schema = z.object({ items: z.array(item) });

    registerFlat(reg, schema, {
      'items[].label': { component: 'Input', order: 0 }
    });

    expect(reg.get(label)).toEqual({ component: 'Input', order: 0 });
  });

  it('skips paths that do not resolve to a schema', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const schema = z.object({ name });

    registerFlat(reg, schema, {
      name: { component: 'Input' },
      nonexistent: { component: 'Textarea' },
      'deeply.nested.missing': { component: 'Other' }
    });

    expect(reg.get(name)).toEqual({ component: 'Input' });
  });

  it('skips entries with no config', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const schema = z.object({ name });

    registerFlat(reg, schema, {
      name: undefined as unknown as FormMeta
    });

    expect(reg.get(name)).toBeUndefined();
  });

  it('resolves deeply nested dot-paths (3+ levels)', () => {
    const reg = z.registry<FormMeta>();
    const zip = z.string();
    const loc = z.object({ zip });
    const address = z.object({ loc });
    const schema = z.object({ address });

    registerFlat(reg, schema, {
      'address.loc.zip': { component: 'ZipInput' }
    });

    expect(reg.get(zip)).toEqual({ component: 'ZipInput' });
  });

  it('resolves numeric index path to array element fields', () => {
    const reg = z.registry<FormMeta>();
    const label = z.string();
    const item = z.object({ label });
    const schema = z.object({ items: z.array(item) });

    registerFlat(reg, schema, {
      'items.0.label': { component: 'Input', order: 0 }
    });

    expect(reg.get(label)).toEqual({ component: 'Input', order: 0 });
  });

  it('warns about paths that do not resolve to a schema', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const schema = z.object({ name });

    registerFlat(reg, schema, {
      name: { component: 'Input' },
      nonexistent: { component: 'Textarea' }
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
    expect(reg.get(name)).toEqual({ component: 'Input' });
    warnSpy.mockRestore();
  });

  it('registers metadata on optional wrapper schemas via flat path', () => {
    const reg = z.registry<FormMeta>();
    const schema = z.object({
      name: z.string(),
      bio: z.string().optional()
    });

    registerFlat(reg, schema, {
      bio: { component: 'Textarea' }
    });

    const shape = (schema as any)._zod.def.shape;
    expect(reg.get(shape.bio)).toEqual({ component: 'Textarea' });
  });

  it('integrates with walkSchema via formRegistry', () => {
    const reg = z.registry<FormMeta>();
    const name = z.string();
    const bio = z.string();
    const schema = z.object({ name, bio });

    registerFlat(reg, schema, {
      name: { component: 'Input', order: 0 },
      bio: { component: 'Textarea', order: 1, disabled: true }
    });

    const fields = walkSchema(schema, { formRegistry: reg });

    expect(fields.map((f) => f.key)).toEqual(['name', 'bio']);
    expect(fields[0]?.component).toBe('Input');
    expect(fields[1]?.component).toBe('Textarea');
    expect(fields[1]?.disabled).toBe(true);
  });
});
