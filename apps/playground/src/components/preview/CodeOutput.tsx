import { useMemo, useState, useCallback } from 'react';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent } from '@zod-to-form/codegen';
import type { ZodFormsConfig } from '@zod-to-form/core';
import type { ComponentMapType, CodeOutputMode, PlaygroundConfig } from '../../types/playground.ts';
import { generateFormCode, generateZodFormCode } from '../../lib/codegen.ts';
import { CodeViewer } from './CodeViewer.tsx';
import { PanelHeader } from '../layout/PanelHeader.tsx';

function copyButtonLabel(failed: boolean, copied: boolean): string {
  if (failed) return 'Copy failed';
  if (copied) return 'Copied!';
  return 'Copy';
}

interface CodeOutputProps {
  fields: FormField[] | null;
  componentMap: ComponentMapType;
  customComponentNames: string[];
  /** Current z2f.config from the Config pane — drives componentConfig + defaults.mode */
  config: PlaygroundConfig | null;
  codeOutputMode: CodeOutputMode;
  onCodeOutputModeChange: (mode: CodeOutputMode) => void;
}

export function CodeOutput({
  fields,
  componentMap,
  customComponentNames,
  config,
  codeOutputMode,
  onCodeOutputModeChange
}: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const useZodForm = componentMap === 'shadcn' || customComponentNames.length > 0;

  /**
   * Build a componentConfig that reflects both the user's z2f.config edits
   * AND any components imported via the Component Explorer. Imported
   * components register as component-level overrides so codegen emits
   * `import { Checkbox } from './components/checkbox'` etc.
   */
  const componentConfig = useMemo((): ZodFormsConfig<Record<string, unknown>> => {
    const preset: 'shadcn' | 'html' = componentMap === 'shadcn' ? 'shadcn' : 'html';
    const baseOverrides =
      (config?.components?.overrides as Record<string, Record<string, unknown>> | undefined) ?? {};
    const importOverrides: Record<string, Record<string, unknown>> = {};
    for (const name of customComponentNames) {
      // A bare override is enough to trigger the import; details come from
      // the component source the user already compiled/imported.
      importOverrides[name] = baseOverrides[name] ?? {};
    }
    return {
      components: {
        preset,
        source: config?.components?.source ?? './components',
        overrides: { ...baseOverrides, ...importOverrides }
      }
    } as unknown as ZodFormsConfig<Record<string, unknown>>;
  }, [componentMap, customComponentNames, config]);

  const { code: generatedCode, error: codegenError } = useMemo(() => {
    if (!fields || fields.length === 0) return { code: null, error: null };
    try {
      let code: string;
      if (codeOutputMode === 'cli') {
        code = generateFormComponent(fields, {
          schemaImportPath: './schema',
          exportName: 'schema',
          componentName: 'GeneratedForm',
          mode: config?.defaults?.mode ?? 'submit',
          ui: componentMap === 'shadcn' ? 'shadcn' : 'html',
          formProvider: config?.defaults?.formProvider ?? false,
          componentConfig
        });
      } else if (useZodForm) {
        code = generateZodFormCode(componentMap, customComponentNames);
      } else {
        code = generateFormCode(fields);
      }
      return { code, error: null };
    } catch (err) {
      console.warn('[zod-to-form] Code generation failed:', err);
      return { code: null, error: err instanceof Error ? err.message : 'Code generation failed' };
    }
  }, [
    fields,
    codeOutputMode,
    useZodForm,
    componentMap,
    customComponentNames,
    config,
    componentConfig
  ]);

  const handleCopy = useCallback(() => {
    if (!generatedCode) return;
    navigator.clipboard
      .writeText(generatedCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.warn('[zod-to-form] Clipboard write failed:', err);
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 2000);
      });
  }, [generatedCode]);

  let modeLabel: string;
  if (codeOutputMode === 'cli') {
    modeLabel = 'CLI (Codegen) output';
  } else if (useZodForm) {
    modeLabel = 'Generated ZodForm component';
  } else {
    modeLabel = 'Generated React + React Hook Form component';
  }

  if (!generatedCode) {
    return (
      <div className="h-full flex flex-col">
        <PanelHeader label="Output" accent="pink" caption={modeLabel}>
          <CodeOutputHeader mode={codeOutputMode} onModeChange={onCodeOutputModeChange} />
        </PanelHeader>
        <div
          className="flex-1 flex items-center justify-center"
          style={{ color: codegenError ? 'var(--accent-red)' : 'var(--text-secondary)' }}
        >
          <span className="text-sm">
            {codegenError
              ? `Code generation error: ${codegenError}`
              : 'Write a valid schema to see generated code'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PanelHeader label="Output" accent="pink" caption={modeLabel}>
        <CodeOutputHeader mode={codeOutputMode} onModeChange={onCodeOutputModeChange} />
        <button
          onClick={handleCopy}
          className="btn-glass text-xs px-3 py-1"
          style={
            copied ? { color: 'var(--accent-teal)', borderColor: 'var(--border-glow)' } : undefined
          }
        >
          {copyButtonLabel(copyFailed, copied)}
        </button>
      </PanelHeader>
      <div className="flex-1 overflow-hidden">
        <CodeViewer value={generatedCode} ariaLabel={modeLabel} />
      </div>
    </div>
  );
}

function CodeOutputHeader({
  mode,
  onModeChange
}: {
  mode: CodeOutputMode;
  onModeChange: (mode: CodeOutputMode) => void;
}) {
  return (
    <div className="flex gap-1" role="tablist" aria-label="Code output mode">
      <button
        role="tab"
        aria-selected={mode === 'react'}
        onClick={() => onModeChange('react')}
        className={`tab px-2 py-1 text-[12px] font-medium ${mode === 'react' ? 'tab-active' : ''}`}
      >
        React
      </button>
      <button
        role="tab"
        aria-selected={mode === 'cli'}
        onClick={() => onModeChange('cli')}
        className={`tab px-2 py-1 text-[12px] font-medium ${mode === 'cli' ? 'tab-active' : ''}`}
      >
        CLI
      </button>
    </div>
  );
}
