import { describe, it, expect } from 'vitest';
import { buildConfigSource } from '../src/config-template.ts';

describe('buildConfigSource', () => {
  it('generates minimal config with just componentSource', () => {
    const result = buildConfigSource({ componentSource: './components' });
    expect(result).toContain("import { defineConfig } from '@zod-to-form/core'");
    expect(result).toContain("import type * as Components from './components'");
    expect(result).toContain('export default defineConfig<typeof Components>({');
    expect(result).toContain("source: './components'");
    expect(result).toContain("mode: 'submit'");
    expect(result).toContain("ui: 'html'");
  });

  it('imports SHADCN_OVERRIDES when preset is shadcn', () => {
    const result = buildConfigSource({
      componentSource: './components/ui',
      preset: 'shadcn'
    });
    expect(result).toContain('import { defineConfig, SHADCN_OVERRIDES }');
    expect(result).toContain("preset: 'shadcn'");
    expect(result).toContain('...SHADCN_OVERRIDES');
    expect(result).toContain("ui: 'shadcn'");
  });

  it('imports DEFAULT_OVERRIDES when preset is html', () => {
    const result = buildConfigSource({
      componentSource: './components',
      preset: 'html'
    });
    expect(result).toContain('import { defineConfig, DEFAULT_OVERRIDES }');
    expect(result).toContain("preset: 'html'");
    expect(result).toContain('...DEFAULT_OVERRIDES');
  });

  it('renders controlled component overrides', () => {
    const result = buildConfigSource({
      componentSource: './components',
      preset: 'shadcn',
      overrides: {
        DatePicker: { controlled: true },
        Input: { controlled: false }
      }
    });
    expect(result).toContain('DatePicker: { controlled: true }');
    expect(result).not.toContain('Input: { controlled: true }');
  });

  it('serializes both non-controlled (empty) and controlled overrides', () => {
    const result = buildConfigSource({
      componentSource: './components',
      overrides: { Input: {}, Checkbox: { controlled: true } }
    });
    expect(result).toContain('Input: {}');
    expect(result).toContain('Checkbox: { controlled: true }');
  });

  it('renders fields block with per-field overrides', () => {
    const result = buildConfigSource({
      componentSource: './components',
      fields: {
        name: { label: 'Full Name', component: 'Textarea' },
        age: { order: 2 }
      }
    });
    expect(result).toContain('fields: {');
    expect(result).toContain('\'name\': { label: "Full Name", component: "Textarea" }');
    expect(result).toContain("'age': { order: 2 }");
  });

  it('omits fields block when fields are empty', () => {
    const result = buildConfigSource({
      componentSource: './components',
      fields: {}
    });
    expect(result).not.toContain('fields: {');
  });

  it('renders schemas block with schemaExports', () => {
    const result = buildConfigSource({
      componentSource: './components',
      schemaTypeImport: './schema',
      schemaExports: ['userSchema', 'postSchema']
    });
    expect(result).toContain("import type * as ZodSchemas from './schema'");
    expect(result).toContain('<typeof Components, typeof ZodSchemas>');
    expect(result).toContain('schemas: {');
    expect(result).toContain('userSchema: {}');
    expect(result).toContain('postSchema: {}');
  });

  it('allows defaults to override computed values', () => {
    const result = buildConfigSource({
      componentSource: './components',
      preset: 'shadcn',
      defaults: { mode: 'auto-save', formProvider: true }
    });
    expect(result).toContain("mode: 'auto-save'");
    expect(result).toContain('formProvider: true');
    // preset sets ui to shadcn, should still be shadcn
    expect(result).toContain("ui: 'shadcn'");
  });

  it('uses componentTypeImport for type import when specified', () => {
    const result = buildConfigSource({
      componentSource: './components/ui',
      componentTypeImport: './types/components'
    });
    expect(result).toContain("import type * as Components from './types/components'");
    expect(result).toContain("source: './components/ui'");
  });
});
