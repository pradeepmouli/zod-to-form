[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / SchemaLiteCollector

# Interface: SchemaLiteCollector

Defined in: optimizers/types.ts:87

Mutable accumulator that builds a lite Zod schema for submit-time validation.
Collects checks (from `superRefine`/`refine`), transforms (from `pipe`/`transform`),
and fallthrough field schemas (for fields that cannot be inlined).
Call `build()` at the end of a walker traversal to get the final lite schema.

## Properties

### checks

> `readonly` **checks**: readonly `unknown`[]

Defined in: optimizers/types.ts:101

Read-only access to collected checks

***

### fields

> `readonly` **fields**: `ReadonlyMap`\<`string`, `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: optimizers/types.ts:103

Read-only access to collected fallthrough fields

## Methods

### addCheck()

> **addCheck**(`check`): `void`

Defined in: optimizers/types.ts:89

Add a raw Zod check object (superRefine/refine)

#### Parameters

##### check

`unknown`

#### Returns

`void`

***

### addField()

> **addField**(`path`, `schema`): `void`

Defined in: optimizers/types.ts:93

Add a field that couldn't be inlined (safety net fallback)

#### Parameters

##### path

`string`

##### schema

`$ZodType`

#### Returns

`void`

***

### addTransform()

> **addTransform**(`fn`): `void`

Defined in: optimizers/types.ts:91

Add a transform function extracted from a pipe wrapper

#### Parameters

##### fn

(`data`) => `unknown`

#### Returns

`void`

***

### build()

> **build**(): `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null`

Defined in: optimizers/types.ts:99

Build the lite schema: z.object({}).loose() + checks + transforms

#### Returns

`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null`

***

### isEmpty()

> **isEmpty**(): `boolean`

Defined in: optimizers/types.ts:97

True when nothing has been collected

#### Returns

`boolean`

***

### setOriginalSchema()

> **setOriginalSchema**(`schema`): `void`

Defined in: optimizers/types.ts:95

Store the original schema when it can't be decomposed (non-transform pipes)

#### Parameters

##### schema

`$ZodType`

#### Returns

`void`
