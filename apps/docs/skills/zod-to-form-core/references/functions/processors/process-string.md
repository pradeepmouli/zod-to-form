# Functions

## Processors

### `processString`
Process `z.string()` — renders as an `Input` (or `DatePicker` for date/time formats).
Extracts format, minLength, maxLength, and pattern constraints from the constraint bag.
Converts regex patterns to input masks via `regexToMask` when possible.

Format-to-input-type mapping: `email` → `type="email"`, `url` → `type="url"`,
`date`/`time`/`datetime` → `DatePicker` component. Other formats fall through to `type="text"`.
Pattern is extracted from `bag.patterns` (a `Set<RegExp>`); only the first pattern is used.
```ts
processString(schema: $ZodString, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodString` — The `$ZodString` schema to process.
- `ctx: FormProcessorContext` — The walker context providing the form registry for component overrides.
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.
