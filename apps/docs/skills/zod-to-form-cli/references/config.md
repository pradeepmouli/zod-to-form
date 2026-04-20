# Configuration

## ZodFormsConfig

Root configuration type for `zod-to-form` code generation.

Describes the component library to use, generation defaults, per-schema
overrides, and global field configuration. Pass this to `defineConfig()` in
your `z2f.config.ts` for full type inference, or load and validate it at
runtime with `validateConfig()`.

### Properties

#### components



**Type:** `ComponentsConfig<TComponents>`

**Required:** yes

#### defaults



**Type:** `ConfigDefaults`

#### types



**Type:** `string[]`

#### include



**Type:** `string[]`

#### exclude



**Type:** `string[]`

#### fields



**Type:** `Record<string, TypedFieldConfig<TComponents>>`

#### schemas



**Type:** `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`