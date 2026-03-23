# Functions

## `generateFormComponent`
```ts
generateFormComponent(fields: FormField[], config: CodegenConfig): string
```
**Parameters:**
- `fields: FormField[]` — 
- `config: CodegenConfig` — 
**Returns:** `string`

## `resolveFieldMapping`
```ts
resolveFieldMapping<TComponents>(fieldKey: string, componentName: string | undefined, componentConfig: ZodFormsConfig<TComponents> | undefined): { componentOverride?: ComponentOverride; override?: FieldConfig; componentName?: string; source: "fields" | "components" | "none" }
```
**Parameters:**
- `fieldKey: string` — 
- `componentName: string | undefined` — 
- `componentConfig: ZodFormsConfig<TComponents> | undefined` — 
**Returns:** `{ componentOverride?: ComponentOverride; override?: FieldConfig; componentName?: string; source: "fields" | "components" | "none" }`

## `getFileHeader`
```ts
getFileHeader(schemaImportPath: string, exportName: string, hasArrays: boolean, mode: "submit" | "auto-save", componentImportLine?: string, options?: { hasControlled?: boolean; formProvider?: boolean }): string
```
**Parameters:**
- `schemaImportPath: string` — 
- `exportName: string` — 
- `hasArrays: boolean` — default: `false` — 
- `mode: "submit" | "auto-save"` — default: `'submit'` — 
- `componentImportLine: string` (optional) — 
- `options: { hasControlled?: boolean; formProvider?: boolean }` (optional) — 
**Returns:** `string`

## `renderField`
```ts
renderField(field: FormField): string
```
**Parameters:**
- `field: FormField` — 
**Returns:** `string`

## `registerPathExpr`
```ts
registerPathExpr(path: string): string
```
**Parameters:**
- `path: string` — 
**Returns:** `string`

## `buildConfigSource`
```ts
buildConfigSource(opts: ConfigTemplateOptions): string
```
**Parameters:**
- `opts: ConfigTemplateOptions` — 
**Returns:** `string`
