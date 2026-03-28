// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { z } from 'zod';
import type { OptimizationConfig } from '@zod-to-form/core';
import { useZodForm } from '../src/useZodForm.js';
import { wrapWithSchemaLite } from '../src/SchemaLiteSubmit.js';

describe('optimized validation', () => {
  describe('useZodForm skips zodResolver when validation.level is set', () => {
    it('returns fields and null schemaLite for simple schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional()
      });

      const optimization: OptimizationConfig = { level: 2 };
      const { result } = renderHook(() => useZodForm(schema, { optimization }));

      expect(result.current.fields).toBeDefined();
      expect(Array.isArray(result.current.fields)).toBe(true);
      expect(result.current.fields.length).toBeGreaterThan(0);
      // Simple schema has no superRefine/refine, so schemaLite is null
      expect(result.current.schemaLite).toBeNull();
      expect(result.current.schemaError).toBeNull();
    });

    it('returns non-null schemaLite for schema with superRefine', () => {
      const schema = z
        .object({
          password: z.string().min(8),
          confirm: z.string().min(8)
        })
        .superRefine((data, ctx) => {
          if (data.password !== data.confirm) {
            ctx.addIssue({
              code: 'custom',
              message: 'Passwords must match',
              path: ['confirm']
            });
          }
        });

      const optimization: OptimizationConfig = { level: 2 };
      const { result } = renderHook(() => useZodForm(schema, { optimization }));

      expect(result.current.fields).toBeDefined();
      expect(result.current.schemaLite).not.toBeNull();
      expect(result.current.schemaError).toBeNull();
    });
  });

  describe('useZodForm returns schemaLite for schema with superRefine', () => {
    it('captures superRefine at level 1', () => {
      const schema = z
        .object({
          password: z.string().min(8),
          confirm: z.string().min(8)
        })
        .superRefine((data, ctx) => {
          if (data.password !== data.confirm) {
            ctx.addIssue({
              code: 'custom',
              message: 'Passwords must match',
              path: ['confirm']
            });
          }
        });

      const optimization: OptimizationConfig = { level: 1 };
      const { result } = renderHook(() => useZodForm(schema, { optimization }));

      expect(result.current.schemaLite).not.toBeNull();
    });
  });

  describe('fields have validation strategy set when optimization enabled', () => {
    it('sets native mode for string with min and component-enforced for enum', () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(0),
        role: z.enum(['a', 'b'])
      });

      const optimization: OptimizationConfig = { level: 2 };
      const { result } = renderHook(() => useZodForm(schema, { optimization }));

      const nameField = result.current.fields.find((f) => f.key === 'name');
      const roleField = result.current.fields.find((f) => f.key === 'role');

      expect(nameField).toBeDefined();
      expect(nameField!.validation).toBeDefined();
      expect(nameField!.validation!.mode).toBe('native');

      expect(roleField).toBeDefined();
      expect(roleField!.validation).toBeDefined();
      expect(roleField!.validation!.mode).toBe('component-enforced');
    });
  });

  describe('useZodForm without validation option returns null schemaLite', () => {
    it('returns null schemaLite and normal fields without validation config', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string()
      });

      const { result } = renderHook(() => useZodForm(schema));

      expect(result.current.schemaLite).toBeNull();
      expect(result.current.fields).toBeDefined();
      expect(Array.isArray(result.current.fields)).toBe(true);
      expect(result.current.fields.length).toBe(2);
    });
  });

  describe('wrapWithSchemaLite utility', () => {
    it('calls onSubmit for valid data', () => {
      const schemaLite = z.object({ name: z.string().min(2) }).loose();
      const setError = vi.fn();
      const onSubmit = vi.fn();

      const wrapped = wrapWithSchemaLite(schemaLite, setError, onSubmit);
      wrapped({ name: 'Ada' } as Record<string, unknown>);

      expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' });
      expect(setError).not.toHaveBeenCalled();
    });

    it('calls setError and does NOT call onSubmit for invalid data', () => {
      const schemaLite = z.object({ name: z.string().min(2) }).loose();
      const setError = vi.fn();
      const onSubmit = vi.fn();

      const wrapped = wrapWithSchemaLite(schemaLite, setError, onSubmit);
      wrapped({ name: 'a' } as Record<string, unknown>);

      expect(setError).toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('name', {
        type: 'validate',
        message: expect.any(String)
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
