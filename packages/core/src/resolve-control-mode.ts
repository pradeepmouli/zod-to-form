import type { ComponentOverride } from './config.js';

/**
 * The control strategy for a field's component:
 * - `'register'` — use RHF's `register()` spread (uncontrolled by default)
 * - `'controller'` — use `Controller` / `useController` (required for Radix/shadcn components)
 *
 * @category Types
 */
export type ControlMode = 'register' | 'controller';

/**
 * Derive the control mode from a field mapping's component override.
 *
 * Single source of truth so `@zod-to-form/react` (runtime) and
 * `@zod-to-form/codegen` (static generation) make the same decision without
 * duplicating the `componentOverride?.controlled === true` check.
 *
 * @category Helpers
 */
export function resolveControlMode(mapping: {
  componentOverride?: ComponentOverride;
}): ControlMode {
  return mapping.componentOverride?.controlled === true ? 'controller' : 'register';
}
