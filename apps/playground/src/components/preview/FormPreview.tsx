import { useCallback, useMemo } from "react";
import type { FormField } from "@zod-to-form/core";
import { ZodForm, defaultComponentMap, shadcnComponentMap } from "@zod-to-form/react";
import * as z from "zod";
import type {
  ComponentMapType,
  EvaluationError,
  SubmitResult,
} from "../../types/playground.ts";
import { ErrorDisplay } from "./ErrorDisplay.tsx";
import { ResultsPanel } from "./ResultsPanel.tsx";
import { evaluate } from "../../worker/evaluate.ts";
import { transpile } from "../../worker/transpile.ts";

interface FormPreviewProps {
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
  componentMap: ComponentMapType;
  submitResult: SubmitResult | null;
  onSubmitResult: (result: SubmitResult) => void;
  editorContent: string;
  customComponents?: Record<string, string> | null;
}

export function FormPreview({
  fields,
  error,
  isEvaluating,
  componentMap,
  submitResult,
  onSubmitResult,
  editorContent,
  customComponents,
}: FormPreviewProps) {
  const components = useMemo(() => {
    const baseMap =
      componentMap === "shadcn"
        ? (shadcnComponentMap as unknown as typeof defaultComponentMap)
        : defaultComponentMap;

    if (!customComponents || Object.keys(customComponents).length === 0) {
      return baseMap;
    }

    return baseMap;
  }, [componentMap, customComponents]);

  const handleSubmit = useCallback(
    (data: Record<string, unknown>) => {
      onSubmitResult({
        success: true,
        data,
        errors: null,
        timestamp: Date.now(),
      });
    },
    [onSubmitResult],
  );

  const schema = useMemo(() => {
    if (!fields || fields.length === 0) return null;
    const transpileResult = transpile(editorContent);
    if (!transpileResult.ok) return null;
    const evalResult = evaluate(transpileResult.code);
    if (!evalResult.ok) return null;
    return evalResult.schema;
  }, [editorContent, fields]);

  return (
    <div className="h-full flex flex-col overflow-auto">
      {isEvaluating && (
        <div className="px-4 py-2 bg-blue-950/30 border-b border-blue-500/20 text-xs text-blue-400">
          Evaluating...
        </div>
      )}

      {error && (
        <div className="p-4">
          <ErrorDisplay error={error} />
        </div>
      )}

      {fields && fields.length > 0 && schema ? (
        <div className="flex-1 p-4 overflow-auto">
          <ZodForm
            schema={schema as z.ZodObject<z.ZodRawShape>}
            components={components}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Submit
            </button>
          </ZodForm>
        </div>
      ) : (
        !error && (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            Write a Zod schema to see a live form preview
          </div>
        )
      )}

      {submitResult && <ResultsPanel result={submitResult} />}
    </div>
  );
}
