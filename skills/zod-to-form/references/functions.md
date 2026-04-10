# Functions

## generate

### `generateFormComponent`
```ts
generateFormComponent(fields: FormField[], config: CodegenConfig): string
```
**Parameters:**
- `fields: FormField[]`
- `config: CodegenConfig`
**Returns:** `string`

### `resolveFieldMapping`
```ts
resolveFieldMapping<TComponents>(fieldKey: string, componentName: string | undefined, componentConfig: ZodFormsConfig<TComponents> | undefined): { componentOverride?: ComponentOverride; override?: FieldConfig; componentName?: string; source: "fields" | "components" | "none" }
```
**Parameters:**
- `fieldKey: string`
- `componentName: string | undefined`
- `componentConfig: ZodFormsConfig<TComponents> | undefined`
**Returns:** `{ componentOverride?: ComponentOverride; override?: FieldConfig; componentName?: string; source: "fields" | "components" | "none" }`

## templates

### `getFileHeader`
```ts
getFileHeader(schemaImportPath: string, exportName: string, hasArrays: boolean, mode: "submit" | "auto-save", componentImportLine?: string, options?: { hasControlled?: boolean; formProvider?: boolean; preset?: "shadcn" | "html" }, optimized?: { includeZodResolver: boolean; includeZod: boolean }): string
```
**Parameters:**
- `schemaImportPath: string`
- `exportName: string`
- `hasArrays: boolean` — default: `false`
- `mode: "submit" | "auto-save"` — default: `'submit'`
- `componentImportLine: string` (optional)
- `options: { hasControlled?: boolean; formProvider?: boolean; preset?: "shadcn" | "html" }` (optional)
- `optimized: { includeZodResolver: boolean; includeZod: boolean }` (optional)
**Returns:** `string`

### `renderField`
```ts
renderField(field: FormField, regExpr?: string): string
```
**Parameters:**
- `field: FormField`
- `regExpr: string` (optional)
**Returns:** `string`

### `registerPathExpr`
```ts
registerPathExpr(path: string): string
```
**Parameters:**
- `path: string`
**Returns:** `string`

## schema-lite-codegen

### `generateSchemaLiteFile`
Generate the content of a .lite.ts file that constructs a lite schema
from the imported schema's check objects at runtime.

Returns null if no schemaLite is needed (no top-level effects).
```ts
generateSchemaLiteFile(schemaImportPath: string, exportName: string, info: SchemaLiteInfo): string | null
```
**Parameters:**
- `schemaImportPath: string`
- `exportName: string`
- `info: SchemaLiteInfo`
**Returns:** `string | null`

## config-template

### `buildConfigSource`
```ts
buildConfigSource(opts: ConfigTemplateOptions): string
```
**Parameters:**
- `opts: ConfigTemplateOptions`
**Returns:** `string`

## field-templates

### `getFieldTemplateSource`
```ts
getFieldTemplateSource(preset: "shadcn" | "html"): string
```
**Parameters:**
- `preset: "shadcn" | "html"`
**Returns:** `string`
