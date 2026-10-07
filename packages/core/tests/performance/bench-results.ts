interface BenchResult {
  name: string;
  rank: number;
  rme: number;
  sampleCount: number;
  median: number;
  mean: number;
  p75: number;
  p99: number;
  min: number;
  max: number;
  hz: number;
}

export interface BenchFile {
  files: Array<{
    filepath: string;
    groups: Array<{ fullName: string; benchmarks: BenchResult[] }>;
  }>;
}

interface VitestReport {
  success?: boolean;
  testResults: Array<{
    name: string;
    assertionResults: Array<{
      ancestorTitles: string[];
      benchmarks?: Array<{
        tasks: Array<{
          name: string;
          rank: number;
          period: number;
          latency: {
            mean: number;
            p50: number;
            p75: number;
            p99: number;
            min: number;
            max: number;
            rme: number;
            samplesCount: number;
          };
        }>;
      }>;
    }>;
  }>;
}

/** Accept captured v4 results and the v5 JSON reporter without changing report consumers. */
export function normalizeBenchResults(input: unknown): BenchFile {
  if (!input || typeof input !== 'object') throw new Error('Invalid benchmark report');
  if ('files' in input) return input as BenchFile;
  const report = input as VitestReport;
  if (report.success === false) throw new Error('Benchmark run failed');
  if (!Array.isArray(report.testResults)) throw new Error('Invalid benchmark report');
  return {
    files: report.testResults.map((file) => ({
      filepath: file.name,
      groups: file.assertionResults
        .filter((result) => result.benchmarks?.length)
        .map((result) => ({
          fullName: [file.name, ...result.ancestorTitles].join(' > '),
          benchmarks: result.benchmarks!.flatMap((group) =>
            group.tasks.map((task) => ({
              name: task.name,
              rank: task.rank,
              rme: task.latency.rme,
              sampleCount: task.latency.samplesCount,
              median: task.latency.p50,
              mean: task.latency.mean,
              p75: task.latency.p75,
              p99: task.latency.p99,
              min: task.latency.min,
              max: task.latency.max,
              hz: task.period > 0 ? 1000 / task.period : 0
            }))
          )
        }))
    }))
  };
}
