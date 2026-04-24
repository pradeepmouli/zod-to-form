import { useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { usePlaygroundState } from './hooks/usePlaygroundState.ts';
import { useDebouncedEval } from './hooks/useDebouncedEval.ts';
import { DegradedNotice } from './components/layout/DegradedNotice.tsx';
import { Header } from './components/layout/Header.tsx';
import { PlaygroundShell } from './components/layout/PlaygroundShell.tsx';
import { FormPreview } from './components/preview/FormPreview.tsx';
import { CodeOutput } from './components/preview/CodeOutput.tsx';
import { IRInspector } from './components/inspect/IRInspector.tsx';
import { ConfigPane } from './components/config/ConfigPane.tsx';
import { STARTER_SCHEMA } from './components/examples/starter.ts';
import { compileComponents } from './lib/component-compiler.ts';
import { exportBundle } from './lib/export.ts';
import { useShadcnComponents } from './hooks/useShadcnComponents.ts';
import type { FormField } from '@zod-to-form/core';

/** Components pre-fetched by useShadcnComponents on first load. */
const CORE_SHADCN = new Set([
  'Button',
  'Checkbox',
  'Input',
  'Label',
  'Select',
  'Switch',
  'Textarea'
]);

/**
 * Whitelist mapping `FormField.component` slot names to shadcn registry names
 * for components that are NOT in the core pre-fetch set but SHOULD be
 * on-demand fetched if a schema ever uses them.
 *
 * Structural slots produced by the core walker (`ArrayField`, `Fieldset`,
 * `Field`, etc.) are intentionally absent — they have no shadcn registry
 * entry and fetching them would 404 and trigger the degraded banner for
 * every schema with arrays/records/objects.
 */
const EXTRA_SHADCN_SLOTS: Readonly<Record<string, string>> = {
  RadioGroup: 'radio-group'
  // Extend here when new shadcn-backed slots land in core.
};

/** Walk an IR tree and collect every whitelisted non-core shadcn slot. */
function collectExtraShadcnNames(fields: readonly FormField[] | null): string[] {
  if (!fields) return [];
  const extras = new Set<string>();
  const visit = (f: FormField) => {
    if (f.component && !CORE_SHADCN.has(f.component)) {
      const registryName = EXTRA_SHADCN_SLOTS[f.component];
      if (registryName) extras.add(registryName);
    }
    if (f.arrayItem) visit(f.arrayItem);
    if (f.children) for (const c of f.children) visit(c);
  };
  for (const f of fields) visit(f);
  return Array.from(extras);
}

const SchemaEditor = lazy(() =>
  import('./components/editor/SchemaEditor.tsx').then((m) => ({
    default: m.SchemaEditor
  }))
);

const ExampleGallery = lazy(() =>
  import('./components/examples/ExampleGallery.tsx').then((m) => ({
    default: m.ExampleGallery
  }))
);

const CustomComponentImport = lazy(() =>
  import('./components/config/CustomComponentImport.tsx').then((m) => ({
    default: m.CustomComponentImport
  }))
);

function EditorFallback() {
  return (
    <div
      className="h-full flex items-center justify-center text-sm"
      style={{ color: 'var(--text-muted)' }}
    >
      Loading editor...
    </div>
  );
}

export function App() {
  const {
    state,
    setEditorContent,
    setComponentMap,
    setActiveTab,
    setActivePane,
    setSubmitResult,
    setConfig,
    setCustomComponents,
    setConfigTab,
    setCodeOutputMode,
    setPaneSizes
  } = usePlaygroundState();

  const { fields, error, isEvaluating } = useDebouncedEval(state.editorContent);

  const [examplesOpen, setExamplesOpen] = useState(false);
  const [customImportOpen, setCustomImportOpen] = useState(false);
  const [compilationErrors, setCompilationErrors] = useState<Record<string, string>>({});
  const initialContent = useRef(state.editorContent);

  // Derive any non-core components the current schema actually needs.
  const extraShadcnNames = useMemo(
    () => collectExtraShadcnNames(fields ?? state.lastValidFields),
    [fields, state.lastValidFields]
  );

  // Fetch + compile real shadcn/ui components from the public registry.
  // Pass on-demand extras so schemas using non-core slots (e.g. RadioGroup)
  // trigger an in-session fetch instead of falling back to defaults.
  const shadcn = useShadcnComponents(state.componentMap === 'shadcn', extraShadcnNames);

  const compilationResult = useMemo(() => {
    if (!state.customComponents || Object.keys(state.customComponents).length === 0) {
      return {
        components: {} as Record<string, ComponentType<Record<string, unknown>>>,
        errors: {} as Record<string, string>
      };
    }
    return compileComponents(state.customComponents);
  }, [state.customComponents]);

  // Merge: shadcn registry components as base, custom imports override
  const compiledComponents = useMemo(() => {
    return { ...shadcn.components, ...compilationResult.components };
  }, [shadcn.components, compilationResult.components]);

  const customComponentNames = useMemo(() => Object.keys(compiledComponents), [compiledComponents]);

  useEffect(() => {
    setCompilationErrors(compilationResult.errors);
  }, [compilationResult.errors]);

  const displayFields = fields ?? state.lastValidFields;
  const hasUnsavedChanges =
    state.editorContent !== initialContent.current && state.editorContent !== STARTER_SCHEMA;

  const handleExampleSelect = (source: string) => {
    setEditorContent(source);
    initialContent.current = source;
  };

  const handleExport = useCallback(() => {
    exportBundle({
      config: state.config,
      componentMap: state.componentMap,
      customComponents: state.customComponents
    });
  }, [state.config, state.componentMap, state.customComponents]);

  const handleCustomComponentImport = useCallback(
    (components: Record<string, string>) => {
      setCustomComponents({
        ...state.customComponents,
        ...components
      });
    },
    [state.customComponents, setCustomComponents]
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <Header
        componentMap={state.componentMap}
        onComponentMapChange={setComponentMap}
        editorContent={state.editorContent}
        onExamplesClick={() => setExamplesOpen(true)}
        onExportClick={handleExport}
        onCustomImportClick={() => setCustomImportOpen(true)}
        customComponentCount={Object.keys(state.customComponents ?? {}).length}
      />
      {state.componentMap === 'shadcn' ? <DegradedNotice errors={shadcn.errors} /> : null}
      <PlaygroundShell
        editor={
          <Suspense fallback={<EditorFallback />}>
            <SchemaEditor value={state.editorContent} onChange={setEditorContent} />
          </Suspense>
        }
        configPane={
          <ConfigPane
            fields={displayFields}
            config={state.config}
            componentMap={state.componentMap}
            configTab={state.configTab}
            customComponentNames={customComponentNames}
            compiledComponents={compiledComponents}
            onConfigTabChange={setConfigTab}
            onConfigChange={setConfig}
          />
        }
        preview={
          <FormPreview
            fields={displayFields}
            error={error}
            isEvaluating={isEvaluating}
            componentMap={state.componentMap}
            submitResult={state.submitResult}
            onSubmitResult={setSubmitResult}
            editorContent={state.editorContent}
            compiledComponents={compiledComponents}
            mode={state.config?.defaults?.mode}
          />
        }
        codeOutput={
          <CodeOutput
            fields={displayFields}
            componentMap={state.componentMap}
            customComponentNames={customComponentNames}
            config={state.config}
            codeOutputMode={state.codeOutputMode}
            onCodeOutputModeChange={setCodeOutputMode}
          />
        }
        inspect={<IRInspector fields={displayFields} />}
        activeTab={state.activeTab}
        activePane={state.activePane}
        paneSizes={state.paneSizes}
        onTabChange={setActiveTab}
        onPaneChange={setActivePane}
        onPaneSizesChange={setPaneSizes}
      />
      {examplesOpen && (
        <Suspense fallback={null}>
          <ExampleGallery
            isOpen={examplesOpen}
            onClose={() => setExamplesOpen(false)}
            onSelect={handleExampleSelect}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </Suspense>
      )}
      {customImportOpen && (
        <Suspense fallback={null}>
          <CustomComponentImport
            isOpen={customImportOpen}
            onClose={() => setCustomImportOpen(false)}
            onImport={handleCustomComponentImport}
            onSwitchToStyled={() => setComponentMap('shadcn')}
            compilationErrors={compilationErrors}
          />
        </Suspense>
      )}
    </div>
  );
}
