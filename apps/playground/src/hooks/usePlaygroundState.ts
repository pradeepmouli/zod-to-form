import { useState, useCallback, useEffect } from 'react';
import type { FormField } from '@zod-to-form/core';
import type {
  PlaygroundState,
  EvaluationError
} from '../types/playground.ts';
import { DEFAULT_PANE_SIZES, clampPaneSizes } from '../types/playground.ts';
import { loadPlaygroundState, savePlaygroundState } from '../lib/storage.ts';
import { decodeShareState } from '../lib/share.ts';
import { STARTER_SCHEMA } from '../components/examples/starter.ts';

const EMPTY_RUNTIME_STATE = {
  activePane: 'editor' as const,
  lastValidFields: null,
  evaluationError: null,
  submitResult: null,
  customComponents: null
};

function getInitialState(): PlaygroundState {
  try {
    const hash = window.location.hash;
    const shareResult = decodeShareState(hash);

    if (shareResult?.ok) {
      const shared = shareResult.state;
      return {
        ...EMPTY_RUNTIME_STATE,
        editorContent: shared.code,
        componentMap: shared.map ?? 'default',
        activeTab: shared.tab ?? 'preview',
        configTab: 'form',
        codeOutputMode: 'react',
        paneSizes: DEFAULT_PANE_SIZES,
        config: null
      };
    }

    if (shareResult && !shareResult.ok) {
      console.warn('[zod-to-form] Share link error:', shareResult.error);
    }
  } catch (err) {
    console.warn('[zod-to-form] Failed to parse share state from URL hash:', err);
  }

  const persisted = loadPlaygroundState();
  if (persisted) {
    return {
      ...EMPTY_RUNTIME_STATE,
      editorContent: persisted.editorContent,
      componentMap: persisted.componentMap,
      activeTab: persisted.activeTab,
      configTab: persisted.configTab,
      codeOutputMode: persisted.codeOutputMode,
      paneSizes: persisted.paneSizes,
      config: persisted.config
    };
  }

  return {
    ...EMPTY_RUNTIME_STATE,
    editorContent: STARTER_SCHEMA,
    componentMap: 'default',
    activeTab: 'preview',
    configTab: 'form',
    codeOutputMode: 'react',
    paneSizes: DEFAULT_PANE_SIZES,
    config: null
  };
}

export function usePlaygroundState() {
  const [state, setState] = useState<PlaygroundState>(getInitialState);

  useEffect(() => {
    savePlaygroundState({
      editorContent: state.editorContent,
      componentMap: state.componentMap,
      activeTab: state.activeTab,
      config: state.config,
      configTab: state.configTab,
      codeOutputMode: state.codeOutputMode,
      paneSizes: state.paneSizes,
      version: 1
    });
  }, [
    state.editorContent,
    state.componentMap,
    state.activeTab,
    state.config,
    state.configTab,
    state.codeOutputMode,
    state.paneSizes
  ]);

  const setEditorContent = useCallback(
    (v: PlaygroundState['editorContent']) => setState((s) => ({ ...s, editorContent: v })),
    []
  );
  const setComponentMap = useCallback(
    (v: PlaygroundState['componentMap']) => setState((s) => ({ ...s, componentMap: v })),
    []
  );
  const setActiveTab = useCallback(
    (v: PlaygroundState['activeTab']) => setState((s) => ({ ...s, activeTab: v })),
    []
  );
  const setActivePane = useCallback(
    (v: PlaygroundState['activePane']) => setState((s) => ({ ...s, activePane: v })),
    []
  );
  const setSubmitResult = useCallback(
    (v: PlaygroundState['submitResult']) => setState((s) => ({ ...s, submitResult: v })),
    []
  );
  const setConfig = useCallback(
    (v: PlaygroundState['config']) => setState((s) => ({ ...s, config: v })),
    []
  );
  const setCustomComponents = useCallback(
    (v: PlaygroundState['customComponents']) => setState((s) => ({ ...s, customComponents: v })),
    []
  );
  const setConfigTab = useCallback(
    (v: PlaygroundState['configTab']) => setState((s) => ({ ...s, configTab: v })),
    []
  );
  const setCodeOutputMode = useCallback(
    (v: PlaygroundState['codeOutputMode']) => setState((s) => ({ ...s, codeOutputMode: v })),
    []
  );
  const setPaneSizes = useCallback(
    (v: PlaygroundState['paneSizes']) => setState((s) => ({ ...s, paneSizes: clampPaneSizes(v) })),
    []
  );

  // setEvalResult updates two fields and needs special handling
  const setEvalResult = useCallback((fields: FormField[] | null, error: EvaluationError | null) => {
    setState((s) => ({
      ...s,
      lastValidFields: fields ?? s.lastValidFields,
      evaluationError: error
    }));
  }, []);

  return {
    state,
    setEditorContent,
    setComponentMap,
    setActiveTab,
    setActivePane,
    setEvalResult,
    setSubmitResult,
    setConfig,
    setCustomComponents,
    setConfigTab,
    setCodeOutputMode,
    setPaneSizes
  };
}
