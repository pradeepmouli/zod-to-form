import type { FormField } from '@zod-to-form/core';
import type { EvaluationError } from '../types/playground.ts';
import type { WorkerResponse } from './protocol.ts';

interface PendingEval {
  resolve: (fields: FormField[]) => void;
  reject: (error: EvaluationError) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class EvalWorkerClient {
  private worker: Worker;
  private pending = new Map<string, PendingEval>();
  private disposed = false;

  constructor() {
    this.worker = this.createWorker();
  }

  private createWorker(): Worker {
    const worker = new Worker(new URL('./eval-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.handleMessage(e.data);
    };
    worker.onerror = (e: ErrorEvent) => {
      this.rejectAllPending({
        type: 'runtime',
        message: e.message ?? 'Worker crashed unexpectedly'
      });
      this.restart();
    };
    return worker;
  }

  private handleMessage(response: WorkerResponse): void {
    const pending = this.pending.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(response.id);

    if (response.type === 'result') {
      pending.resolve(response.fields);
    } else {
      pending.reject(response.error);
    }
  }

  private rejectAllPending(error: EvaluationError): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(id);
    }
  }

  eval(source: string): Promise<FormField[]> {
    if (this.disposed) {
      return Promise.reject({
        type: 'runtime' as const,
        message: 'Worker has been disposed'
      });
    }

    const id = crypto.randomUUID();

    return new Promise<FormField[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.restart();
        reject({
          type: 'timeout' as const,
          message: 'Evaluation timed out (3s). Your code may contain an infinite loop.'
        } satisfies EvaluationError);
      }, 3000);

      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: 'eval', source, id });
    });
  }

  cancel(): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject({ type: 'runtime', message: 'Cancelled' });
      this.pending.delete(id);
    }
  }

  restart(): void {
    this.worker.terminate();
    this.worker = this.createWorker();
  }

  dispose(): void {
    this.disposed = true;
    this.cancel();
    this.worker.terminate();
  }
}
