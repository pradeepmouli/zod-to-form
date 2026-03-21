import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EvaluationError } from '../../src/types/playground.ts';
import type { WorkerResponse } from '../../src/worker/protocol.ts';

type OnMessageHandler = ((e: MessageEvent<WorkerResponse>) => void) | null;
type OnErrorHandler = ((e: ErrorEvent) => void) | null;

let mockWorkerInstances: MockWorker[] = [];

class MockWorker {
  onmessage: OnMessageHandler = null;
  onerror: OnErrorHandler = null;
  private terminated = false;

  constructor() {
    mockWorkerInstances.push(this);
  }

  postMessage(data: { type: string; source: string; id: string }) {
    if (this.terminated) return;
    if (data.type === 'eval') {
      const id = data.id;
      if (data.source.includes('__TIMEOUT__')) return;
      if (data.source.includes('__ERROR__')) {
        queueMicrotask(() => {
          if (this.terminated) return;
          this.onmessage?.({
            data: {
              type: 'error',
              id,
              error: { type: 'runtime' as const, message: 'Mock error' }
            }
          } as MessageEvent<WorkerResponse>);
        });
        return;
      }
      queueMicrotask(() => {
        if (this.terminated) return;
        this.onmessage?.({
          data: {
            type: 'result',
            id,
            fields: [
              {
                key: 'test',
                zodType: 'string',
                component: 'Input',
                required: true,
                label: 'test',
                constraints: {},
                children: []
              }
            ]
          }
        } as MessageEvent<WorkerResponse>);
      });
    }
  }

  simulateError(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }

  terminate() {
    this.terminated = true;
  }
}

vi.mock('../../src/worker/eval-worker.ts', () => ({}));

const originalWorker = globalThis.Worker;

beforeEach(() => {
  mockWorkerInstances = [];
  globalThis.Worker = class extends MockWorker {
    constructor(_url: string | URL, _opts?: WorkerOptions) {
      super();
    }
  } as unknown as typeof Worker;
});

afterEach(() => {
  globalThis.Worker = originalWorker;
  vi.restoreAllMocks();
});

describe('EvalWorkerClient', () => {
  it('returns FormField[] on successful eval', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();
    const fields = await client.eval('valid');
    expect(fields).toHaveLength(1);
    expect(fields[0]!.key).toBe('test');
    client.dispose();
  });

  it('rejects with EvaluationError on worker error', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();
    try {
      await client.eval('__ERROR__');
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe('runtime');
      expect(error.message).toBe('Mock error');
    }
    client.dispose();
  });

  it('rejects with timeout error after 3s and respawns worker', async () => {
    vi.useFakeTimers();
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();
    const initialWorkerCount = mockWorkerInstances.length;

    const evalPromise = client.eval('__TIMEOUT__');
    vi.advanceTimersByTime(3100);

    try {
      await evalPromise;
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe('timeout');
      expect(error.message).toContain('timed out');
    }

    expect(mockWorkerInstances.length).toBeGreaterThan(initialWorkerCount);
    client.dispose();
    vi.useRealTimers();
  });

  it('cancel() rejects pending promises with Cancelled error', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();

    const stalePromise = client.eval('__TIMEOUT__');
    client.cancel();

    try {
      await stalePromise;
      expect.fail('Should have been rejected');
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe('runtime');
      expect(error.message).toBe('Cancelled');
    }

    client.dispose();
  });

  it('cancellation allows a fresh eval after cancel', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();

    // Start a stale eval, cancel it, then start a fresh one
    const stalePromise = client.eval('__TIMEOUT__');
    client.cancel();

    // Consume the rejection to avoid unhandled rejection
    await stalePromise.catch(() => {});

    // The second eval should work normally
    const secondResult = await client.eval('valid');
    expect(secondResult).toHaveLength(1);
    expect(secondResult[0]!.key).toBe('test');

    client.dispose();
  });

  it('onerror rejects all pending and respawns worker', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();
    const initialWorkerCount = mockWorkerInstances.length;

    const evalPromise = client.eval('__TIMEOUT__');

    // Simulate a worker crash via onerror
    const worker = mockWorkerInstances[mockWorkerInstances.length - 1]!;
    worker.simulateError('Worker crashed');

    try {
      await evalPromise;
      expect.fail('Should have been rejected');
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe('runtime');
      expect(error.message).toBe('Worker crashed');
    }

    // Worker should have been respawned
    expect(mockWorkerInstances.length).toBeGreaterThan(initialWorkerCount);

    // Client should still be usable after crash recovery
    const fields = await client.eval('valid');
    expect(fields).toHaveLength(1);

    client.dispose();
  });

  it('concurrent evals resolve independently with correct results', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();

    const [result1, result2] = await Promise.all([client.eval('valid'), client.eval('valid')]);

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
    expect(result1[0]!.key).toBe('test');
    expect(result2[0]!.key).toBe('test');

    client.dispose();
  });

  it('dispose() prevents further eval calls', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();
    client.dispose();
    try {
      await client.eval('anything');
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe('runtime');
      expect(error.message).toContain('disposed');
    }
  });

  it('restart() terminates and creates new worker', async () => {
    const { EvalWorkerClient } = await import('../../src/worker/client.ts');
    const client = new EvalWorkerClient();
    const countBefore = mockWorkerInstances.length;
    client.restart();
    expect(mockWorkerInstances.length).toBe(countBefore + 1);
    const fields = await client.eval('valid');
    expect(fields).toHaveLength(1);
    client.dispose();
  });
});
