import type { FormField } from "@zod-to-form/core";

export type ComponentMapType = "default" | "shadcn";
export type ActiveTab = "preview" | "inspect";
export type ActivePane = "editor" | "preview";

export interface EvaluationError {
  type: "syntax" | "runtime" | "timeout" | "import";
  message: string;
  line?: number;
  column?: number;
}

export interface SubmitResult {
  success: boolean;
  data: Record<string, unknown> | null;
  errors: Array<{ path: string; message: string }> | null;
  timestamp: number;
}

export interface ExampleSchema {
  id: string;
  title: string;
  description: string;
  category: "basic" | "advanced" | "patterns";
  source: string;
  tags: string[];
}

export interface PlaygroundConfig {
  components?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
}

export interface ShareState {
  code: string;
  map?: ComponentMapType;
  tab?: ActiveTab;
}

export interface PersistedState {
  editorContent: string;
  componentMap: ComponentMapType;
  activeTab: ActiveTab;
  config: PlaygroundConfig | null;
  version: number;
}

export interface PlaygroundState {
  editorContent: string;
  componentMap: ComponentMapType;
  activeTab: ActiveTab;
  activePane: ActivePane;
  lastValidFields: FormField[] | null;
  evaluationError: EvaluationError | null;
  submitResult: SubmitResult | null;
  config: PlaygroundConfig | null;
  customComponents: Record<string, string> | null;
}
