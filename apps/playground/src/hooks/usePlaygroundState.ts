import { useState, useCallback, useEffect } from "react";
import type { FormField } from "@zod-to-form/core";
import type {
  PlaygroundState,
  ComponentMapType,
  ActiveTab,
  ActivePane,
  EvaluationError,
  SubmitResult,
  PlaygroundConfig,
} from "../types/playground.ts";
import {
  loadPlaygroundState,
  savePlaygroundState,
} from "../lib/storage.ts";
import { decodeShareState } from "../lib/share.ts";
import { STARTER_SCHEMA } from "../components/examples/starter.ts";

function getInitialState(): PlaygroundState {
  const hash = window.location.hash;
  const shared = decodeShareState(hash);
  if (shared) {
    return {
      editorContent: shared.code,
      componentMap: shared.map ?? "default",
      activeTab: shared.tab ?? "preview",
      activePane: "editor",
      lastValidFields: null,
      evaluationError: null,
      submitResult: null,
      config: null,
      customComponents: null,
    };
  }

  const persisted = loadPlaygroundState();
  if (persisted) {
    return {
      editorContent: persisted.editorContent,
      componentMap: persisted.componentMap,
      activeTab: persisted.activeTab,
      activePane: "editor",
      lastValidFields: null,
      evaluationError: null,
      submitResult: null,
      config: persisted.config,
      customComponents: null,
    };
  }

  return {
    editorContent: STARTER_SCHEMA,
    componentMap: "default",
    activeTab: "preview",
    activePane: "editor",
    lastValidFields: null,
    evaluationError: null,
    submitResult: null,
    config: null,
    customComponents: null,
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
      version: 1,
    });
  }, [state.editorContent, state.componentMap, state.activeTab, state.config]);

  const setEditorContent = useCallback((content: string) => {
    setState((s) => ({ ...s, editorContent: content }));
  }, []);

  const setComponentMap = useCallback((map: ComponentMapType) => {
    setState((s) => ({ ...s, componentMap: map }));
  }, []);

  const setActiveTab = useCallback((tab: ActiveTab) => {
    setState((s) => ({ ...s, activeTab: tab }));
  }, []);

  const setActivePane = useCallback((pane: ActivePane) => {
    setState((s) => ({ ...s, activePane: pane }));
  }, []);

  const setEvalResult = useCallback(
    (fields: FormField[] | null, error: EvaluationError | null) => {
      setState((s) => ({
        ...s,
        lastValidFields: fields ?? s.lastValidFields,
        evaluationError: error,
      }));
    },
    [],
  );

  const setSubmitResult = useCallback((result: SubmitResult | null) => {
    setState((s) => ({ ...s, submitResult: result }));
  }, []);

  const setConfig = useCallback((config: PlaygroundConfig | null) => {
    setState((s) => ({ ...s, config }));
  }, []);

  const setCustomComponents = useCallback(
    (customComponents: Record<string, string> | null) => {
      setState((s) => ({ ...s, customComponents }));
    },
    [],
  );

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
  };
}
