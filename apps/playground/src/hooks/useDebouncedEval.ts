import { useEffect, useRef, useState } from 'react';
import type { FormField } from '@zod-to-form/core';
import type { EvaluationError } from '../types/playground.ts';
import { EvalWorkerClient } from '../worker/client.ts';

interface EvalState {
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
}

export function useDebouncedEval(source: string, debounceMs = 300): EvalState {
  const clientRef = useRef<EvalWorkerClient | null>(null);
  const [evalState, setEvalState] = useState<EvalState>({
    fields: null,
    error: null,
    isEvaluating: false
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
        setEvalState({
          fields,
          error: null,
          isEvaluating: false
        });
      } catch (err: unknown) {
        // Cancelled evals are expected during rapid typing — ignore them
        if (
          err &&
          typeof err === 'object' &&
          'message' in err &&
          (err as EvaluationError).message === 'Cancelled'
        ) {
          setEvalState((s) => ({ ...s, isEvaluating: false }));
          return;
        }
        const error: EvaluationError =
          err && typeof err === 'object' && 'type' in err && 'message' in err
            ? (err as EvaluationError)
            : { type: 'runtime', message: err instanceof Error ? err.message : String(err) };
        setEvalState((s) => ({
          fields: s.fields,
          error,
          isEvaluating: false
        }));
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      clientRef.current?.cancel();
    };
  }, [source, debounceMs]);

  return evalState;
}
