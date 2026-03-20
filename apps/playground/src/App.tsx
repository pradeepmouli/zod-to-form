import { useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { usePlaygroundState } from "./hooks/usePlaygroundState.ts";
import { useDebouncedEval } from "./hooks/useDebouncedEval.ts";
import { Header } from "./components/layout/Header.tsx";
import { PlaygroundShell } from "./components/layout/PlaygroundShell.tsx";
import { FormPreview } from "./components/preview/FormPreview.tsx";
import { CodeOutput } from "./components/preview/CodeOutput.tsx";
import { IRInspector } from "./components/inspect/IRInspector.tsx";
import { STARTER_SCHEMA } from "./components/examples/starter.ts";
import { compileComponents } from "./lib/component-compiler.ts";

const SchemaEditor = lazy(() =>
  import("./components/editor/SchemaEditor.tsx").then((m) => ({
    default: m.SchemaEditor,
  })),
);

const ExampleGallery = lazy(() =>
  import("./components/examples/ExampleGallery.tsx").then((m) => ({
    default: m.ExampleGallery,
  })),
);

const ConfigImportExport = lazy(() =>
  import("./components/config/ConfigImportExport.tsx").then((m) => ({
    default: m.ConfigImportExport,
  })),
);

const CustomComponentImport = lazy(() =>
  import("./components/config/CustomComponentImport.tsx").then((m) => ({
    default: m.CustomComponentImport,
  })),
);

function EditorFallback() {
  return (
    <div
      className="h-full flex items-center justify-center text-sm"
      style={{ color: "var(--text-muted)" }}
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
  } = usePlaygroundState();

  const { fields, error, isEvaluating } = useDebouncedEval(
    state.editorContent,
  );

  const [examplesOpen, setExamplesOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [customImportOpen, setCustomImportOpen] = useState(false);
  const [compilationErrors, setCompilationErrors] = useState<Record<string, string>>({});
  const initialContent = useRef(state.editorContent);

  const compilationResult = useMemo(() => {
    if (!state.customComponents || Object.keys(state.customComponents).length === 0) {
      return { components: {} as Record<string, ComponentType<Record<string, unknown>>>, errors: {} as Record<string, string> };
    }
    return compileComponents(state.customComponents);
  }, [state.customComponents]);

  const compiledComponents = compilationResult.components;

  useEffect(() => {
    setCompilationErrors(compilationResult.errors);
  }, [compilationResult.errors]);

  const displayFields = fields ?? state.lastValidFields;
  const hasUnsavedChanges =
    state.editorContent !== initialContent.current &&
    state.editorContent !== STARTER_SCHEMA;

  const handleExampleSelect = (source: string) => {
    setEditorContent(source);
    initialContent.current = source;
  };

  const handleCustomComponentImport = useCallback(
    (components: Record<string, string>) => {
      setCustomComponents({
        ...state.customComponents,
        ...components,
      });
    },
    [state.customComponents, setCustomComponents],
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <Header
        componentMap={state.componentMap}
        onComponentMapChange={setComponentMap}
        editorContent={state.editorContent}
        onExamplesClick={() => setExamplesOpen(true)}
        onConfigClick={() => setConfigOpen(true)}
        onCustomImportClick={() => setCustomImportOpen(true)}
        customComponentCount={Object.keys(state.customComponents ?? {}).length}
      />
      <PlaygroundShell
        editor={
          <Suspense fallback={<EditorFallback />}>
            <SchemaEditor
              value={state.editorContent}
              onChange={setEditorContent}
            />
          </Suspense>
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
          />
        }
        codeOutput={
          <CodeOutput
            fields={displayFields}
            editorContent={state.editorContent}
          />
        }
        inspect={<IRInspector fields={displayFields} />}
        activeTab={state.activeTab}
        activePane={state.activePane}
        onTabChange={setActiveTab}
        onPaneChange={setActivePane}
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
      {configOpen && (
        <Suspense fallback={null}>
          <ConfigImportExport
            isOpen={configOpen}
            onClose={() => setConfigOpen(false)}
            config={state.config}
            onConfigChange={setConfig}
          />
        </Suspense>
      )}
      {customImportOpen && (
        <Suspense fallback={null}>
          <CustomComponentImport
            isOpen={customImportOpen}
            onClose={() => setCustomImportOpen(false)}
            onImport={handleCustomComponentImport}
            onSwitchToShadcn={() => setComponentMap("shadcn")}
            compilationErrors={compilationErrors}
          />
        </Suspense>
      )}
    </div>
  );
}
