# Functions

## Processors

### `processString`
Process `z.string()` — renders as an `Input` with appropriate `type` for all formats.
String date/time formats (`date`, `time`, `datetime`) map to native HTML inputs
(`type="date"`, `type="time"`, `type="datetime-local"`), keeping register-compatible
string values. Only `z.date()` (Date-object schema) routes to `DatePicker`.
Extracts format, minLength, maxLength, and pattern constraints from the constraint bag.
Converts regex patterns to input masks via `regexToMask` when possible.

Format-to-input-type mapping: `email` → `type="email"`, `url` → `type="url"`,
`date` → `type="date"`, `time` → `type="time"`, `datetime` → `type="datetime-local"`.
All string formats stay on `Input`; `DatePicker` is reserved for `z.date()` only.
Pattern is extracted from `bag.patterns` (a `Set&lt;RegExp&gt;`); only the first pattern is used.
```ts
processString(schema: $ZodString, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodString` — The `$ZodString` schema to process.
- `ctx: FormProcessorContext` — The walker context providing the form registry for component overrides.
- `field: FormField` — The base FormField to mutate in-place.
- `_params: ProcessParams` — Unused; included for processor signature conformance.
