import { zipSync, strToU8 } from 'fflate';
import type { PlaygroundConfig, ComponentMapType } from '../types/playground.ts';
import { serializeConfigToTs } from './config-schema.ts';

/**
 * Generate a full z2f.config.ts file using the shared init template.
 */
export function generateConfigTs(
  config: PlaygroundConfig | null,
  componentMap: ComponentMapType
): string {
  return serializeConfigToTs(config, componentMap);
}

/**
 * Generate a README with shadcn installation instructions.
 */
function generateShadcnReadme(config: PlaygroundConfig | null): string {
  const componentNames = config?.fields
    ? [
        ...new Set(
          Object.values(config.fields)
            .filter((v): v is Record<string, unknown> => v != null && typeof v === 'object')
            .map((v) => v.component as string | undefined)
            .filter((c): c is string => c != null)
        )
      ]
    : [];

  const defaultComponents = ['input', 'label', 'form', 'button'];
  const allComponents = [
    ...new Set([...defaultComponents, ...componentNames.map((c) => c.toLowerCase())])
  ];

  return [
    `# z2f Component Setup`,
    ``,
    `This project uses shadcn/ui components. Install them with:`,
    ``,
    '```bash',
    `npx shadcn@latest init`,
    `npx shadcn@latest add ${allComponents.join(' ')}`,
    '```',
    ``,
    `Then import and use the exported config:`,
    ``,
    '```typescript',
    `import config from "./z2f.config";`,
    '```',
    ``
  ].join('\n');
}

export interface ExportInput {
  config: PlaygroundConfig | null;
  componentMap: ComponentMapType;
  customComponents: Record<string, string> | null;
}

/**
 * Build and download an export bundle.
 *
 * Export format is auto-detected based on whether custom components are
 * loaded — no manual user selection required:
 * - If custom components are loaded: zip with config + component sources
 * - Otherwise: zip with config + shadcn README instructions
 */
export function exportBundle(input: ExportInput): void {
  try {
    const configTs = generateConfigTs(input.config, input.componentMap);
    const hasCustom = input.customComponents && Object.keys(input.customComponents).length > 0;

    const files: Record<string, Uint8Array> = {
      'z2f.config.ts': strToU8(configTs)
    };

    if (hasCustom && input.customComponents) {
      for (const [name, source] of Object.entries(input.customComponents)) {
        files[`components/${name}.tsx`] = strToU8(source);
      }
    } else {
      files['README.md'] = strToU8(generateShadcnReadme(input.config));
    }

    const zipped = zipSync(files);
    // TypeScript's Uint8Array<ArrayBufferLike> is not assignable to BlobPart
    // due to SharedArrayBuffer possibility; fflate always returns standard ArrayBuffer
    const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'z2f-export.zip';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[zod-to-form] Export failed:', err);
    alert('Export failed. Check the browser console for details.');
  }
}
