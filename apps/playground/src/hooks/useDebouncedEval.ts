import { useEffect, useRef, useState, useCallback } from "react";
import type { FormField } from "@zod-to-form/core";
import type { EvaluationError } from "../types/playground.ts";
import { EvalWorkerClient } from "../worker/client.ts";

interface EvalState {
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
}

export function useDebouncedEval(
  source: string,
  debounceMs = 300,
): EvalState & { onResult: (fields: FormField[] | null, error: EvaluationError | null) => void } {
  const clientRef = useRef<EvalWorkerClient | null>(null);
  const [evalState, setEvalState] = useState<EvalState>({
    fields: null,
    error: null,
    isEvaluating: false,
  });

  useEffect(() => {
    clientRef.current = new EvalWorkerClient();
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source.trim()) return;

    setEvalState((s) => ({ ...s, isEvaluating: true }));

    const timer = setTimeout(async () => {
      const client = clientRef.current;
      if (!client) return;

      try {
        const fields = await client.eval(source);
        setEvalState((prev) => ({
          fields,
          error: null,
          isEvaluating: false,
        }));
      } catch (err: unknown) {
        const error = err as EvaluationError;
        setEvalState((prev) => ({
          fields: prev.fields,
          error,
          isEvaluating: false,
        }));
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      clientRef.current?.cancel();
    };
  }, [source, debounceMs]);

  const onResult = useCallback(
    (fields: FormField[] | null, error: EvaluationError | null) => {
      setEvalState({ fields, error, isEvaluating: false });
    },
    [],
  );

  return { ...evalState, onResult };
}
