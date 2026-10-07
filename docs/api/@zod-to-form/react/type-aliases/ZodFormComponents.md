[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / ZodFormComponents

# Type Alias: ZodFormComponents

> **ZodFormComponents** = `Partial`\<`Record`\<keyof `ComponentMap`, `ComponentType`\<`any`\>\>\>

Defined in: packages/react/src/FieldRenderer.tsx:18

Public component-map type for `<ZodForm components={…}>`.

Preserves the per-key names from `defaultComponentMap` (consumers still get
autocomplete on `Input`, `Checkbox`, etc.) but widens each value to
`React.ComponentType<any>`, so plain function components, React.memo-wrapped
components, and forwardRef components are all assignable.
