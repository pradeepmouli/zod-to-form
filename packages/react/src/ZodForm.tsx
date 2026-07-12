import type { ComponentType, ReactNode } from 'react';
import { useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import type { output, ZodObject } from 'zod';
import type { FormProcessor, ZodFormRegistry } from '@zod-to-form/core';
import { normalizeFieldKey, collectFieldSections } from '@zod-to-form/core';
import { FieldRenderer, warnRemovedConfigKeys } from './FieldRenderer.js';
import { defaultComponentMap } from './components/index.js';
import type { RuntimeComponentConfig, ZodFormComponents } from './FieldRenderer.js';
import { useZodForm } from './useZodForm.js';
import type { input } from 'zod';

export type { ZodFormComponents };

type ZodFormProps<TSchema extends ZodObject> = {
  schema: TSchema;
  onSubmit?: (data: output<TSchema>) => unknown;
  onInvalid?: (errors: Record<string, unknown>) => void;
  /**
   * Fires on every field change (and programmatic `form.reset()`). The first
   * arg is `output<TSchema>` when `meta.isValid` is true, `input<TSchema>`
   * otherwise (raw/partial values mid-edit). See `useZodForm` for details.
   */
  onValueChange?: (data: output<TSchema> | input<TSchema>, meta: { isValid: boolean }) => void;
  mode?: 'onSubmit' | 'onChange' | 'onBlur';
  /** Forwarded to `useZodForm`/`FieldRenderer`. See `UseZodFormOptions.errorDisplay`. */
  errorDisplay?: 'always' | 'afterTouched';
  defaultValues?: Partial<output<TSchema>>;
  components?: ZodFormComponents;
  componentConfig?: RuntimeComponentConfig;
  formRegistry?: ZodFormRegistry;
  processors?: Record<string, FormProcessor>;
  className?: string;
  children?: ReactNode;
};

const _warnedKeys = new Set<string>();

/**
 * Runtime React component that renders a type-safe form from a Zod v4 schema.
 *
 * Walks `schema` to produce `FormField[]`, wires React Hook Form with a
 * `zodResolver`, and renders each field using the matched component from
 * `components` (defaults to `defaultComponentMap`). Sections defined in
 * `componentConfig.fields` are rendered as grouped fieldsets.
 *
 * @param props - Schema, event handlers, and optional component/config overrides.
 * @returns A `<FormProvider>`-wrapped form element.
 *
 * @example
 * ```tsx
 * import { ZodForm } from '@zod-to-form/react';
 * import { z } from 'zod';
 *
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * <ZodForm schema={loginSchema} onSubmit={(data) => console.log(data)} />
 * ```
 *
 * @useWhen
 * - You need form rendering in storybook, playgrounds, or low-traffic admin UIs — where bundle overhead is acceptable and a build step would add friction
 * - You are prototyping before committing to CLI codegen — `<ZodForm>` and the CLI share the same walkSchema output so the migration is mechanical
 *
 * @avoidWhen
 * - Bundle size is critical — use CLI codegen (`@zod-to-form/cli`) instead; runtime schema walking includes the full Zod type graph traversal, which does not tree-shake
 * - You need forms for complex schemas with cyclic references — the walker does not handle cycles and hits the max-depth guard silently with no error
 *
 * @never
 * - NEVER pass `componentConfig` without a matching `components` map that covers
 *   the component names referenced — missing components are silently dropped at
 *   render time with no console error; add each name to `components` or use
 *   `defaultComponentMap` as the base
 * - NEVER expect controlled component prop expressions (e.g. `field.value`) to
 *   work without a `propMap` in `componentConfig` — uncontrolled mode is the
 *   default; add `propMap: { value: 'value', onChange: 'onChange' }` in field
 *   config to opt in to controlled mode
 *
 * @category Components
 */
export function ZodForm<TSchema extends ZodObject>(props: ZodFormProps<TSchema>): ReactNode {
  const {
    schema,
    onSubmit,
    onInvalid,
    onValueChange,
    mode,
    defaultValues,
    components,
    componentConfig,
    formRegistry,
    processors,
    className,
    children,
    errorDisplay
  } = props;
  // US6: Warn if the old sectionComponents key is detected in componentConfig
  if (
    componentConfig &&
    'sectionComponents' in componentConfig &&
    !_warnedKeys.has('sectionComponents')
  ) {
    _warnedKeys.add('sectionComponents');
    console.warn(
      `[zod-to-form] "sectionComponents" in componentConfig has been removed. ` +
        `Section components are now resolved from "componentConfig.componentModule" instead.`
    );
  }

  // One-time validation of removed config keys (propMap, gridColumn, controlled+expressions)
  warnRemovedConfigKeys(componentConfig);

  const mergedComponents = useMemo(() => ({ ...defaultComponentMap, ...components }), [components]);

  const { form, fields } = useZodForm(schema, {
    defaultValues,
    formRegistry,
    fields: componentConfig?.fields,
    processors,
    mode,
    onValueChange,
    errorDisplay
  });

  const submitHandler = onSubmit ?? (() => undefined);

  // Collect section groupings from config
  const sections = useMemo(() => {
    if (!componentConfig?.fields) return new Map<string, string[]>();
    const configFields = componentConfig.fields;
    return collectFieldSections(
      fields,
      (key) => configFields[key] ?? configFields[normalizeFieldKey(key)]
    );
  }, [fields, componentConfig]);

  // Fields assigned to a section are rendered by SectionRenderer instead
  const sectionFieldKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const fieldKeys of sections.values()) {
      for (const key of fieldKeys) keys.add(key);
    }
    return keys;
  }, [sections]);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(submitHandler, onInvalid)} className={className} noValidate>
        {fields
          .filter((field) => !sectionFieldKeys.has(field.key))
          .map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              components={mergedComponents}
              componentConfig={componentConfig}
              errorDisplay={errorDisplay}
            />
          ))}
        {sections.size > 0 && (
          <SectionRenderer sections={sections} componentConfig={componentConfig} />
        )}
        {children}
      </form>
    </FormProvider>
  );
}

/**
 * Renders section components that group multiple form fields.
 * Each section component receives a `fields` prop with the field names it manages,
 * and reads/writes its fields via useFormContext (FormProvider).
 * Section components are resolved by name from `componentConfig.componentModule`.
 */
function SectionRenderer({
  sections,
  componentConfig
}: {
  sections: Map<string, string[]>;
  componentConfig: RuntimeComponentConfig | undefined;
}) {
  const elements: ReactNode[] = [];
  const mod = componentConfig?.componentModule;

  if (!mod && sections.size > 0 && !_warnedKeys.has('__no_module__')) {
    _warnedKeys.add('__no_module__');
    console.warn(
      `[zod-to-form] ${sections.size} section(s) configured but componentModule is not provided. ` +
        `Section fields will not be rendered. Pass componentConfig.componentModule.`
    );
  }

  for (const [sectionName, fieldKeys] of sections) {
    const candidate = mod?.[sectionName];
    // Accept functions and React.memo/forwardRef/lazy (objects with $$typeof)
    if (
      typeof candidate === 'function' ||
      (candidate != null && typeof candidate === 'object' && '$$typeof' in candidate)
    ) {
      const SectionComponent = candidate as ComponentType<{ fields: string[] }>;
      elements.push(<SectionComponent key={sectionName} fields={fieldKeys} />);
    } else if (!_warnedKeys.has(sectionName)) {
      _warnedKeys.add(sectionName);
      const reason =
        candidate === undefined
          ? 'was not found in componentModule'
          : `was found but is not a function (got ${typeof candidate})`;
      console.warn(
        `[zod-to-form] Section "${sectionName}" (grouping fields: ${fieldKeys.join(', ')}) ` +
          `${reason}. Those fields will not be rendered.`
      );
    }
  }
  return <>{elements}</>;
}
