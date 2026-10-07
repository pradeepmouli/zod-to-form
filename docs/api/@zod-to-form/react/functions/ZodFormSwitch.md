[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / ZodFormSwitch

# Function: ZodFormSwitch()

> **ZodFormSwitch**\<`TSource`, `TKey`, `TSchemas`\>(`props`): `ReactNode`

Defined in: packages/react/src/ZodFormSwitch.tsx:76

Render the form matching `source[discriminator]`, unmounting on changes via
a React `key`. Falls back to `fallback` (or `null` plus a one-time warning)
for unmapped discriminator values.

## Type Parameters

### TSource

`TSource` *extends* `Record`\<`string`, `unknown`\>

### TKey

`TKey` *extends* `string`

### TSchemas

`TSchemas` *extends* `Record`\<`string`, `ZodObject`\<`$ZodLooseShape`, `$strip`\>\>

## Parameters

### props

[`ZodFormSwitchProps`](../interfaces/ZodFormSwitchProps.md)\<`TSource`, `TKey`, `TSchemas`\>

## Returns

`ReactNode`

## Example

```tsx
<ZodFormSwitch
  source={node}
  discriminator="$type"
  schemas={{ Data: dataSchema, Choice: choiceSchema }}
  fallback={<UnsupportedTypeNotice />}
/>
```
