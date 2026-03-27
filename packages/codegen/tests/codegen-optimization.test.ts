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

  describe('L2 native rules codegen (T026)', () => {
    it('emits all native rule types correctly', () => {
      const fields = [
        makeField({
          key: 'username',
          validation: {
            mode: 'native',
            rules: {
              required: 'Username is required',
              minLength: { value: 3, message: 'Min 3 chars' },
              maxLength: { value: 50, message: 'Max 50 chars' },
              pattern: { value: /^[a-z]+$/, message: 'Lowercase only' }
            }
          }
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      expect(code).toContain('required: "Username is required"');
      expect(code).toContain('minLength: { value: 3');
      expect(code).toContain('maxLength: { value: 50');
      expect(code).toContain('pattern: { value: /^[a-z]+$/');
    });

    it('emits min/max for number fields', () => {
      const fields = [
        makeField({
          key: 'age',
          zodType: 'number',
          validation: {
            mode: 'native',
            rules: {
              min: { value: 0, message: '>= 0' },
              max: { value: 120, message: '<= 120' }
            }
          }
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      expect(code).toContain('min: { value: 0');
      expect(code).toContain('max: { value: 120');
    });

    it('does not emit hoisted const for native-mode fields', () => {
      const fields = [
        makeField({
          key: 'name',
          validation: { mode: 'native', rules: { required: 'Required' } }
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      expect(code).not.toContain('const _validate_name');
    });

    it('omits zod import when all fields are native/component-enforced and no schemaLite', () => {
      const fields = [
        makeField({
          key: 'name',
          validation: { mode: 'native', rules: { required: 'Required' } }
        }),
        makeField({
          key: 'color',
          component: 'Select',
          zodType: 'enum',
          validation: { mode: 'component-enforced' }
        })
      ];
      const code = generateFormComponent(fields, {
        ...baseConfig,
        validationLevel: 2,
        schemaLite: null
      });
      expect(code).not.toContain("import { z } from 'zod'");
      expect(code).not.toContain('import { zodResolver }');
    });

    it('retains zod import when at least one zodSchema field exists', () => {
      const fields = [
        makeField({
          key: 'name',
          validation: { mode: 'native', rules: { required: 'Required' } }
        }),
        makeField({
          key: 'bio',
          validation: { mode: 'zodSchema' },
          zodSchema: {} as any
        })
      ];
      const code = generateFormComponent(fields, { ...baseConfig, validationLevel: 2 });
      expect(code).toContain("from 'zod'");
    });
  });
});
