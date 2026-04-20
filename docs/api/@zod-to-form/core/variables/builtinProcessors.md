[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / builtinProcessors

# Variable: builtinProcessors

> `const` **builtinProcessors**: `Record`\<`string`, [`FormProcessor`](../type-aliases/FormProcessor.md)\>

Defined in: [registry.ts:82](https://github.com/pradeepmouli/zod-to-form/blob/d11b2e688e77ff9814f6ffb76867a08ff1c7d2cb/packages/core/src/registry.ts#L82)

The default processor registry — maps every Zod v4 `def.type` string to its processor.
The typed `typedProcessors` constant provides compile-time safety; this export widens
to `Record<string, FormProcessor>` for runtime dispatch.
