[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / registerSchemaConfigs

# Function: registerSchemaConfigs()

> **registerSchemaConfigs**(`registry`, `moduleExports`, `schemaConfigs`): `void`

Defined in: register.ts:266

Register `defineConfig({ schemas: ... })` entries by exported schema identity.

Any configured export that resolves to a Zod schema in `moduleExports` is
attached to the registry via `registerDeep()`, so a reused exported subschema
carries its default component + nested field config everywhere it appears.

## Parameters

### registry

`$ZodRegistry`\<[`FormMeta`](../type-aliases/FormMeta.md)\>

### moduleExports

`Record`\<`string`, `unknown`\>

### schemaConfigs

\{\[`key`: `string`\]: [`ZodTypeConfig`](../type-aliases/ZodTypeConfig.md)\<`string`, `Record`\<`string`, `unknown`\>\> \| `undefined`; \} \| `undefined`

## Returns

`void`
