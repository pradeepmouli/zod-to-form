[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / canonicalizeConfig

# Function: canonicalizeConfig()

> **canonicalizeConfig**(`config`): `string`

Defined in: [canonicalize-config.ts:85](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/core/src/canonicalize-config.ts#L85)

Serialize a [CodegenConfig](../type-aliases/CodegenConfig.md) to a canonical string suitable for
hashing into a cache key.

## Parameters

### config

[`CodegenConfig`](../type-aliases/CodegenConfig.md)

The codegen configuration to serialize.

## Returns

`string`

A deterministic JSON string representation of the config with keys sorted lexicographically.

## Example

```ts
const key = canonicalizeConfig({ schemaImportPath: './schema', exportName: 'UserSchema' });
const hash = crypto.createHash('sha256').update(key).digest('hex');
```
