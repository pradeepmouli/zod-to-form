[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / FormOptimizer

# Type Alias: FormOptimizer\<T\>

> **FormOptimizer**\<`T`\> = (`schema`, `ctx`, `field`, `params`) => `void`

Defined in: [optimizers/types.ts:70](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/core/src/optimizers/types.ts#L70)

An optimizer function that mutates a `FormField` after the processor has run.
Receives the same schema, context, field, and params as a processor.
Used to attach validation metadata (`field.validation`, `field.zodSchema`) and
to register lite-schema fragments for submit-time validation.

## Type Parameters

### T

`T` *extends* `$ZodType` = `$ZodType`

## Parameters

### schema

`T`

### ctx

[`FormOptimizerContext`](../interfaces/FormOptimizerContext.md)

### field

[`FormField`](../interfaces/FormField.md)

### params

[`ProcessParams`](../interfaces/ProcessParams.md)

## Returns

`void`
