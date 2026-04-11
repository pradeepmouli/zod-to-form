[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / SchemaLiteCollector

# Interface: SchemaLiteCollector

Defined in: [optimizers/types.ts:52](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L52)

## Properties

### checks

> `readonly` **checks**: readonly `unknown`[]

Defined in: [optimizers/types.ts:66](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L66)

Read-only access to collected checks

***

### fields

> `readonly` **fields**: `ReadonlyMap`\<`string`, `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>

Defined in: [optimizers/types.ts:68](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L68)

Read-only access to collected fallthrough fields

## Methods

### addCheck()

> **addCheck**(`check`): `void`

Defined in: [optimizers/types.ts:54](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L54)

Add a raw Zod check object (superRefine/refine)

#### Parameters

##### check

`unknown`

#### Returns

`void`

***

### addField()

> **addField**(`path`, `schema`): `void`

Defined in: [optimizers/types.ts:58](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L58)

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

Defined in: [optimizers/types.ts:56](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L56)

Add a transform function extracted from a pipe wrapper

#### Parameters

##### fn

(`data`) => `unknown`

#### Returns

`void`

***

### build()

> **build**(): `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null`

Defined in: [optimizers/types.ts:64](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L64)

Build the lite schema: z.object({}).loose() + checks + transforms

#### Returns

`$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null`

***

### isEmpty()

> **isEmpty**(): `boolean`

Defined in: [optimizers/types.ts:62](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L62)

True when nothing has been collected

#### Returns

`boolean`

***

### setOriginalSchema()

> **setOriginalSchema**(`schema`): `void`

Defined in: [optimizers/types.ts:60](https://github.com/pradeepmouli/zod-to-form/blob/e02110b7c9c32323977212ebe4f068adafebd536/packages/core/src/optimizers/types.ts#L60)

Store the original schema when it can't be decomposed (non-transform pipes)

#### Parameters

##### schema

`$ZodType`

#### Returns

`void`
