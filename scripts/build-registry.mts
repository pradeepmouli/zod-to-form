import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildRegistryIndex,
  buildReactItem,
  buildCodegenItem,
  buildViteItem
} from '../apps/docs/registry/build/items.js';

const outDir = join(process.cwd(), 'apps', 'docs', 'static', 'r');
mkdirSync(outDir, { recursive: true });

const write = (name: string, data: unknown) =>
  writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + '\n', 'utf8');

write('registry.json', buildRegistryIndex());
write('starter-react.json', buildReactItem());
write('starter-codegen.json', buildCodegenItem());
write('starter-vite.json', buildViteItem());

console.log(`[build-registry] wrote 4 files to ${outDir}`);
