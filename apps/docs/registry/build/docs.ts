/**
 * Shared shadcn registry dependencies for all three starter items.
 *
 * Every starter now ships the shared `@/components/zod-form` adapter module
 * (input/textarea/checkbox/switch/select/radio-group/date-picker + index),
 * whose components wrap the consumer's installed shadcn/ui primitives. The full
 * set of underlying shadcn registry items the adapters import from:
 *
 * - `input`, `textarea`, `checkbox`, `switch`, `select`, `radio-group` — the
 *   field primitives wrapped by the matching adapter components.
 * - `label`, `button`, `popover`, `calendar` — used by the date-picker adapter
 *   (and label by field wrappers).
 * - `form` — the shadcn Form* primitives that the codegen/vite generated forms
 *   import from `@/components/ui/form`.
 */
export const REGISTRY_DEPENDENCIES = [
  'input',
  'textarea',
  'checkbox',
  'switch',
  'select',
  'radio-group',
  'label',
  'button',
  'popover',
  'calendar',
  'form'
];

/**
 * Codegen and vite items use the same shared dependency set as the react item:
 * all three ship the shadcn adapter module, and the codegen/vite generated forms
 * additionally import the `form` primitives (already included above).
 */
export const CODEGEN_REGISTRY_DEPENDENCIES = REGISTRY_DEPENDENCIES;

export const STARTER_DOCS = [
  'This starter ships a sample Zod schema and a z2f config wired to shadcn components.',
  '',
  'Next steps:',
  '1. Re-generate the config for YOUR components and schemas:',
  '   npx @zod-to-form/cli init',
  '2. Design and iterate your schema visually in the playground:',
  '   https://zod.toform.dev/play/'
].join('\n');
