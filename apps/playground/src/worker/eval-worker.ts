import { transpile } from "./transpile.ts";
import { evaluate } from "./evaluate.ts";
import { walkSchema } from "@zod-to-form/core";
import type { EvalRequest, WorkerResponse } from "./protocol.ts";

self.onmessage = (e: MessageEvent<EvalRequest>) => {
  const { source, id } = e.data;

  const transpileResult = transpile(source);
  if (!transpileResult.ok) {
    const response: WorkerResponse = {
      type: "error",
      id,
      error: transpileResult.error,
    };
    self.postMessage(response);
    return;
  }

  const evalResult = evaluate(transpileResult.code);
  if (!evalResult.ok) {
    const response: WorkerResponse = {
      type: "error",
      id,
      error: evalResult.error,
    };
    self.postMessage(response);
    return;
  }

  try {
    const walkOptions = evalResult.formRegistry
      ? { formRegistry: evalResult.formRegistry }
      : undefined;
    const fields = walkSchema(evalResult.schema, walkOptions);
    const response: WorkerResponse = { type: "result", id, fields };
    self.postMessage(response);
  } catch (err: unknown) {
    const error = err as Error;
    const response: WorkerResponse = {
      type: "error",
      id,
      error: {
        type: "runtime",
        message: error.message ?? "Error walking schema",
      },
    };
    self.postMessage(response);
  }
};
