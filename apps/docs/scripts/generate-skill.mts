/**
 * Post-build hook: extract the Docusaurus docs tree and render a single
 * top-level SKILL.md into the build output. Deployed alongside the static
 * site so consumers can fetch it from the Pages artifact.
 */
import { extractDocusaurusDocs } from '@to-skills/docusaurus';
import { renderSkill } from '@to-skills/core';
import type { ExtractedSkill } from '@to-skills/core';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const documents = extractDocusaurusDocs({
  projectRoot,
  docsDir: 'docs',
  excludeApi: true,
  maxDocs: 20
});

const skill: ExtractedSkill = {
  name: 'zod-to-form',
  description:
    'Guide for generating type-safe React Hook Form components from Zod v4 schemas — either rendered at runtime with <ZodForm> or emitted as static .tsx files via the zodform generate CLI. Use when setting up zod-to-form, writing component configs, or wiring the runtime and CLI paths.',
  packageDescription:
    'zod-to-form generates type-safe React Hook Form components from Zod v4 schemas at runtime (via <ZodForm>) or at build time (via the zodform CLI).',
  license: 'MIT',
  repository: 'https://github.com/pradeepmouli/zod-to-form',
  keywords: ['zod', 'react', 'react-hook-form', 'form', 'codegen', 'zod-to-form'],
  documents,
  functions: [],
  classes: [],
  types: [],
  enums: [],
  variables: [],
  examples: []
};

const rendered = renderSkill(skill);

const buildDir = resolve(projectRoot, 'build');
if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

const outPath = resolve(buildDir, 'SKILL.md');
writeFileSync(outPath, rendered.skill.content, 'utf8');

console.log(
  `[generate-skill] Wrote ${outPath} (${rendered.skill.content.length} bytes, ${documents.length} docs)`
);

if (rendered.references.length > 0) {
  const refsDir = resolve(buildDir, 'references');
  if (!existsSync(refsDir)) {
    mkdirSync(refsDir, { recursive: true });
  }
  for (const ref of rendered.references) {
    const refPath = resolve(buildDir, ref.filename);
    mkdirSync(dirname(refPath), { recursive: true });
    writeFileSync(refPath, ref.content, 'utf8');
  }
  console.log(`[generate-skill] Wrote ${rendered.references.length} reference file(s)`);
}
