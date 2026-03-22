[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / StripIndexSignature

# Type Alias: StripIndexSignature\<T\>

> **StripIndexSignature**\<`T`\> = `T` *extends* readonly infer U[] ? `StripIndexSignature`\<`U`\>[] : `T` *extends* `object` ? `{ [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: StripIndexSignature<T[K]> }` : `T`

Defined in: [config.ts:131](https://github.com/pradeepmouli/zod-to-form/blob/8e8d0e9d2ebabb92cb6cb6acb3b41a18a447d1cd/packages/core/src/config.ts#L131)

Strips index signatures from a type, keeping only explicitly declared keys.
Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.

## Type Parameters

### T

`T`
