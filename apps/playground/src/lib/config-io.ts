import type { PlaygroundConfig } from "../types/playground.ts";

export interface ConfigImportResult {
  ok: true;
  config: PlaygroundConfig;
  warnings: string[];
}

export interface ConfigImportError {
  ok: false;
  error: string;
}

export async function importConfig(
  input: string | File,
): Promise<ConfigImportResult | ConfigImportError> {
  try {
    let raw: string;
    if (typeof input === "string") {
      raw = input;
    } else {
      raw = await input.text();
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const warnings: string[] = [];

    const config: PlaygroundConfig = {};
    if (parsed.components && typeof parsed.components === "object") {
      config.components = parsed.components as Record<string, unknown>;
    } else if (parsed.components !== undefined) {
      warnings.push("'components' field is invalid and was ignored");
    }

    if (parsed.fields && typeof parsed.fields === "object") {
      config.fields = parsed.fields as Record<string, unknown>;
    } else if (parsed.fields !== undefined) {
      warnings.push("'fields' field is invalid and was ignored");
    }

    if (parsed.defaults && typeof parsed.defaults === "object") {
      config.defaults = parsed.defaults as Record<string, unknown>;
    } else if (parsed.defaults !== undefined) {
      warnings.push("'defaults' field is invalid and was ignored");
    }

    const knownKeys = new Set(["components", "fields", "defaults"]);
    for (const key of Object.keys(parsed)) {
      if (!knownKeys.has(key)) {
        warnings.push(`Unrecognized field '${key}' was ignored`);
      }
    }

    return { ok: true, config, warnings };
  } catch {
    return { ok: false, error: "Invalid JSON format" };
  }
}

export function exportConfig(config: PlaygroundConfig): string {
  return JSON.stringify(config, null, 2);
}
