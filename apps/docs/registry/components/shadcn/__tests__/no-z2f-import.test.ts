import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
describe('shipped adapters carry zero @zod-to-form imports', () => {
  const dir = join(__dirname, '..');
  const files = readdirSync(dir).filter(
    (n) => (n.endsWith('.tsx') || n.endsWith('.ts')) && n !== 'types.ts'
  );
  for (const f of files) {
    it(`${f} has no @zod-to-form import`, () => {
      const src = readFileSync(join(dir, f), 'utf8');
      // Match only actual import/require statements, not comments or doc strings.
      const importLines = src
        .split('\n')
        .filter((line) => /^\s*(import|export)\b/.test(line) || /\brequire\s*\(/.test(line));
      expect(importLines.join('\n')).not.toMatch(/@zod-to-form\//);
    });
  }
});
