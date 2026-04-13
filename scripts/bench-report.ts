/**
 * Reads vitest bench JSON output and prints a README-ready markdown table.
 *
 * Usage:
 *   npx tsx scripts/bench-report.ts [bench-results.json] [bench-browser-results.json]
 *
 * If no arguments given, reads from default filenames in the project root.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface BenchResult {
  name: string;
  rank: number;
  rme: number;
  sampleCount: number;
  /** Median in ms */
  median: number;
  mean: number;
  p75: number;
  p99: number;
  min: number;
  max: number;
  hz: number;
}

interface BenchGroup {
  fullName: string;
  benchmarks: BenchResult[];
}

interface BenchFileEntry {
  filepath: string;
  groups: BenchGroup[];
}

interface BenchFile {
  files: BenchFileEntry[];
}

function formatMs(ms: number): string {
  if (ms < 0.001) return `${(ms * 1_000_000).toFixed(0)}ns`;
  if (ms < 1) return `${(ms * 1_000).toFixed(2)}us`;
  return `${ms.toFixed(2)}ms`;
}

function formatOpsPerSec(hz: number): string {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(1)}M`;
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(1)}K`;
  return `${hz.toFixed(0)}`;
}

type Row = {
  scenario: string;
  schema: string;
  level: string;
  median: string;
  opsPerSec: string;
  samples: number;
};

/**
 * Parse a group's fullName into (scenario, schema).
 * fullName format: "path/file.bench.ts > scenario describe [> schema describe]"
 *
 * When there's no schema-size describe (e.g. "browser schemaLite validation"),
 * schema is empty and we rely on the bench name for the variant.
 */
function parseGroupName(fullName: string): { scenario: string; schema: string } {
  const parts = fullName.split(' > ');
  // Drop the filename (always first part)
  const afterFile = parts.slice(1);

  if (afterFile.length === 0) return { scenario: 'default', schema: '' };
  if (afterFile.length === 1) return { scenario: afterFile[0]!, schema: '' };

  // Multiple describe levels: last one is the schema variant, rest is the scenario
  return {
    scenario: afterFile.slice(0, -1).join(' > '),
    schema: afterFile[afterFile.length - 1]!
  };
}

function collectRows(data: BenchFile): Row[] {
  const rows: Row[] = [];
  for (const file of data.files) {
    for (const group of file.groups) {
      const { scenario, schema } = parseGroupName(group.fullName);

      for (const b of group.benchmarks) {
        // Use mean derived from hz (1/hz * 1000ms) as the primary time metric.
        // Browser median gets clamped to 100us by Chrome's performance.now()
        // resolution, so median is unreliable there. 1/hz is always accurate.
        const meanMs = b.hz > 0 ? 1000 / b.hz : 0;
        rows.push({
          scenario,
          schema,
          level: b.name,
          median: formatMs(meanMs),
          opsPerSec: formatOpsPerSec(b.hz),
          samples: b.sampleCount
        });
      }
    }
  }
  return rows;
}

function buildTable(rows: Row[]): string {
  if (rows.length === 0) return '*No benchmark data found.*\n';

  // Group by scenario
  const byScenario = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row.scenario || 'default';
    if (!byScenario.has(key)) byScenario.set(key, []);
    byScenario.get(key)!.push(row);
  }

  const lines: string[] = [];

  for (const [scenario, scenarioRows] of byScenario) {
    lines.push(`#### ${scenario}\n`);
    // If no row has a schema column, drop that column from the table
    const hasSchema = scenarioRows.some((r) => r.schema.length > 0);
    if (hasSchema) {
      lines.push('| Schema | Level | Mean | ops/sec | Samples |');
      lines.push('|--------|-------|------|---------|---------|');
      for (const row of scenarioRows) {
        lines.push(
          `| ${row.schema} | ${row.level} | ${row.median} | ${row.opsPerSec} | ${row.samples} |`
        );
      }
    } else {
      lines.push('| Level | Mean | ops/sec | Samples |');
      lines.push('|-------|------|---------|---------|');
      for (const row of scenarioRows) {
        lines.push(`| ${row.level} | ${row.median} | ${row.opsPerSec} | ${row.samples} |`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Session Amortization ───────────────────────────────────────────
//
// Combines primitive costs (walk, render, keystroke, submit) into
// end-to-end session scenarios so the tradeoff between levels is visible
// across different usage patterns (onSubmit vs heavy onChange editing).

type Primitives = {
  walk: Record<string, number>; // schema → mean ms
  render: Record<string, number>;
  keystroke: Record<string, number>;
  submit: Record<string, number>;
};

function extractPrimitives(data: BenchFile, level: string): Primitives {
  const prim: Primitives = { walk: {}, render: {}, keystroke: {}, submit: {} };

  const matchLevel = (benchName: string): boolean => {
    if (level === 'no optimization') {
      return benchName.startsWith('no optimization');
    }
    return benchName.startsWith(level);
  };

  for (const file of data.files) {
    for (const group of file.groups) {
      const { scenario, schema } = parseGroupName(group.fullName);
      const meanFor = (pred: (name: string) => boolean) => {
        const b = group.benchmarks.find((x) => pred(x.name));
        return b && b.hz > 0 ? 1000 / b.hz : undefined;
      };

      if (scenario.includes('browser walkSchema') || scenario.includes('walkSchema')) {
        const m = meanFor(matchLevel);
        if (m !== undefined) prim.walk[schema] = m;
      } else if (scenario.includes('browser render')) {
        const m = meanFor(matchLevel);
        // render timing INCLUDES walk — subtract it out when we have it
        if (m !== undefined) prim.render[schema] = m;
      } else if (scenario.includes('keystroke validation')) {
        const m = meanFor(matchLevel);
        if (m !== undefined) prim.keystroke[schema] = m;
      } else if (scenario.includes('submit validation')) {
        const m = meanFor(matchLevel);
        if (m !== undefined) prim.submit[schema] = m;
      }
    }
  }

  return prim;
}

/**
 * Codegen vs runtime: compare pre-walked mount cost against walk-on-every-mount.
 * Reads from the "codegen mount" and "runtime mount" describes.
 */
function buildCodegenVsRuntimeTable(browserData: BenchFile): string {
  const levels = ['no optimization', 'L1', 'L2'] as const;
  const schemas = ['small (5 fields)', 'medium (18 fields)', 'large (50 fields)'] as const;

  // Map: schema -> level -> { codegen: ms, runtime: ms }
  const table: Record<string, Record<string, { codegen?: number; runtime?: number }>> = {};

  for (const file of browserData.files) {
    for (const group of file.groups) {
      const { scenario, schema } = parseGroupName(group.fullName);
      const isCodegen = scenario.includes('codegen mount');
      const isRuntime = scenario.includes('runtime mount');
      if (!isCodegen && !isRuntime) continue;

      table[schema] ??= {};
      for (const b of group.benchmarks) {
        const mean = b.hz > 0 ? 1000 / b.hz : undefined;
        if (mean === undefined) continue;
        // bench name is like "L2 (codegen)" or "no optimization (runtime)"
        const level = levels.find((l) => b.name.startsWith(l));
        if (!level) continue;
        table[schema]![level] ??= {};
        if (isCodegen) table[schema]![level]!.codegen = mean;
        else table[schema]![level]!.runtime = mean;
      }
    }
  }

  if (Object.keys(table).length === 0) return '';

  const lines: string[] = [];
  lines.push('### Codegen vs Runtime (Browser Mount)\n');
  lines.push(
    '> Codegen: pre-walked `FormField[]` imported from a generated module — mount pays only React work.'
  );
  lines.push(
    '> Runtime: `useZodForm(schema, ...)` walks + optimizes + mounts on every page load.\n'
  );

  for (const schema of schemas) {
    const row = table[schema];
    if (!row) continue;
    lines.push(`#### ${schema}\n`);
    lines.push('| Level | Codegen mount | Runtime mount | Speedup |');
    lines.push('|-------|---------------|---------------|---------|');
    for (const level of levels) {
      const cell = row[level];
      if (!cell || cell.codegen === undefined || cell.runtime === undefined) {
        lines.push(`| ${level} | n/a | n/a | n/a |`);
        continue;
      }
      const speedup = cell.runtime / cell.codegen;
      lines.push(
        `| ${level} | ${formatMs(cell.codegen)} | ${formatMs(cell.runtime)} | ${speedup.toFixed(2)}× |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Read a specific mount scenario's mean for each (schema, level).
 * scenarioSubstring matches a describe name like "codegen mount" or "runtime mount".
 */
function readMountMeans(
  browserData: BenchFile,
  scenarioSubstring: string
): Record<string, Record<string, number>> {
  const levels = ['no optimization', 'L1', 'L2'] as const;
  const out: Record<string, Record<string, number>> = {};
  for (const file of browserData.files) {
    for (const group of file.groups) {
      const { scenario, schema } = parseGroupName(group.fullName);
      if (!scenario.includes(scenarioSubstring)) continue;
      for (const b of group.benchmarks) {
        const level = levels.find((l) => b.name.startsWith(l));
        if (!level) continue;
        const mean = b.hz > 0 ? 1000 / b.hz : 0;
        out[schema] ??= {};
        out[schema]![level] = mean;
      }
    }
  }
  return out;
}

function buildSessionTable(browserData: BenchFile): string {
  const levels = ['no optimization', 'L1', 'L2'] as const;
  const schemas = ['small (5 fields)', 'medium (18 fields)', 'large (50 fields)'] as const;
  const editCounts = [0, 20, 100, 500] as const;

  // Per-level validation primitives (keystroke, submit) — same for codegen & runtime
  // at a given level, because once mounted the validation path is identical.
  const primsByLevel: Record<string, Primitives> = {};
  for (const level of levels) {
    primsByLevel[level] = extractPrimitives(browserData, level);
  }

  // Mount costs come from the codegen-vs-runtime bench's two describes.
  const codegenMounts = readMountMeans(browserData, 'codegen mount');
  const runtimeMounts = readMountMeans(browserData, 'runtime mount');

  const lines: string[] = [];
  lines.push('### Amortized Session Cost (Browser)\n');
  lines.push('> Total session time: `mount + K × keystroke + submit`.');
  lines.push(
    '> `mount` is walk + React render (codegen pre-walks at build time; runtime walks on every mount).'
  );
  lines.push(
    '> `keystroke` and `submit` are identical for codegen/runtime at the same level — only mount differs.'
  );
  lines.push(
    '> onSubmit mode ≈ K=0; light editing ≈ K=20; heavy editing ≈ K=100; power users ≈ K=500.\n'
  );
  lines.push('> **Bold** = fastest option in that column for that schema.\n');

  type Row = {
    kind: 'runtime' | 'codegen';
    level: (typeof levels)[number];
    costs: number[]; // one per editCount
  };

  for (const schema of schemas) {
    lines.push(`#### ${schema}\n`);

    const rows: Row[] = [];
    for (const kind of ['runtime', 'codegen'] as const) {
      for (const level of levels) {
        const mount =
          kind === 'codegen' ? codegenMounts[schema]?.[level] : runtimeMounts[schema]?.[level];
        const p = primsByLevel[level]!;
        const keystroke = p.keystroke[schema];
        const submit = p.submit[schema];
        if (mount === undefined || keystroke === undefined || submit === undefined) {
          rows.push({ kind, level, costs: editCounts.map(() => NaN) });
          continue;
        }
        rows.push({
          kind,
          level,
          costs: editCounts.map((k) => mount + k * keystroke + submit)
        });
      }
    }

    // Find the minimum cost per column (for bolding)
    const columnMins: number[] = editCounts.map((_, colIdx) => {
      const values = rows.map((r) => r.costs[colIdx]!).filter((v) => !Number.isNaN(v));
      return values.length > 0 ? Math.min(...values) : NaN;
    });

    const header = ['Config', ...editCounts.map((k) => `K=${k}`)];
    lines.push(`| ${header.join(' | ')} |`);
    lines.push(`|${header.map(() => '---').join('|')}|`);
    for (const row of rows) {
      const label = `${row.kind} ${row.level}`;
      const cells = row.costs.map((c, i) => {
        if (Number.isNaN(c)) return 'n/a';
        const isMin = c === columnMins[i];
        const formatted = formatMs(c);
        return isMin ? `**${formatted}**` : formatted;
      });
      lines.push(`| ${label} | ${cells.join(' | ')} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const nodeFile = resolve(args[0] ?? 'bench-results.json');
const browserFile = resolve(args[1] ?? 'bench-browser-results.json');

let output = '## Performance Benchmarks\n\n';
output += `> Generated on ${new Date().toISOString().split('T')[0]}`;
output += ` with Node ${process.version}\n\n`;

if (existsSync(nodeFile)) {
  const data: BenchFile = JSON.parse(readFileSync(nodeFile, 'utf-8'));
  const rows = collectRows(data);
  output += '### Node Benchmarks\n\n';
  output += buildTable(rows);
} else {
  output += `*Node benchmark file not found: ${nodeFile}*\n\n`;
}

if (existsSync(browserFile)) {
  const data: BenchFile = JSON.parse(readFileSync(browserFile, 'utf-8'));
  const rows = collectRows(data);
  output += '\n### Browser Benchmarks (Chromium via Playwright)\n\n';
  output += buildTable(rows);
  const cvrTable = buildCodegenVsRuntimeTable(data);
  if (cvrTable) output += '\n' + cvrTable;
  output += '\n' + buildSessionTable(data);
} else {
  output += `\n*Browser benchmark file not found: ${browserFile}*\n`;
}

// Write to benchmarks/RESULTS.md (committed artifact) and also echo to stdout
const outputPath = resolve('benchmarks/RESULTS.md');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
console.log(output);
console.error(`\nReport written to ${outputPath}`);
