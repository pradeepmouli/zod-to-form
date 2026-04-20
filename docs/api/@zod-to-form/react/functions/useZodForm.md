[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / useZodForm

# Function: useZodForm()

> **useZodForm**\<`TSchema`\>(`schema`, `options?`): `object`

Defined in: [packages/react/src/useZodForm.ts:85](https://github.com/pradeepmouli/zod-to-form/blob/460f904fe7438770b4219b2c4241f8f43d5de92c/packages/react/src/useZodForm.ts#L85)

React Hook Form integration hook for Zod v4 schemas.

Walks the schema to produce `FormField[]` and wires `useForm` with a
`zodResolver`. When `options.optimization` is set the `zodResolver` is
replaced by per-field validation (via `schemaLite`) and the resolver
import is tree-shaken in production builds.

## Type Parameters

### TSchema

`TSchema` *extends* `ZodObject`\<`$ZodLooseShape`, `$strip`\>

## Parameters

### schema

`TSchema`

The `z.object({...})` schema to generate the form from.

### options?

`UseZodFormOptions`\<`TSchema`\>

Optional hook configuration.

## Returns

`{ form, fields }` — the RHF `UseFormReturn` and the `FormField[]` array.

### fields

> **fields**: [`FormField`](../interfaces/FormField.md)[] = `walkResult.fields`

### form

> **form**: `UseFormReturn`\<`output`\<`TSchema`\>, `any`, `output`\<`TSchema`\>\>

### schemaError

> **schemaError**: `string` \| `null` = `walkResult.error`

Non-null when walkSchema threw — lets consumers display the error instead of an empty form

### schemaLite

> **schemaLite**: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> \| `null` = `walkResult.schemaLite`

SchemaLite for submit-time validation (non-null when optimization is enabled and top-level effects exist)

## Example

```tsx
const { form, fields } = useZodForm(loginSchema);
return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {fields.map((f) => <input key={f.key} {...form.register(f.key)} />)}
  </form>
);
```

## Use When

- You need direct access to the RHF `form` instance (e.g. to call `form.setValue`)
- You are building a custom renderer on top of `FormField[]`
- You want to colocate form state management with your own layout logic

## Avoid When

- You just need a working form UI — use `<ZodForm>` instead; `useZodForm` returns `fields[]` and `form`, but rendering those fields requires wiring up each field component yourself

## Never

- NEVER pass a new schema object on every render — `walkSchema` is memoized by schema
  identity; an unstable reference causes re-walking on every render cycle; FIX: declare
  the schema outside the component or wrap in `useMemo`
- NEVER forget `normalizeFormValues()` before manually calling `schema.safeParse()` —
  the hook's internal resolver applies normalization, but manual calls do not; FIX:
  always call `schema.safeParse(normalizeFormValues(values))`
- NEVER mix `formRegistry` and `fields` options on the same call — when `formRegistry`
  is provided, `fields` is ignored entirely with no merge and no warning; FIX: pick one
  or merge field config into the registry manually before passing it
