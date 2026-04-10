[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / StripIndexSignature

# Type Alias: StripIndexSignature\<T\>

> **StripIndexSignature**\<`T`\> = `T` *extends* readonly infer U[] ? `StripIndexSignature`\<`U`\>[] : `T` *extends* `object` ? `{ [K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: StripIndexSignature<T[K]> }` : `T`

Defined in: [config.ts:134](https://github.com/pradeepmouli/zod-to-form/blob/07a3b2a90ac2fca44ff29a544e6b0db537316968/packages/core/src/config.ts#L134)

Strips index signatures from a type, keeping only explicitly declared keys.
Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.

## Type Parameters

### T

`T`
