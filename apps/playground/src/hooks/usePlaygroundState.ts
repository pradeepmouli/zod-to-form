import { useState, useCallback, useEffect } from 'react';
import type { FormField } from '@zod-to-form/core';
import type {
  PlaygroundState,
  ComponentMapType,
  ActiveTab,
  ActivePane,
  ConfigTab,
  CodeOutputMode,
  PaneSizes,
  EvaluationError,
  SubmitResult,
  PlaygroundConfig
} from '../types/playground.ts';
import { DEFAULT_PANE_SIZES } from '../types/playground.ts';
import { loadPlaygroundState, savePlaygroundState } from '../lib/storage.ts';
import { decodeShareState } from '../lib/share.ts';
import { STARTER_SCHEMA } from '../components/examples/starter.ts';

function getInitialState(): PlaygroundState {
  try {
    const hash = window.location.hash;
    const shareResult = decodeShareState(hash);

    if (shareResult?.ok) {
      const shared = shareResult.state;
      return {
        editorContent: shared.code,
        componentMap: shared.map ?? 'default',
        activeTab: shared.tab ?? 'preview',
        activePane: 'editor',
        configTab: 'form',
        codeOutputMode: 'react',
        paneSizes: DEFAULT_PANE_SIZES,
        lastValidFields: null,
        evaluationError: null,
        submitResult: null,
        config: null,
        customComponents: null
      };
    }

    if (shareResult && !shareResult.ok) {
      console.warn('[zod-to-form] Share link error:', shareResult.error);
    }
  } catch {
    // Fall through to persisted/default state
  }

  const persisted = loadPlaygroundState();
  if (persisted) {
    return {
      editorContent: persisted.editorContent,
      componentMap: persisted.componentMap,
      activeTab: persisted.activeTab,
      activePane: 'editor',
      configTab: persisted.configTab,
      codeOutputMode: persisted.codeOutputMode,
      paneSizes: persisted.paneSizes,
      lastValidFields: null,
      evaluationError: null,
      submitResult: null,
      config: persisted.config,
      customComponents: null
    };
  }

  return {
    editorContent: STARTER_SCHEMA,
    componentMap: 'default',
    activeTab: 'preview',
    activePane: 'editor',
    configTab: 'form',
    codeOutputMode: 'react',
    paneSizes: DEFAULT_PANE_SIZES,
    lastValidFields: null,
    evaluationError: null,
    submitResult: null,
    config: null,
    customComponents: null
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

  function makeFieldSetter<K extends keyof PlaygroundState>(key: K) {
    return useCallback((value: PlaygroundState[K]) => {
      setState((s) => ({ ...s, [key]: value }));
    }, []);
  }

  const setEditorContent = makeFieldSetter('editorContent');
  const setComponentMap = makeFieldSetter('componentMap');
  const setActiveTab = makeFieldSetter('activeTab');
  const setActivePane = makeFieldSetter('activePane');
  const setSubmitResult = makeFieldSetter('submitResult');
  const setConfig = makeFieldSetter('config');
  const setCustomComponents = makeFieldSetter('customComponents');
  const setConfigTab = makeFieldSetter('configTab');
  const setCodeOutputMode = makeFieldSetter('codeOutputMode');
  const setPaneSizes = makeFieldSetter('paneSizes');

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
