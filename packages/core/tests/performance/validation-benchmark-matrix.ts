import { bench, describe } from 'vitest';
import { z } from 'zod';
import { prepareValidationSchema } from '../../src/index.js';
import { createValidationCase, fixtures, freshSchema, runCase } from './validation-cases.js';

export let lastMeasurement: unknown;

/** Shared registration ensures Node and Chromium measure identical fixtures and work. */
export function registerValidationBenchmarks(): void {
  for (const fixture of fixtures) {
    for (const level of [undefined, 1, 2] as const) {
      const strategy = level === undefined ? 'baseline' : `L${level}`;
      describe(`validation / ${fixture.name} / ${strategy}`, () => {
        for (const compileZod of [false, true]) {
          const prepared = createValidationCase(fixture, { level, compileZod });
          bench(`compile=${compileZod} input=valid outcome=accepted`, () => {
            lastMeasurement = runCase(prepared, fixture.validInput);
          });
          bench(`compile=${compileZod} input=invalid outcome=rejected`, () => {
            lastMeasurement = runCase(prepared, fixture.invalidInput);
          });
          bench(`compile=${compileZod} setup=fresh-schema`, () => {
            lastMeasurement = createValidationCase(
              { ...fixture, schema: freshSchema(fixture.schema) },
              { level, compileZod }
            );
          });
        }
      });
    }
    describe(`boolean-only / ${fixture.name} / baseline`, () => {
      for (const compileZod of [false, true]) {
        const schema = prepareValidationSchema(fixture.schema, { compileZod });
        bench(`compile=${compileZod} input=valid validate`, () => {
          lastMeasurement = z.validate(schema, fixture.validInput);
        });
        bench(`compile=${compileZod} input=invalid validate`, () => {
          lastMeasurement = z.validate(schema, fixture.invalidInput);
        });
      }
    });
  }
  const escapeSchema = z
    .string()
    .min(3)
    .refine((value) => value.startsWith('A'), 'Must start with A');
  for (const level of [1, 2] as const) {
    describe(`escape-hatch / refined-string / L${level}`, () => {
      for (const compileZod of [false, true]) {
        const prepared = createValidationCase(
          {
            name: 'escape',
            schema: z.object({ name: escapeSchema }),
            validInput: { name: 'Alice' },
            invalidInput: { name: 'Bob' }
          },
          { level, compileZod }
        );
        bench(`compile=${compileZod} input=valid outcome=accepted`, () => {
          lastMeasurement = prepared.run({ name: 'Alice' });
        });
        bench(`compile=${compileZod} input=invalid outcome=rejected`, () => {
          lastMeasurement = prepared.run({ name: 'Bob' });
        });
      }
    });
  }
}
