import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import type { FormField } from '@zod-to-form/core';
import { SHADCN_OVERRIDES } from '@zod-to-form/core';
import { ZodForm, defaultComponentMap, shadcnComponentMap } from '@zod-to-form/react';
import type { RuntimeComponentConfig } from '@zod-to-form/react';
import type { ComponentMapType, EvaluationError, SubmitResult } from '../../types/playground.ts';
import { ErrorDisplay } from './ErrorDisplay.tsx';
import { ResultsPanel } from './ResultsPanel.tsx';
import { useSchemaFromSource } from '../../hooks/useSchemaFromSource.ts';

interface FormPreviewProps {
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
  componentMap: ComponentMapType;
  submitResult: SubmitResult | null;
  onSubmitResult: (result: SubmitResult) => void;
  editorContent: string;
  compiledComponents?: Record<string, ComponentType<Record<string, unknown>>>;
}

export function FormPreview({
  fields,
  error,
  isEvaluating,
  componentMap,
  submitResult,
  onSubmitResult,
  editorContent,
  compiledComponents
}: FormPreviewProps) {
  const components = useMemo(() => {
    const base =
      componentMap === 'shadcn'
        ? (shadcnComponentMap as unknown as typeof defaultComponentMap)
        : defaultComponentMap;
    if (!compiledComponents || Object.keys(compiledComponents).length === 0) {
      return base;
    }
    return { ...base, ...compiledComponents } as typeof defaultComponentMap;
  }, [componentMap, compiledComponents]);

  const componentConfig = useMemo((): RuntimeComponentConfig | undefined => {
    if (!compiledComponents || Object.keys(compiledComponents).length === 0) {
      return undefined;
    }
    if (componentMap !== 'shadcn') {
      return undefined;
    }
    const overrides: Record<string, { controlled?: boolean; propMap?: Record<string, string> }> =
      {};
    for (const name of Object.keys(compiledComponents)) {
      if (SHADCN_OVERRIDES[name]) {
        overrides[name] = SHADCN_OVERRIDES[name];
      }
    }
    if (Object.keys(overrides).length === 0) {
      return undefined;
    }
    return {
      components: { source: 'playground-compiled', overrides }
    };
  }, [compiledComponents, componentMap]);

  const handleSubmit = useCallback(
    (data: Record<string, unknown>) => {
      onSubmitResult({
        success: true,
        data,
        errors: null,
        timestamp: Date.now()
      });
    },
    [onSubmitResult]
  );

  const handleInvalid = useCallback(
    (fieldErrors: Record<string, unknown>) => {
      const errors = Object.entries(fieldErrors).map(([path, err]) => ({
        path,
        message: (err as { message?: string })?.message ?? 'Validation failed'
      }));
      onSubmitResult({
        success: false,
        data: null,
        errors,
        timestamp: Date.now()
      });
    },
    [onSubmitResult]
  );

  const { schema, formRegistry, stale } = useSchemaFromSource(editorContent, fields);

  // Only show loading indicator after 500ms to avoid flicker on fast evaluations
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    if (!isEvaluating) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(true), 500);
    return () => clearTimeout(timer);
  }, [isEvaluating]);

  return (
    <div className="h-full flex flex-col overflow-auto">
      {showLoading && (
        <div
          className="px-4 py-2 text-xs font-medium"
          style={{
            background: 'var(--accent-violet-muted)',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--accent-violet)'
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
        <div
          className="flex-1 p-5 overflow-auto form-preview-area"
          style={stale ? { opacity: 0.6 } : undefined}
        >
          <ZodForm
            schema={schema}
            components={components}
            componentConfig={componentConfig}
            onSubmit={handleSubmit}
            onInvalid={handleInvalid}
            formRegistry={formRegistry}
            className="space-y-4"
          >
            <button type="submit" className="btn-accent px-5 py-2.5 text-sm rounded-lg">
              Submit
            </button>
          </ZodForm>
        </div>
      ) : (
        !error && (
          <div
            className="flex-1 flex items-center justify-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Write a Zod schema to see a live form preview
          </div>
        )
      )}

      {submitResult && <ResultsPanel result={submitResult} />}
    </div>
  );
}
