[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / builtinProcessors

# Variable: builtinProcessors

> `const` **builtinProcessors**: `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Defined in: [registry.ts:82](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/core/src/registry.ts#L82)

The default processor registry — maps every Zod v4 `def.type` string to its processor.
The typed `typedProcessors` constant provides compile-time safety; this export widens
to `Record<string, FormProcessor>` for runtime dispatch.
