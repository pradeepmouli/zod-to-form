import { Bench } from 'tinybench';
import { walkSchema } from '../../src/walker.js';
import { smallSchema, mediumSchema, largeSchema } from './schemas.js';

const schemas = [
  { name: 'small (5 fields)', schema: smallSchema },
  { name: 'medium (18 fields)', schema: mediumSchema },
  { name: 'large (50 fields)', schema: largeSchema }
] as const;

async function main() {
  for (const { name, schema } of schemas) {
    const bench = new Bench({ name });
    bench
      .add('no optimization', () => {
        walkSchema(schema as never);
      })
      .add('L1', () => {
        walkSchema(schema as never, { optimization: { level: 1 } });
      })
      .add('L2', () => {
        walkSchema(schema as never, { optimization: { level: 2 } });
      });

    await bench.run();
    console.log(name);
    console.table(bench.table());
  }
}

main();
