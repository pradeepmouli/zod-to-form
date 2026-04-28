# Functions

## register

### `registerSchemaConfigs`
Register `defineConfig({ schemas: ... })` entries by exported schema identity.

Any configured export that resolves to a Zod schema in `moduleExports` is
attached to the registry via `registerDeep()`, so a reused exported subschema
carries its default component + nested field config everywhere it appears.
```ts
registerSchemaConfigs(registry: $ZodRegistry<FormMeta>, moduleExports: Record<string, unknown>, schemaConfigs: { [key: string]: ZodTypeConfig<string, Record<string, unknown>> | undefined } | undefined): void
```
**Parameters:**
- `registry: $ZodRegistry<FormMeta>`
- `moduleExports: Record<string, unknown>`
- `schemaConfigs: { [key: string]: ZodTypeConfig<string, Record<string, unknown>> | undefined } | undefined`
