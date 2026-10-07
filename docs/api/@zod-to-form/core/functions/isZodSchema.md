[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / isZodSchema

# Function: isZodSchema()

> **isZodSchema**(`value`): `value is $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>`

Defined in: is-zod-schema.ts:11

Structural Zod v4 check shared across loader/registration/codegen entrypoints.

The project intentionally duck-types on a non-null `_zod` object so callers
do not depend on a specific runtime `zod` instance or `instanceof` behavior.

## Parameters

### value

`unknown`

## Returns

`value is $ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>`
