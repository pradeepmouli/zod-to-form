/**
 * Contract: Export functionality for studio layout redesign.
 *
 * The Export button replaces the old Config button. It downloads
 * a z2f.config.ts file and, depending on whether custom components
 * are loaded, either bundles them or provides shadcn installation
 * instructions.
 */

/** Input to the export function — gathered from current playground state */
export interface ExportInput {
  /** Current PlaygroundConfig (components, fields, defaults) */
  config: Record<string, unknown>;
  /** Active component map type */
  componentMap: 'default' | 'shadcn';
  /** Custom component TSX sources, or null if using defaults */
  customComponents: Record<string, string> | null;
}

/** Single file entry in a zip bundle */
export interface ZipEntry {
  /** Relative path within the zip (e.g., "components/Button.tsx") */
  path: string;
  /** File content as UTF-8 string */
  content: string;
}

/**
 * Generates the z2f.config.ts content as a defineConfig(...) call.
 *
 * @param config - The current playground config
 * @param componentMap - The active component map
 * @returns TypeScript source code string
 */
export type GenerateConfigTs = (
  config: Record<string, unknown>,
  componentMap: 'default' | 'shadcn'
) => string;

/**
 * Builds the export bundle and triggers download.
 *
 * - If customComponents is non-null and non-empty: zip with component sources
 * - Otherwise: zip with shadcn config + README instructions
 *
 * @param input - Export input from current state
 */
export type ExportBundle = (input: ExportInput) => Promise<void>;
