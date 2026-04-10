[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ComponentOverride

# Type Alias: ComponentOverride

> **ComponentOverride** = `object`

Defined in: [config.ts:8](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/config.ts#L8)

Per-component metadata override. Only components that differ from defaults need an entry.

## Properties

### controlled?

> `optional` **controlled?**: `boolean`

Defined in: [config.ts:10](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/config.ts#L10)

When true, use Controller/useController instead of register() spread

***

### props?

> `optional` **props?**: `Record`\<`string`, `unknown`\>

Defined in: [config.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/config.ts#L16)

Default props for this component type.
Values matching a known field expression string are resolved from the RHF controller.
Per-field props override these via shallow merge (field config wins).
