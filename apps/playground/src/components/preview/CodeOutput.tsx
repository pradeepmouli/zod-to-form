import { useMemo, useState, useCallback } from 'react';
import type { FormField } from '@zod-to-form/core';
import { generateFormComponent } from '@zod-to-form/codegen';
import type { ComponentMapType, CodeOutputMode } from '../../types/playground.ts';
import { generateFormCode, generateZodFormCode } from '../../lib/codegen.ts';
import { CodeViewer } from './CodeViewer.tsx';

function copyButtonLabel(failed: boolean, copied: boolean): string {
  if (failed) return 'Copy failed';
  if (copied) return 'Copied!';
  return 'Copy';
}

interface CodeOutputProps {
  fields: FormField[] | null;
  componentMap: ComponentMapType;
  customComponentNames: string[];
  codeOutputMode: CodeOutputMode;
  onCodeOutputModeChange: (mode: CodeOutputMode) => void;
}

export function CodeOutput({
  fields,
  componentMap,
  customComponentNames,
  codeOutputMode,
  onCodeOutputModeChange
}: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const useZodForm = componentMap === 'shadcn' || customComponentNames.length > 0;

  const { code: generatedCode, error: codegenError } = useMemo(() => {
    if (!fields || fields.length === 0) return { code: null, error: null };
    try {
      let code: string;
      if (codeOutputMode === 'cli') {
        code = generateFormComponent(fields, {
          schemaImportPath: './schema',
          exportName: 'schema',
          componentName: 'GeneratedForm',
          mode: 'submit',
          ui: componentMap === 'shadcn' ? 'shadcn' : 'html',
          formProvider: false
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
  }, [fields, codeOutputMode, useZodForm, componentMap, customComponentNames]);

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
        <CodeOutputHeader mode={codeOutputMode} onModeChange={onCodeOutputModeChange} />
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
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <CodeOutputHeader mode={codeOutputMode} onModeChange={onCodeOutputModeChange} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {modeLabel}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="btn-glass text-xs px-3 py-1"
          style={
            copied
              ? { color: 'var(--accent-violet)', borderColor: 'var(--border-glow)' }
              : undefined
          }
        >
          {copyButtonLabel(copyFailed, copied)}
        </button>
      </div>
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
        className={`px-2 py-1 text-[11px] font-medium transition-all ${
          mode === 'react' ? 'tab-active' : ''
        }`}
        style={{
          color: mode === 'react' ? 'var(--accent-violet)' : 'var(--text-muted)',
          borderRadius: '4px'
        }}
      >
        React
      </button>
      <button
        role="tab"
        aria-selected={mode === 'cli'}
        onClick={() => onModeChange('cli')}
        className={`px-2 py-1 text-[11px] font-medium transition-all ${
          mode === 'cli' ? 'tab-active' : ''
        }`}
        style={{
          color: mode === 'cli' ? 'var(--accent-violet)' : 'var(--text-muted)',
          borderRadius: '4px'
        }}
      >
        CLI
      </button>
    </div>
  );
}
