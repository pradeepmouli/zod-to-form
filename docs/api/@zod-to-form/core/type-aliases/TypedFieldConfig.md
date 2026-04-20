[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / TypedFieldConfig

# Type Alias: TypedFieldConfig\<TComponents\>

> **TypedFieldConfig**\<`TComponents`\> = `{ [K in keyof TComponents & string]: TypedFieldConfigForComponent<TComponents, K> }`\[keyof `TComponents` & `string`\] \| `UntypedFieldConfig`

Defined in: [config.ts:70](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/config.ts#L70)

Discriminated union over component keys.
When `component` is set to a known component key, `props` is constrained
to that component's prop type. When `component` is omitted, `props` is
an open `Record<string, unknown>`.

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>
