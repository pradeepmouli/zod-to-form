import { z } from 'zod';
import type { PersistedState } from '../types/playground.ts';
import { DEFAULT_PANE_SIZES, MIN_PANE_PCT, MAX_PANE_PCT } from '../types/playground.ts';

const STORAGE_KEY = 'z2f-playground-state';
const CURRENT_VERSION = 1;

/** Zod schema for validating persisted state on load */
const PaneSizesSchema = z.object({
  verticalSplit: z.number().min(MIN_PANE_PCT).max(MAX_PANE_PCT),
  leftHorizontalSplit: z.number().min(MIN_PANE_PCT).max(MAX_PANE_PCT),
  rightHorizontalSplit: z.number().min(MIN_PANE_PCT).max(MAX_PANE_PCT)
});

const PersistedStateSchema = z.object({
  editorContent: z.string(),
  componentMap: z.enum(['default', 'shadcn']),
  activeTab: z.enum(['preview', 'inspect', 'code']),
  config: z.union([
    z.object({
      components: z.record(z.string(), z.unknown()).optional(),
      fields: z.record(z.string(), z.unknown()).optional(),
      defaults: z.record(z.string(), z.unknown()).optional()
    }),
    z.null()
  ]),
  configTab: z.enum(['form', 'ts']).optional(),
  codeOutputMode: z.enum(['react', 'cli']).optional(),
  paneSizes: PaneSizesSchema.optional(),
  version: z.number()
});

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function savePlaygroundState(state: PersistedState): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[zod-to-form] Failed to save state to localStorage:', err);
    }
  }, 500);
}

export function loadPlaygroundState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = PersistedStateSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[zod-to-form] Persisted state validation failed:', result.error.issues);
      return null;
    }
    return {
      ...result.data,
      configTab: result.data.configTab ?? 'form',
      codeOutputMode: result.data.codeOutputMode ?? 'react',
      paneSizes: result.data.paneSizes ?? DEFAULT_PANE_SIZES,
      version: CURRENT_VERSION
    };
  } catch (err) {
    console.warn('[zod-to-form] Failed to load persisted state:', err);
    return null;
  }
}
