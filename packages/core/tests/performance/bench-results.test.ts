import { describe, expect, it } from 'vitest';
import { normalizeBenchResults } from './bench-results.js';

describe('benchmark report normalization', () => {
  it('retains captured Vitest 4 reports', () => {
    const captured = { files: [{ filepath: 'validation.bench.ts', groups: [] }] };
    expect(normalizeBenchResults(captured)).toBe(captured);
  });
  it('converts Vitest 5 task latency and preserves pairable suite names', () => {
    const data = normalizeBenchResults({
      success: true,
      testResults: [
        {
          name: 'validation.bench.ts',
          assertionResults: [
            {
              ancestorTitles: ['validation / small / baseline'],
              benchmarks: [
                {
                  tasks: [
                    {
                      name: 'compile=false input=valid',
                      period: 0.002,
                      rank: 1,
                      latency: {
                        mean: 0.002,
                        p50: 0.001,
                        p75: 0.002,
                        p99: 0.004,
                        min: 0.001,
                        max: 0.005,
                        rme: 2,
                        samplesCount: 100
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });
    expect(data.files[0]?.groups[0]).toMatchObject({
      fullName: 'validation.bench.ts > validation / small / baseline',
      benchmarks: [{ name: 'compile=false input=valid', hz: 500000, mean: 0.002, sampleCount: 100 }]
    });
  });
  it('refuses failed benchmark runs', () => {
    expect(() => normalizeBenchResults({ success: false, testResults: [] })).toThrow(/failed/);
  });
});
