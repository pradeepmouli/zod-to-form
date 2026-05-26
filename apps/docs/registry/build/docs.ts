/**
 * Shared shadcn registry dependencies for all three starter items.
 *
 * Every starter ships the shared `@/components/z2f` adapter module
 * (checkbox/switch/select/radio-group/date-picker + index), whose components
 * wrap the consumer's installed shadcn/ui primitives. The full set of underlying
 * shadcn registry items the adapters import from:
 *
 * - `input`, `textarea`, `checkbox`, `switch`, `select`, `radio-group` — the
 *   field primitives wrapped by the matching adapter components.
 * - `label`, `button`, `popover`, `calendar` — used by the date-picker adapter
 *   (and label by field wrappers).
 * - `field` — the shadcn Field* primitives (Field/FieldLabel/FieldDescription/
 *   FieldError) that the codegen/vite generated forms import from `@/components/ui/field`.
 *
 * NOTE: `date-picker` is intentionally OMITTED — it is an embedded owned file,
 * not a standalone shadcn registry item. Listing it would cause `shadcn add` to
 * fatally attempt to fetch a non-existent `date-picker.json`. The date-picker
 * wrapper is composed from `popover`, `calendar`, and `button` (all listed above).
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
  'field'
];

/**
 * Codegen and vite items use the same shared dependency set as the react item:
 * all three ship the shadcn adapter module, and the codegen/vite generated forms
 * additionally import the `field` primitives (already included above).
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
