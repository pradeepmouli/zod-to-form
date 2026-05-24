export const REGISTRY_DEPENDENCIES = ['input', 'label', 'checkbox', 'button'];

/**
 * Registry dependencies for items that ship (or build-time generate) code using
 * the shadcn field template, which wraps fields in shadcn's Form* primitives.
 * The `form` registry item installs them to `@/components/ui/form`.
 *
 * Only the codegen and vite items need `form` — the react item renders at
 * runtime via `shadcnComponentMap`, whose self-contained Tailwind stubs do not
 * import shadcn's Form* primitives. So `form` is a per-item dependency rather
 * than part of the shared `REGISTRY_DEPENDENCIES`.
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
