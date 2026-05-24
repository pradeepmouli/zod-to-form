export const REGISTRY_DEPENDENCIES = ['input', 'label', 'checkbox', 'button'];

/**
 * Registry dependencies for items that ship (or build-time generate) code using
 * the shadcn field template, which wraps fields in shadcn's Form* primitives.
 * The `form` registry item installs them to `@/components/ui/form`.
 *
 * Per-item design:
 *
 * - **React item** (`starter-react`): renders at runtime via `<ZodForm>` from
 *   `@zod-to-form/react`. Ships a `zod-form-components.tsx` runtime map that
 *   imports the consumer's shadcn Input/Checkbox/Label primitives and provides
 *   lightweight Field wrapper components. Does NOT use shadcn's Form* primitives,
 *   so `form` is NOT in its registryDependencies.
 *
 * - **Codegen item** (`starter-codegen`): ships a self-contained `generated-form.tsx`
 *   produced by `@zod-to-form/codegen`. That file imports Form* directly from
 *   `@/components/ui/form`, so the `form` registry item is required. Does NOT
 *   ship `zod-form-components.tsx` and does NOT depend on `@zod-to-form/react`.
 *
 * - **Vite item** (`starter-vite`): the `?z2f` Vite plugin emits self-contained
 *   generated components (same codegen path as `starter-codegen`) — no runtime
 *   `@zod-to-form/react` dependency. The plugin itself is a devDependency only.
 *   Config and generated output import Form* from `@/components/ui/form`, so
 *   `form` is required here too. Does NOT ship `zod-form-components.tsx`.
 */
export const CODEGEN_REGISTRY_DEPENDENCIES = [...REGISTRY_DEPENDENCIES, 'form'];

export const STARTER_DOCS = [
  'This starter ships a sample Zod schema and a z2f config wired to shadcn components.',
  '',
  'Next steps:',
  '1. Re-generate the config for YOUR components and schemas:',
  '   npx @zod-to-form/cli init',
  '2. Design and iterate your schema visually in the playground:',
  '   https://zod.toform.dev/play/'
].join('\n');
