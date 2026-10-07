import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import type { FormField } from '@zod-to-form/core';
import { mergeConfigLayers, resolveFormConfig } from '@zod-to-form/core';
import { ZodForm, defaultComponentMap, shadcnComponentMap } from '@zod-to-form/react';
import type {
  ComponentMapType,
  EvaluationError,
  SubmitResult,
  PlaygroundConfig
} from '../../types/playground.ts';
import { ErrorDisplay } from './ErrorDisplay.tsx';
import { ResultsPanel } from './ResultsPanel.tsx';
import { useSchemaFromSource } from '../../hooks/useSchemaFromSource.ts';

interface FormPreviewProps {
  config?: PlaygroundConfig | null;
  fields: FormField[] | null;
  error: EvaluationError | null;
  isEvaluating: boolean;
  componentMap: ComponentMapType;
  submitResult: SubmitResult | null;
  onSubmitResult: (result: SubmitResult) => void;
  editorContent: string;
  compiledComponents?: Record<string, ComponentType<Record<string, unknown>>>;
  /** Form submission mode from z2f.config.defaults.mode */
  mode?: 'submit' | 'auto-save';
}

export function FormPreview({
  fields,
  error,
  isEvaluating,
  componentMap,
  submitResult,
  onSubmitResult,
  editorContent,
  compiledComponents,
  mode = 'submit',
  config
}: FormPreviewProps) {
  const isAutoSave = mode === 'auto-save';
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

  const resolved = useMemo(
    () =>
      resolveFormConfig({
        config: mergeConfigLayers(
          {
            components: {
              source: './components',
              preset: componentMap === 'shadcn' ? 'shadcn' : 'html'
            }
          },
          config ?? {}
        ),
        exportName: 'schema'
      }),
    [config, componentMap]
  );
  const componentConfig = { ...resolved.componentConfig, fields: resolved.fields };

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

  // In auto-save mode, each value change triggers an onSubmit-equivalent
  // event so the Results panel reflects the latest form state live.
  const handleValueChange = useCallback(
    (data: Record<string, unknown>) => {
      if (!isAutoSave) return;
      onSubmitResult({
        success: true,
        data,
        errors: null,
        timestamp: Date.now()
      });
    },
    [isAutoSave, onSubmitResult]
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
        // Zod always produces at least one error on failure
        errors: errors as [(typeof errors)[0], ...typeof errors],
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
            background: 'var(--accent-teal-muted)',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--accent-teal)'
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
            optimization={resolved.optimization}
            onSubmit={handleSubmit}
            onInvalid={handleInvalid}
            onValueChange={isAutoSave ? handleValueChange : undefined}
            formRegistry={formRegistry}
            mode={isAutoSave ? 'onChange' : undefined}
            className="space-y-4"
          >
            {!isAutoSave && (
              <button type="submit" className="btn-accent h-8 px-4 text-xs rounded-md">
                Submit
              </button>
            )}
            {isAutoSave && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Auto-save mode — values sync live to Results.
              </div>
            )}
          </ZodForm>
        </div>
      ) : (
        !error && <EmptyPreviewState />
      )}

      {submitResult && <ResultsPanel result={submitResult} />}
    </div>
  );
}

/**
 * Empty state shown while the schema editor is empty or invalid.
 * Composed around the teal→pink brand gradient to reinforce the
 * "zod (input) → form (output)" mental model.
 */
function EmptyPreviewState() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ color: 'var(--text-muted)' }}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-3"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.04em' }}
      >
        <span
          style={{
            color: 'var(--accent-teal)',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--accent-teal-muted)',
            border: '1px solid var(--accent-teal-muted)'
          }}
        >
          z.object({'{…}'})
        </span>
        <span
          aria-hidden="true"
          style={{
            width: 28,
            height: 1,
            background: 'linear-gradient(90deg, var(--accent-teal) 0%, var(--accent-pink) 100%)'
          }}
        />
        <span
          style={{
            color: 'var(--accent-pink)',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--accent-pink-muted)',
            border: '1px solid var(--accent-pink-muted)'
          }}
        >
          &lt;Form /&gt;
        </span>
      </div>
      <div className="flex flex-col gap-1" style={{ maxWidth: 320 }}>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}
        >
          Write a Zod schema to preview your form
        </p>
        <p className="text-xs" style={{ margin: 0 }}>
          Try an example from the <span style={{ color: 'var(--accent-teal)' }}>Examples</span>{' '}
          menu, or start typing in the schema editor.
        </p>
      </div>
    </div>
  );
}
