import type { FormField } from '@zod-to-form/core';

export type ComponentMapType = 'default' | 'shadcn';
export type ActiveTab = 'preview' | 'inspect' | 'code';
export type ActivePane = 'editor' | 'preview';
export type ConfigTab = 'form' | 'ts';
export type CodeOutputMode = 'react' | 'cli';

export interface PaneSizes {
  /** Left/right column split (% allocated to left column) */
  verticalSplit: number;
  /** Schema editor / config pane split in left column (% allocated to top) */
  leftHorizontalSplit: number;
  /** Preview / code output split in right column (% allocated to top) */
  rightHorizontalSplit: number;
}

export const DEFAULT_PANE_SIZES: PaneSizes = {
  verticalSplit: 50,
  leftHorizontalSplit: 50,
  rightHorizontalSplit: 50
};

export const MIN_PANE_PCT = 15;
export const MAX_PANE_PCT = 85;

/** Clamp all pane size values to the valid range */
export function clampPaneSizes(sizes: PaneSizes): PaneSizes {
  const clamp = (v: number) => Math.max(MIN_PANE_PCT, Math.min(MAX_PANE_PCT, v));
  return {
    verticalSplit: clamp(sizes.verticalSplit),
    leftHorizontalSplit: clamp(sizes.leftHorizontalSplit),
    rightHorizontalSplit: clamp(sizes.rightHorizontalSplit)
  };
}

export interface EvaluationError {
  type: 'syntax' | 'runtime' | 'timeout' | 'import';
  message: string;
  line?: number;
  column?: number;
}

export type SubmitResult =
  | { success: true; data: Record<string, unknown>; errors: null; timestamp: number }
  | {
      success: false;
      data: null;
      errors: [{ path: string; message: string }, ...Array<{ path: string; message: string }>];
      timestamp: number;
    };

export interface ExampleSchema {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'patterns';
  source: string;
  tags: string[];
}

export interface PlaygroundConfig {
  components?: {
    source?: string;
    preset?: 'shadcn' | 'html';
    [key: string]: unknown;
  };
  defaults?: {
    mode?: 'submit' | 'auto-save';
    ui?: 'shadcn' | 'html';
    overwrite?: boolean;
    serverAction?: boolean;
    formProvider?: boolean;
    [key: string]: unknown;
  };
  fields?: Record<string, unknown>;
}

export interface ShareState {
  code: string;
  map?: ComponentMapType;
  tab?: ActiveTab;
}

export type PersistedState = Pick<
  PlaygroundState,
  | 'editorContent'
  | 'componentMap'
  | 'activeTab'
  | 'config'
  | 'configTab'
  | 'codeOutputMode'
  | 'paneSizes'
> & { version: number };

export interface PlaygroundState {
  editorContent: string;
  componentMap: ComponentMapType;
  activeTab: ActiveTab;
  activePane: ActivePane;
  configTab: ConfigTab;
  codeOutputMode: CodeOutputMode;
  paneSizes: PaneSizes;
  lastValidFields: FormField[] | null;
  evaluationError: EvaluationError | null;
  submitResult: SubmitResult | null;
  config: PlaygroundConfig | null;
  customComponents: Record<string, string> | null;
}
