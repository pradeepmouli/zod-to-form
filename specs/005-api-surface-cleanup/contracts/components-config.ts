/**
 * Contract: ComponentsConfig
 *
 * Top-level component resolution configuration.
 * Part of ZodFormsConfig passed to defineConfig().
 */
type ComponentPreset = 'shadcn' | 'html';

type ComponentsConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  /** Import path for the components module */
  source: string;

  /** Preset to apply (provides default overrides + default field template) */
  preset?: ComponentPreset;

  /**
   * Custom field template component path.
   * Controls the composition of label + input + description + helpText + error.
   * Overrides the preset's default template.
   *
   * @example
   * fieldTemplate: './components/MyFieldTemplate'
   */
  fieldTemplate?: string;

  /** Per-component type overrides */
  overrides?: { [K in keyof T & string]?: ComponentOverride };
};
