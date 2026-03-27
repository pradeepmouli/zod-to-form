import { describe, it, expect } from 'vitest';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent } from '../src/index.ts';

function makeField(overrides: Partial<FormField> & { key: string }): FormField {
  return {
    component: 'Input',
    props: {},
    label: overrides.key,
    required: false,
    readOnly: false,
    hidden: false,
    disabled: false,
    deprecated: false,
    constraints: {},
    zodType: 'string',
    ...overrides
  };
}

describe('codegen optimization', () => {
  const baseConfig = {
    exportName: 'SignupSchema',
    componentName: 'SignupForm',
    mode: 'submit' as const,
    ui: 'html' as const
  };

  describe('backward compatibility (no optimization)', () => {
    it('generates zodResolver when no validationLevel', () => {
      const fields = [makeField({ key: 'name' })];
      const code = generateFormComponent(fields, baseConfig);
      expect(code).toContain('zodResolver');
      expect(code).toContain("import { zodResolver } from '@hookform/resolvers/zod'");
    });

    it('generates standard register() without validation options', () => {
      const fields = [makeField({ key: 'name' })];
      const code = generateFormComponent(fields, baseConfig);
      expect(code).toContain("register('name')");
    });
  });

  describe('optimized output (validationLevel set)', () => {
    it('omits zodResolver when all fields are native/component-enforced', () => {
      const fields = [
        makeField({
          key: 'name',
          validation: { mode: 'native', rules: { required: 'Required' } }
        }),
        makeField({
          key: 'role',
          component: 'Select',
          zodType: 'enum',
          validation: { mode: 'component-enforced' }
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      expect(code).not.toContain('zodResolver');
    });

    it('retains zod import when zodSchema fields exist', () => {
      const fields = [
        makeField({
          key: 'bio',
          validation: { mode: 'zodSchema' },
          zodSchema: {} as any
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 1 });
      expect(code).toContain("from 'zod'");
    });

    it('emits native rules in register() for native-mode fields', () => {
      const fields = [
        makeField({
          key: 'name',
          validation: {
            mode: 'native',
            rules: {
              required: 'Name is required',
              minLength: { value: 2, message: 'At least 2 chars' }
            }
          }
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      expect(code).toContain('required');
      expect(code).toContain('minLength');
    });

    it('emits validate reference for zodSchema-mode fields', () => {
      const fields = [
        makeField({
          key: 'email',
          validation: { mode: 'zodSchema' },
          zodSchema: {} as any
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 1 });
      expect(code).toContain('validate');
    });

    it('emits no validation for component-enforced fields', () => {
      const fields = [
        makeField({
          key: 'status',
          component: 'Select',
          zodType: 'enum',
          validation: { mode: 'component-enforced' }
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      // Should still have a register() call but without validation options
      expect(code).toContain("register('status')");
    });

    it('emits schemaLite submit handler when schemaLite is present', () => {
      const fields = [makeField({ key: 'name', validation: { mode: 'native', rules: {} } })];
      // Pass a mock schemaLite
      const code = generateFormComponent(fields, {
        ...baseConfig,
        validationLevel: 2,
        schemaLite: {} as any
      });
      expect(code).toContain('schemaLite');
    });
  });

  describe('no schemaLite when empty', () => {
    it('does not emit schemaLite code when schemaLite is null', () => {
      const fields = [makeField({ key: 'name', validation: { mode: 'native', rules: {} } })];
      const code = generateFormComponent(fields, {
        ...baseConfig,
        validationLevel: 2,
        schemaLite: null
      });
      expect(code).not.toContain('schemaLite');
    });
  });
});
