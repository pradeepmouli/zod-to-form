import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EvaluationError } from "../../src/types/playground.ts";
import type { WorkerResponse } from "../../src/worker/protocol.ts";

type OnMessageHandler = ((e: MessageEvent<WorkerResponse>) => void) | null;

let mockWorkerInstances: MockWorker[] = [];

class MockWorker {
  onmessage: OnMessageHandler = null;
  private terminated = false;

  constructor() {
    mockWorkerInstances.push(this);
  }

  postMessage(data: { type: string; source: string; id: string }) {
    if (this.terminated) return;
    if (data.type === "eval") {
      const id = data.id;
      if (data.source.includes("__TIMEOUT__")) return;
      if (data.source.includes("__ERROR__")) {
        queueMicrotask(() => {
          if (this.terminated) return;
          this.onmessage?.({
            data: {
              type: "error",
              id,
              error: { type: "runtime" as const, message: "Mock error" },
            },
          } as MessageEvent<WorkerResponse>);
        });
        return;
      }
      queueMicrotask(() => {
        if (this.terminated) return;
        this.onmessage?.({
          data: {
            type: "result",
            id,
            fields: [
              { key: "test", zodType: "string", component: "Input", required: true, label: "test", constraints: {}, children: [] },
            ],
          },
        } as MessageEvent<WorkerResponse>);
      });
    }
  }

  terminate() {
    this.terminated = true;
  }
}

vi.mock("../../src/worker/eval-worker.ts", () => ({}));

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

describe("EvalWorkerClient", () => {
  it("returns FormField[] on successful eval", async () => {
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();
    const fields = await client.eval("valid");
    expect(fields).toHaveLength(1);
    expect(fields[0]!.key).toBe("test");
    client.dispose();
  });

  it("rejects with EvaluationError on worker error", async () => {
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();
    try {
      await client.eval("__ERROR__");
      expect.fail("Should have thrown");
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe("runtime");
      expect(error.message).toBe("Mock error");
    }
    client.dispose();
  });

  it("rejects with timeout error after 3s and respawns worker", async () => {
    vi.useFakeTimers();
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();
    const initialWorkerCount = mockWorkerInstances.length;

    const evalPromise = client.eval("__TIMEOUT__");
    vi.advanceTimersByTime(3100);

    try {
      await evalPromise;
      expect.fail("Should have thrown");
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe("timeout");
      expect(error.message).toContain("timed out");
    }

    expect(mockWorkerInstances.length).toBeGreaterThan(initialWorkerCount);
    client.dispose();
    vi.useRealTimers();
  });

  it("cancel() clears pending without error", async () => {
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();
    client.eval("__TIMEOUT__");
    expect(() => client.cancel()).not.toThrow();
    client.dispose();
  });

  it("cancellation drops stale responses from previous eval", async () => {
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();

    let staleResolved = false;
    let staleRejected = false;
    const stalePromise = client.eval("valid");
    stalePromise.then(() => { staleResolved = true; }).catch(() => { staleRejected = true; });

    client.cancel();

    const secondResult = await client.eval("valid");
    expect(secondResult).toHaveLength(1);
    expect(secondResult[0]!.key).toBe("test");

    await new Promise((r) => setTimeout(r, 50));
    expect(staleResolved).toBe(false);
    expect(staleRejected).toBe(false);

    client.dispose();
  });

  it("dispose() prevents further eval calls", async () => {
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();
    client.dispose();
    try {
      await client.eval("anything");
      expect.fail("Should have thrown");
    } catch (err) {
      const error = err as EvaluationError;
      expect(error.type).toBe("runtime");
      expect(error.message).toContain("disposed");
    }
  });

  it("restart() terminates and creates new worker", async () => {
    const { EvalWorkerClient } = await import("../../src/worker/client.ts");
    const client = new EvalWorkerClient();
    const countBefore = mockWorkerInstances.length;
    client.restart();
    expect(mockWorkerInstances.length).toBe(countBefore + 1);
    const fields = await client.eval("valid");
    expect(fields).toHaveLength(1);
    client.dispose();
  });
});
