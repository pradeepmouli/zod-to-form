import { useCallback, useMemo } from "react";
import type { FormField } from "@zod-to-form/core";
import { ZodForm, defaultComponentMap, shadcnComponentMap } from "@zod-to-form/react";
import type {
  ComponentMapType,
  EvaluationError,
  SubmitResult,
} from "../../types/playground.ts";
import { ErrorDisplay } from "./ErrorDisplay.tsx";
import { ResultsPanel } from "./ResultsPanel.tsx";
import { useSchemaFromSource } from "../../hooks/useSchemaFromSource.ts";

interface FormPreviewProps {
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
  componentMap: ComponentMapType;
  submitResult: SubmitResult | null;
  onSubmitResult: (result: SubmitResult) => void;
  editorContent: string;
}

export function FormPreview({
  fields,
  error,
  isEvaluating,
  componentMap,
  submitResult,
  onSubmitResult,
  editorContent,
}: FormPreviewProps) {
  const components = useMemo(
    () =>
      componentMap === "shadcn"
        ? (shadcnComponentMap as unknown as typeof defaultComponentMap)
        : defaultComponentMap,
    [componentMap],
  );

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

  const schema = useSchemaFromSource(editorContent, fields);

  return (
    <div className="h-full flex flex-col overflow-auto">
      {isEvaluating && (
        <div
          className="px-4 py-2 text-xs"
          style={{
            background: "var(--accent-violet-muted)",
            borderBottom: "1px solid var(--border-subtle)",
            color: "var(--accent-violet)",
          }}
        >
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
            schema={schema}
            components={components}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                background: "var(--accent-violet)",
                color: "#fff",
              }}
            >
              Submit
            </button>
          </ZodForm>
        </div>
      ) : (
        !error && (
          <div
            className="flex-1 flex items-center justify-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Write a Zod schema to see a live form preview
          </div>
        )
      )}

      {submitResult && <ResultsPanel result={submitResult} />}
    </div>
  );
}
