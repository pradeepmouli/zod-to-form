[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / useExternalSync

# Function: useExternalSync()

> **useExternalSync**\<`TSource`, `TValues`\>(`form`, `source`, `toValues`, `options?`): `void`

Defined in: packages/react/src/useExternalSync.ts:41

Reset a form's values when an externally-supplied source object's reference
changes; preserve in-progress edits while the reference is stable.

Adopters with mismatched source-vs-form shapes pass a `toValues` projection.

## Type Parameters

### TSource

`TSource`

### TValues

`TValues` *extends* `FieldValues`

## Parameters

### form

`UseFormReturn`\<`TValues`\>

### source

`TSource`

### toValues

(`source`) => `TValues`

### options?

[`UseExternalSyncOptions`](../interfaces/UseExternalSyncOptions.md)

## Returns

`void`

## Example

```tsx
const { form } = useZodForm(schema, { defaultValues: toValues(node) });
useExternalSync(form, node, toValues);
```
