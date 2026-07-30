# Functions

## Codegen

### `generateFormComponent`
Generate a React form component as a TypeScript string from `FormField[]`.

Produces a `.tsx` file string containing imports, the form component, and
(when `config.mode === 'auto-save'`) the `FormProvider` wrapper. The output
is deterministic for a given `(fields, config)` pair — same inputs always
produce the same output string.
```ts
generateFormComponent(fields: FormField[], config: CodegenConfig): string
```
**Parameters:**
- `fields: FormField[]` — Intermediate `FormField[]` from `walkSchema`.
- `config: CodegenConfig` — Resolved codegen config (output path, component names, UI preset, etc.).
**Returns:** `string` — The generated `.tsx` source as a string. Not yet written to disk.
**Throws:** Never — this function is purely a string transformer; I/O errors from writing
  the result to disk are the caller's responsibility.
```ts
const fields = walkSchema(schema, { formRegistry });
const code = generateFormComponent(fields, {
  schemaPath: './signup.schema.ts',
  exportName: 'signupSchema',
  outputPath: './SignupForm.tsx',
  componentName: 'SignupForm',
  mode: 'submit',
  ui: 'shadcn',
});
await writeFile('./SignupForm.tsx', code, 'utf8');
```

### `resolveFieldMapping`
Resolve the component name and override config for a single `FormField` key.

Walks the `componentConfig.fields` map (by exact key, then normalized key) to
find a per-field override, then falls back to the `componentConfig.components.overrides`
map keyed by component name. Returns `{ source: 'none' }` when no config is present.

Resolution order: (1) `componentConfig.fields[fieldKey]` exact match,
(2) `componentConfig.fields[normalizedKey]` for array-indexed paths (e.g. `items[].name`),
(3) `componentConfig.components.overrides[componentName]` for component-level metadata.
A field-level override wins over a component-level override on conflict.
```ts
resolveFieldMapping<TComponents>(fieldKey: string, componentName: string | undefined, componentConfig: ZodFormsConfig<TComponents> | undefined): { componentOverride?: ComponentOverride; override?: FieldConfig; componentName?: string; source: "fields" | "components" | "none" }
```
**Parameters:**
- `fieldKey: string` — Dot-path key from `FormField.key` (e.g. `'address.street'`).
- `componentName: string | undefined` — Inferred component name from the schema walker.
- `componentConfig: ZodFormsConfig<TComponents> | undefined` — Optional `ZodFormsConfig` with `fields` and `components` overrides.
**Returns:** `{ componentOverride?: ComponentOverride; override?: FieldConfig; componentName?: string; source: "fields" | "components" | "none" }` — Resolved component name, override config, and the resolution source.
```ts
const mapping = resolveFieldMapping('address.street', 'Input', componentConfig);
if (mapping.source !== 'none') {
  console.log('Override component:', mapping.componentName);
}
```

## Templates

### `getFileHeader`
Generate the import block for a form component file.
Emits react-hook-form, zodResolver, zod, and component import lines
based on the generation options. Also inlines the `StripIndexSignature` utility type
and the `normalizeFormValues` helper for html-preset forms.

The `optimized` parameter controls whether the zodResolver and zod imports are included.
When optimization eliminates the need for zodResolver (all fields use native or per-field validation),
both can be omitted to reduce bundle size. The `hasControlled` flag adds `Controller` to RHF imports.
```ts
getFileHeader(schemaImportPath: string, exportName: string, hasArrays: boolean, mode: "submit" | "auto-save", componentImportLine?: string, options?: { hasControlled?: boolean; formProvider?: boolean; preset?: "shadcn" | "html" }, optimized?: { includeZodResolver: boolean; includeZod: boolean }, typesModule?: string): string
```
**Parameters:**
- `schemaImportPath: string` — Module specifier for the schema file (e.g. `'./schema'`).
- `exportName: string` — The named schema export to import (e.g. `'UserSchema'`).
- `hasArrays: boolean` — default: `false` — Whether to include `useFieldArray` in the RHF import.
- `mode: "submit" | "auto-save"` — default: `'submit'` — Form submission mode: `'submit'` (default) or `'auto-save'`.
- `componentImportLine: string` (optional) — Optional custom import line for the component module.
- `options: { hasControlled?: boolean; formProvider?: boolean; preset?: "shadcn" | "html" }` (optional) — Additional flags: `hasControlled`, `formProvider`, `preset`.
- `optimized: { includeZodResolver: boolean; includeZod: boolean }` (optional) — Whether to conditionally include `zodResolver` and `zod` imports.
- `typesModule: string` (optional)
**Returns:** `string` — The complete import block as a multi-line string.
```ts
const header = getFileHeader('./schema', 'UserSchema', false, 'submit', undefined, { preset: 'shadcn' });
// → "import { useForm } from 'react-hook-form';\nimport { zodResolver } ..."
```

### `renderField`
Render a single `FormField` to its plain-HTML JSX string.
Dispatches on `field.component` to produce the correct input element.
Used by the html-preset code generator for uncontrolled forms.
```ts
renderField(field: FormField, regExpr?: string): string
```
**Parameters:**
- `field: FormField` — The FormField to render.
- `regExpr: string` (optional) — Optional pre-built `register(...)` expression string. If omitted, generated from `field.key`.
**Returns:** `string` — A JSX string for the field's input element (e.g. `&lt;input type="text" {...register('name')} /&gt;`).
```ts
renderField({ component: 'Input', key: 'name', props: { type: 'text' }, ... }) → "<input ... />"
```

### `registerPathExpr`
Produce the correct `register(...)` call expression for a field path.
Uses template-literal syntax when the path contains `${` (e.g. array item paths),
and single-quoted string syntax otherwise.
```ts
registerPathExpr(path: string): string
```
**Parameters:**
- `path: string` — The field path string (e.g. `"name"`, `"items.${index}.value"`).
**Returns:** `string` — A `register('...')` or `register(\`...\`)` expression string for inclusion in JSX.
```ts
registerPathExpr('name') → "register('name')"
```
```ts
registerPathExpr('items.${index}.name') → "register(`items.${index}.name`)"
```

### `generateSchemaLiteFile`
Generate the content of a `.lite.ts` file that reconstructs a lite Zod schema
from the imported schema's check objects at runtime.
Returns `null` when no schemaLite is needed (no top-level effects were detected).

Three reconstruction strategies based on `info.type`:
- `'original'` — re-exports the original schema unchanged (non-decomposable pipes)
- `'checks'` — slices `_zod.def.checks` at runtime to extract superRefine/refine checks
- `'transform'` — extracts both inner checks and the transform function from a pipe wrapper
Fallthrough fields are included in the base object via shape references into the original schema.
```ts
generateSchemaLiteFile(schemaImportPath: string, exportName: string, info: SchemaLiteInfo): string | null
```
**Parameters:**
- `schemaImportPath: string` — Module specifier for the original schema file (e.g. `'./schema'`).
- `exportName: string` — The named schema export (e.g. `'UserSchema'`).
- `info: SchemaLiteInfo` — Metadata from `WalkResult.schemaLiteInfo` describing what to reconstruct.
**Returns:** `string | null` — The complete `.lite.ts` file source, or `null` if no lite schema is needed.
```ts
const liteSource = generateSchemaLiteFile('./schema', 'UserSchema', schemaLiteInfo);
if (liteSource) {
  await writeFile('./UserForm.lite.ts', liteSource, 'utf8');
}
```

### `getFieldTemplateSource`
Return the source code for the preset's `FieldTemplate` React component.
Used by the CLI `generate` and `init` commands to emit a standalone `FieldTemplate.tsx`
alongside generated forms.
```ts
getFieldTemplateSource(preset: "shadcn" | "html"): string
```
**Parameters:**
- `preset: "shadcn" | "html"` — The preset name: `'shadcn'` for Radix/shadcn-ui, `'html'` for plain HTML.
**Returns:** `string` — The complete `FieldTemplate.tsx` source string for the chosen preset.
```ts
const source = getFieldTemplateSource('shadcn');
await fs.writeFile('src/components/FieldTemplate.tsx', source);
```

## Config Templates

### `buildConfigSource`
Generate a `z2f.config.ts` starter file as a source string.
Produces a `defineConfig(...)` call with components, defaults, include/exclude,
optional fields, and schemas blocks based on the provided options.

The generated file uses TypeScript generics for full type inference:
`defineConfig&lt;typeof Components, typeof ZodSchemas&gt;(...)`.
Preset-specific overrides (e.g. `SHADCN_OVERRIDES`) are spread into the overrides block.
```ts
buildConfigSource(opts: ConfigTemplateOptions): string
```
**Parameters:**
- `opts: ConfigTemplateOptions` — Template options controlling the generated config structure.
**Returns:** `string` — The complete config file source as a string, ready to write to disk.
```ts
const source = buildConfigSource({ componentSource: './components/ui', preset: 'shadcn' });
await fs.writeFile('z2f.config.ts', source);
```
