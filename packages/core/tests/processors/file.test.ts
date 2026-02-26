import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { processFile } from '../../src/processors/file.js';
import { createBaseField } from '../../src/utils.js';
import type { FormProcessorContext } from '../../src/types.js';

function createContext(): FormProcessorContext {
  return {
    processors: {},
    path: [],
    seen: new WeakSet(),
    maxDepth: 5,
    currentDepth: 0
  };
}

describe('processFile', () => {
  it('maps file to FileInput', () => {
    const schema = z.file();
    const field = createBaseField('resume', 'file');

    processFile(schema, createContext(), field, {});

    expect(field.component).toBe('FileInput');
  });

  it('keeps required=true for plain file schemas', () => {
    const schema = z.file();
    const field = createBaseField('avatar', 'file');

    processFile(schema, createContext(), field, {});

    expect(field.required).toBe(true);
  });
});