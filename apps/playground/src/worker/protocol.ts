import type { FormField } from "@zod-to-form/core";
import type { EvaluationError } from "../types/playground.ts";

export interface EvalRequest {
  type: "eval";
  id: string;
  source: string;
}

export interface EvalSuccess {
  type: "result";
  id: string;
  fields: FormField[];
}

export interface EvalFailure {
  type: "error";
  id: string;
  error: EvaluationError;
}

export type WorkerResponse = EvalSuccess | EvalFailure;
