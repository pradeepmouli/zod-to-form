import { describe, it, expect } from 'vitest';
import { generateSchemaLiteFile } from '../src/schema-lite-codegen.js';
import type { SchemaLiteInfo } from '@zod-to-form/core';

describe('generateSchemaLiteFile', () => {
  const schemaPath = './schema.js';
  const exportName = 'SignupSchema';

  it('returns null when info is null (no effects)', () => {
    expect(generateSchemaLiteFile(schemaPath, exportName, null)).toBeNull();
  });

  describe('checks-only case', () => {
    const info: SchemaLiteInfo = { type: 'checks', checkCount: 2, fallthroughFields: [] };

    it('generates code that extracts checks and builds lite schema', () => {
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain("import { z } from 'zod'");
      expect(code).toContain(`import { ${exportName} } from '${schemaPath}'`);
      expect(code).toContain('z.object({}).loose()');
      expect(code).toContain('_lite.check(_c)');
      expect(code).toContain('export const schemaLite');
    });

    it('extracts checks relative to parent', () => {
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain('_parentCheckCount');
      expect(code).toContain('.slice(_parentCheckCount)');
    });
  });

  describe('transform case', () => {
    it('generates transform extraction code', () => {
      const info: SchemaLiteInfo = {
        type: 'transform',
        hasInnerChecks: false,
        hasOuterChecks: false,
        fallthroughFields: []
      };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain("import { z } from 'zod'");
      expect(code).toContain('_def.out?._zod.def.transform');
      expect(code).toContain('_lite.transform');
      expect(code).toContain('export const schemaLite');
    });

    it('includes inner checks when hasInnerChecks is true', () => {
      const info: SchemaLiteInfo = {
        type: 'transform',
        hasInnerChecks: true,
        hasOuterChecks: false,
        fallthroughFields: []
      };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain('Inner checks');
      expect(code).toContain('_inner._zod.parent');
    });

    it('includes outer checks when hasOuterChecks is true', () => {
      const info: SchemaLiteInfo = {
        type: 'transform',
        hasInnerChecks: false,
        hasOuterChecks: true,
        fallthroughFields: []
      };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain('Outer checks');
      expect(code).toContain('_def.checks');
    });

    it('includes both inner and outer checks', () => {
      const info: SchemaLiteInfo = {
        type: 'transform',
        hasInnerChecks: true,
        hasOuterChecks: true,
        fallthroughFields: []
      };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain('Inner checks');
      expect(code).toContain('Outer checks');
    });
  });

  describe('non-decomposable pipe case', () => {
    it('re-exports the original schema', () => {
      const info: SchemaLiteInfo = { type: 'original' };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain(`import { ${exportName} } from '${schemaPath}'`);
      expect(code).toContain(`export const schemaLite = ${exportName}`);
      expect(code).not.toContain('import { z }');
    });
  });

  describe('fallthrough fields', () => {
    it('includes fallthrough fields in the lite object shape', () => {
      const info: SchemaLiteInfo = {
        type: 'checks',
        checkCount: 1,
        fallthroughFields: ['email', 'name']
      };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain(`"email": ${exportName}._zod.def.shape["email"]`);
      expect(code).toContain(`"name": ${exportName}._zod.def.shape["name"]`);
    });

    it('uses empty object when no fallthrough fields', () => {
      const info: SchemaLiteInfo = { type: 'checks', checkCount: 1, fallthroughFields: [] };
      const code = generateSchemaLiteFile(schemaPath, exportName, info)!;
      expect(code).toContain('z.object({}).loose()');
    });
  });
});
