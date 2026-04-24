#!/usr/bin/env node
/**
 * Combined build for Cloudflare Pages — produces a single `apps/docs/build/`
 * containing the Docusaurus docs at `/` and the Vite playground at `/play/`.
 *
 * Both builds run with CF_PAGES=1 so their config files pick the right
 * baseUrl / base path.
 */

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(__dirname, '..');
const repoRoot = resolve(docsRoot, '..', '..');
const playgroundRoot = join(repoRoot, 'apps', 'playground');

const docsBuild = join(docsRoot, 'build');
const playgroundDist = join(playgroundRoot, 'dist');
const playgroundTarget = join(docsBuild, 'play');
const env: NodeJS.ProcessEnv = { ...process.env, CF_PAGES: '1' };

function run(label: string, command: string, cwd: string): void {
  console.log(`\n[build-combined] ${label}`);
  console.log(`[build-combined] $ ${command}  (cwd: ${cwd})`);
  execSync(command, { cwd, env, stdio: 'inherit' });
}

run('Building Docusaurus docs', 'pnpm --filter @zod-to-form/docs build', repoRoot);
run('Building playground (Vite)', 'pnpm --filter @zod-to-form/playground build', repoRoot);

if (!existsSync(playgroundDist)) {
  throw new Error(`[build-combined] playground dist missing: ${playgroundDist}`);
}

console.log(`\n[build-combined] Copying ${playgroundDist} → ${playgroundTarget}`);
mkdirSync(playgroundTarget, { recursive: true });
cpSync(playgroundDist, playgroundTarget, { recursive: true });

// Cloudflare Pages reads _redirects from the site root. SPA fallback for
// playground deep links so /play/foo reloads don't 404.
const redirects = `/play/* /play/index.html 200\n`;
writeFileSync(join(docsBuild, '_redirects'), redirects);
console.log('[build-combined] Wrote _redirects with SPA fallback for /play/*');

// shadcn registry proxy is served by the standalone `apps/shadcn-proxy`
// Cloudflare Worker (bound to zod.toform.dev/api/shadcn/*), not by this
// Pages build. Deploy it separately via `pnpm --filter @zod-to-form/shadcn-proxy deploy`.

console.log('\n[build-combined] Done.');
