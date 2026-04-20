[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / StripIndexSignature

# Type Alias: StripIndexSignature\<T\>

> **StripIndexSignature**\<`T`\> = `T` *extends* readonly infer U[] ? `StripIndexSignature`\<`U`\>[] : `T` *extends* `object` ? `{ [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: StripIndexSignature<T[K]> }` : `T`

Defined in: [config.ts:149](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/config.ts#L149)

Strips index signatures from a type, keeping only explicitly declared keys.
Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.

## Type Parameters

### T

`T`
