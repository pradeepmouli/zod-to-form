// SPDX-License-Identifier: MIT
// ZodFormSwitch — pick the right ZodForm for a discriminated source.
//
// React's `key` prop on the rendered <ZodForm> ensures the previous form
// unmounts on discriminator changes, so no per-field state leaks between
// schemas.

import type { ReactNode } from 'react';
import type { ZodObject, input, output } from 'zod';
import { ZodForm } from './ZodForm.js';
import type { defaultComponentMap } from './components/index.js';
import type { RuntimeComponentConfig } from './FieldRenderer.js';

const _warnedKeys = new Set<string>();

/**
 * Props for {@link ZodFormSwitch}.
 *
 * @category Components
 */
export interface ZodFormSwitchProps<
  TSource extends Record<string, unknown>,
  TKey extends keyof TSource & string,
  TSchemas extends Record<string, ZodObject>
> {
  /** Source object whose `[discriminator]` value selects the schema. */
  source: TSource;
  /** Property name on `source` to use as the discriminator. */
  discriminator: TKey;
  /** Map from discriminator values to Zod schemas. */
  schemas: TSchemas;
  /**
   * Component(s) to render when the discriminator value matches no
   * schema. ReactNode for static fallback; function for dynamic.
   */
  fallback?: ReactNode | ((source: TSource) => ReactNode);
  /** Forwarded to the rendered <ZodForm>. */
  components?: Partial<typeof defaultComponentMap>;
  /** Forwarded to the rendered <ZodForm>. */
  componentConfig?: RuntimeComponentConfig;
  /** Forwarded to the rendered <ZodForm>. */
  onValueChange?: (data: unknown, meta: { isValid: boolean }) => void;
  /** Forwarded to the rendered <ZodForm>. */
  className?: string;
}

function isFunctionFallback<TSource>(
  fallback: ReactNode | ((source: TSource) => ReactNode)
): fallback is (source: TSource) => ReactNode {
  return typeof fallback === 'function';
}

/**
 * Render the form matching `source[discriminator]`, unmounting on changes via
 * a React `key`. Falls back to `fallback` (or `null` plus a one-time warning)
 * for unmapped discriminator values.
 *
 * @example
 * ```tsx
 * <ZodFormSwitch
 *   source={node}
 *   discriminator="$type"
 *   schemas={{ Data: dataSchema, Choice: choiceSchema }}
 *   fallback={<UnsupportedTypeNotice />}
 * />
 * ```
 *
 * @category Components
 */
export function ZodFormSwitch<
  TSource extends Record<string, unknown>,
  TKey extends keyof TSource & string,
  TSchemas extends Record<string, ZodObject>
>(props: ZodFormSwitchProps<TSource, TKey, TSchemas>): ReactNode {
  const {
    source,
    discriminator,
    schemas,
    fallback,
    components,
    componentConfig,
    onValueChange,
    className
  } = props;

  const value = source?.[discriminator];
  const key = typeof value === 'string' ? value : undefined;

  if (key !== undefined && Object.prototype.hasOwnProperty.call(schemas, key)) {
    const schema = schemas[key] as ZodObject;
    return (
      <ZodForm
        key={key}
        schema={schema}
        components={components}
        componentConfig={componentConfig}
        onValueChange={
          onValueChange as
            | ((
                d: output<typeof schema> | input<typeof schema>,
                meta: { isValid: boolean }
              ) => void)
            | undefined
        }
        className={className}
      />
    );
  }

  if (fallback !== undefined) {
    return isFunctionFallback(fallback) ? fallback(source) : fallback;
  }

  const warnKey = `unmapped:${String(key)}`;
  if (!_warnedKeys.has(warnKey)) {
    _warnedKeys.add(warnKey);
    // eslint-disable-next-line no-console
    console.warn(
      `[zod-to-form] ZodFormSwitch: discriminator value ${JSON.stringify(value)} ` +
        `did not match any schema and no fallback was provided. Returning null.`
    );
  }
  return null;
}
