import { useState, useRef } from "react";
import { usePlaygroundState } from "./hooks/usePlaygroundState.ts";
import { useDebouncedEval } from "./hooks/useDebouncedEval.ts";
import { Header } from "./components/layout/Header.tsx";
import { PlaygroundShell } from "./components/layout/PlaygroundShell.tsx";
import { SchemaEditor } from "./components/editor/SchemaEditor.tsx";
import { FormPreview } from "./components/preview/FormPreview.tsx";
import { IRInspector } from "./components/inspect/IRInspector.tsx";
import { ExampleGallery } from "./components/examples/ExampleGallery.tsx";
import { ConfigImportExport } from "./components/config/ConfigImportExport.tsx";
import { STARTER_SCHEMA } from "./components/examples/starter.ts";

export function App() {
  const {
    state,
    setEditorContent,
    setComponentMap,
    setActiveTab,
    setActivePane,
    setSubmitResult,
    setConfig,
  } = usePlaygroundState();

  const { fields, error, isEvaluating } = useDebouncedEval(
    state.editorContent,
  );

  const [examplesOpen, setExamplesOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const initialContent = useRef(state.editorContent);

  const displayFields = fields ?? state.lastValidFields;
  const hasUnsavedChanges =
    state.editorContent !== initialContent.current &&
    state.editorContent !== STARTER_SCHEMA;

  const handleExampleSelect = (source: string) => {
    setEditorContent(source);
    initialContent.current = source;
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100">
      <Header
        componentMap={state.componentMap}
        onComponentMapChange={setComponentMap}
        editorContent={state.editorContent}
        onExamplesClick={() => setExamplesOpen(true)}
        onConfigClick={() => setConfigOpen(true)}
      />
      <PlaygroundShell
        editor={
          <SchemaEditor
            value={state.editorContent}
            onChange={setEditorContent}
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
          />
        }
        inspect={<IRInspector fields={displayFields} />}
        activeTab={state.activeTab}
        activePane={state.activePane}
        onTabChange={setActiveTab}
        onPaneChange={setActivePane}
      />
      <ExampleGallery
        isOpen={examplesOpen}
        onClose={() => setExamplesOpen(false)}
        onSelect={handleExampleSelect}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <ConfigImportExport
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        config={state.config}
        onConfigChange={setConfig}
      />
    </div>
  );
}
