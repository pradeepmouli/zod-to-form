import { z } from 'zod';
import type { PersistedState } from '../types/playground.ts';

const STORAGE_KEY = 'z2f-playground-state';
const CURRENT_VERSION = 1;

/** Zod schema for validating persisted state (dogfooding) */
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
    if (!result.success) return null;
    return {
      ...result.data,
      version: CURRENT_VERSION
    };
  } catch {
    return null;
  }
}
