[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / TypedFieldConfig

# Type Alias: TypedFieldConfig\<TComponents\>

> **TypedFieldConfig**\<`TComponents`\> = `{ [K in keyof TComponents & string]: TypedFieldConfigForComponent<TComponents, K> }`\[keyof `TComponents` & `string`\] \| `UntypedFieldConfig`

Defined in: [config.ts:70](https://github.com/pradeepmouli/zod-to-form/blob/7bf19cd9fc0937e42a238b2be647353aea0a2a27/packages/core/src/config.ts#L70)

Discriminated union over component keys.
When `component` is set to a known component key, `props` is constrained
to that component's prop type. When `component` is omitted, `props` is
an open `Record<string, unknown>`.

## Type Parameters

### TComponents

`TComponents` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>
