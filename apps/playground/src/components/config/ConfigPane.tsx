import { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { FormField } from '@zod-to-form/core';
import type { ConfigTab, ComponentMapType, PlaygroundConfig } from '../../types/playground.ts';
import { ConfigForm } from './ConfigForm.tsx';
import { createConfigEditorExtensions } from '../editor/editor-setup.ts';
import { configCompletionSource } from '../../lib/config-completions.ts';
import {
  generateConfigSchema,
  filterOrphanedOverrides,
  configToFormValues,
  formValuesToConfig,
  serializeConfigToTs,
  parseConfigFromTs
} from '../../lib/config-schema.ts';

interface ConfigPaneProps {
  fields: FormField[] | null;
  config: PlaygroundConfig | null;
  componentMap: ComponentMapType;
  configTab: ConfigTab;
  customComponentNames: string[];
  onConfigTabChange: (tab: ConfigTab) => void;
  onConfigChange: (config: PlaygroundConfig | null) => void;
}

const TABS: { id: ConfigTab; label: string }[] = [
  { id: 'form', label: 'Form' },
  { id: 'ts', label: '.ts' }
];

export function ConfigPane({
  fields,
  config,
  componentMap,
  configTab,
  customComponentNames,
  onConfigTabChange,
  onConfigChange
}: ConfigPaneProps) {
  const configSchema = useMemo(() => generateConfigSchema(fields), [fields]);

  const filteredConfig = useMemo(() => filterOrphanedOverrides(config, fields), [config, fields]);

  const defaultValues = useMemo(
    () => configToFormValues(filteredConfig, fields, componentMap),
    [filteredConfig, fields, componentMap]
  );

  const [tsSource, setTsSource] = useState(() => serializeConfigToTs(config, componentMap));
  const [parseError, setParseError] = useState<string | null>(null);
  // Guards against re-serialization loops: when the .ts editor triggers a config
  // change, this counter prevents the useEffect from re-serializing back to .ts
  // source. A counter (not boolean) handles concurrent rapid updates correctly.
  const pendingInternalUpdates = useRef(0);

  // Re-serialize config to .ts source when config changes externally
  // (i.e., not from the .ts editor itself)
  useEffect(() => {
    if (pendingInternalUpdates.current > 0) {
      pendingInternalUpdates.current--;
      return;
    }
    setTsSource(serializeConfigToTs(config, componentMap));
    setParseError(null);
  }, [config, componentMap]);

  const handleFormChange = useCallback(
    (values: Record<string, unknown>) => {
      const newConfig = formValuesToConfig(values, filteredConfig);
      // Do NOT set isInternalUpdate here — form changes should sync to .ts source.
      // The guard only prevents .ts editor → config → .ts re-serialization loops.
      onConfigChange(newConfig);
    },
    [filteredConfig, onConfigChange]
  );

  const handleTsChange = useCallback(
    (source: string) => {
      setTsSource(source);
      const result = parseConfigFromTs(source);
      if (result.ok) {
        setParseError(null);
        pendingInternalUpdates.current++;
        onConfigChange(result.config);
      } else {
        setParseError(result.error);
      }
    },
    [onConfigChange]
  );

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex gap-1 px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        role="tablist"
        aria-label="Config view"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`config-tab-${tab.id}`}
            role="tab"
            aria-selected={configTab === tab.id}
            aria-controls="config-tabpanel"
            onClick={() => onConfigTabChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-all ${
              configTab === tab.id ? 'tab-active' : ''
            }`}
            style={{
              color: configTab === tab.id ? 'var(--accent-violet)' : 'var(--text-muted)',
              borderRadius: '6px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id="config-tabpanel"
        className="flex-1 min-h-0 overflow-auto"
        role="tabpanel"
        aria-labelledby={`config-tab-${configTab}`}
      >
        {configTab === 'form' ? (
          <div className="p-3">
            {parseError && (
              <div
                className="mb-3 px-3 py-2 text-xs rounded"
                style={{
                  background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)',
                  color: 'var(--accent-red)',
                  border: '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)'
                }}
              >
                Parse error in .ts view: {parseError}
              </div>
            )}
            <ConfigForm
              schema={configSchema}
              defaultValues={defaultValues}
              fields={fields}
              onChange={handleFormChange}
            />
          </div>
        ) : (
          <ConfigTsEditor
            source={tsSource}
            onChange={handleTsChange}
            parseError={parseError}
            fields={fields}
            customComponentNames={customComponentNames}
          />
        )}
      </div>
    </div>
  );
}

const ConfigTsEditor = memo(function ConfigTsEditor({
  source,
  onChange,
  parseError,
  fields,
  customComponentNames
}: {
  source: string;
  onChange: (source: string) => void;
  parseError: string | null;
  fields: FormField[] | null;
  customComponentNames: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const isInternalChange = useRef(false);
  const fieldsRef = useRef(fields);
  const customNamesRef = useRef(customComponentNames);
  onChangeRef.current = onChange;
  fieldsRef.current = fields;
  customNamesRef.current = customComponentNames;

  useEffect(() => {
    if (!containerRef.current) return;

    // Wrap completion source to read from refs, so the editor always has
    // current field/component data without needing to recreate the editor
    const completionFn = (ctx: import('@codemirror/autocomplete').CompletionContext) =>
      configCompletionSource(fieldsRef.current, customNamesRef.current)(ctx);

    const view = new EditorView({
      state: EditorState.create({
        doc: source,
        extensions: createConfigEditorExtensions((v) => {
          isInternalChange.current = true;
          onChangeRef.current(v);
        }, completionFn)
      }),
      parent: containerRef.current
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== source) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: source }
      });
    }
  }, [source]);

  return (
    <div className="flex flex-col h-full">
      {parseError && (
        <div
          className="px-3 py-2 text-xs"
          style={{
            background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)',
            color: 'var(--accent-red)',
            borderBottom: '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)'
          }}
        >
          {parseError}
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        aria-label="Config TypeScript editor"
      />
    </div>
  );
});
