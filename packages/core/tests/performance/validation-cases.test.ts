import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createValidationCase, fixtures, freshSchema, runCase } from './validation-cases.js';

describe('measured validation cases', () => {
  for (const fixture of fixtures) {
    for (const level of [undefined, 1, 2] as const) {
      for (const compileZod of [false, true]) {
        it(`${fixture.name} level=${level ?? 'baseline'} compile=${compileZod}`, () => {
          const prepared = createValidationCase(fixture, { level, compileZod });
          expect(runCase(prepared, fixture.validInput).valid).toBe(true);
          const rejected = runCase(prepared, fixture.invalidInput);
          expect(rejected.valid).toBe(false);
          expect(rejected.message).toEqual(expect.any(String));
          if (level === 1 && compileZod) {
            expect(
              prepared.fields.some(
                (f) => f.zodSchema && f.zodSchema !== fixture.schema.shape[f.key]
              )
            ).toBe(true);
          }
        });
      }
    }
    it(`${fixture.name} setup constructs fresh child identities`, () => {
      const fresh = freshSchema(fixture.schema);
      expect(fresh).not.toBe(fixture.schema);
      const first = Object.keys(fixture.schema.shape)[0]!;
      expect(fresh.shape[first]).not.toBe(fixture.schema.shape[first]);
      expect(z.safeParse(fresh, fixture.validInput)).toEqual(
        z.safeParse(fixture.schema, fixture.validInput)
      );
    });
  }
});
