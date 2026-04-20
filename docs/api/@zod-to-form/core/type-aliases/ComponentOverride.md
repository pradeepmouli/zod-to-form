[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / ComponentOverride

# Type Alias: ComponentOverride

> **ComponentOverride** = `object`

Defined in: [config.ts:8](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L8)

Per-component metadata override. Only components that differ from defaults need an entry.

## Properties

### controlled?

> `optional` **controlled?**: `boolean`

Defined in: [config.ts:10](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L10)

When true, use Controller/useController instead of register() spread

***

### props?

> `optional` **props?**: `Record`\<`string`, `unknown`\>

Defined in: [config.ts:16](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L16)

Default props for this component type.
Values matching a known field expression string are resolved from the RHF controller.
Per-field props override these via shallow merge (field config wins).
