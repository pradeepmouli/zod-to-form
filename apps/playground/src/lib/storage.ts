import type { PersistedState } from "../types/playground.ts";

const STORAGE_KEY = "z2f-playground-state";
const CURRENT_VERSION = 1;

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function savePlaygroundState(state: PersistedState): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable
    }
  }, 500);
}

export function loadPlaygroundState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.editorContent !== "string" ||
      typeof parsed.version !== "number"
    ) {
      return null;
    }
    return {
      editorContent: parsed.editorContent,
      componentMap:
        parsed.componentMap === "shadcn" ? "shadcn" : "default",
      activeTab:
        parsed.activeTab === "inspect" || parsed.activeTab === "code"
          ? parsed.activeTab
          : "preview",
      config: (parsed.config as PersistedState["config"]) ?? null,
      version: CURRENT_VERSION,
    };
  } catch {
    return null;
  }
}
