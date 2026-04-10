/**
 * Reads vitest bench JSON output and prints a README-ready markdown table.
 *
 * Usage:
 *   npx tsx scripts/bench-report.ts [bench-results.json] [bench-browser-results.json]
 *
 * If no arguments given, reads from default filenames in the project root.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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

function collectRows(data: BenchFile): Row[] {
  const rows: Row[] = [];
  for (const file of data.files) {
    for (const group of file.groups) {
      // fullName is like "walker.bench.ts > walkSchema > small (5 fields)"
      const parts = group.fullName.split(' > ');
      // Drop the filename part, keep scenario and schema
      const scenario = parts.slice(0, -1).join(' > ');
      const schema = parts[parts.length - 1] ?? '';

      for (const b of group.benchmarks) {
        rows.push({
          scenario,
          schema,
          level: b.name,
          median: formatMs(b.median),
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
    // Clean up scenario name — remove file path prefix
    const cleanScenario = scenario.replace(/^.*\.bench\.tsx? > /, '');
    lines.push(`#### ${cleanScenario}\n`);
    lines.push('| Schema | Level | Median | ops/sec | Samples |');
    lines.push('|--------|-------|--------|---------|---------|');
    for (const row of scenarioRows) {
      lines.push(
        `| ${row.schema} | ${row.level} | ${row.median} | ${row.opsPerSec} | ${row.samples} |`
      );
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
} else {
  output += `\n*Browser benchmark file not found: ${browserFile}*\n`;
}

console.log(output);
