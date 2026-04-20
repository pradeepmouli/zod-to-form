# Processors

| Class | Description |
|-------|-------------|
| [processArray](processarray.md) | Process `z.array()` — renders as an `ArrayField` component with an item template.
Extracts `minLength`/`maxLength` from the constraint bag and recurses on the element type. |
| [processTuple](processtuple.md) | Process `z.tuple()` — renders as a `Fieldset` where each tuple item becomes a child field.
Tuple items are keyed by their index (e.g. `"tupleField.0"`, `"tupleField.1"`). |
| [processBoolean](processboolean.md) | Process `z.boolean()` — renders as a `Checkbox` component (or a component override from the registry).
Marks the field as required since boolean fields always have a value (true/false). |
| [processMap](processmap.md) | Process `z.map()` — renders as an array-like repeater of key-value pair fieldsets.
Each entry has a `key` field and a `value` field derived from the Map's type params. |
| [processSet](processset.md) | Process `z.set()` — renders as an array-like repeater of unique items.
The value type determines the item template stored in `field.arrayItem`. |
| [processCrossRef](processcrossref.md) | Process a cross-reference field — a schema annotated in the form registry with `refType`.
Renders as a `cross-ref` component placeholder that the consuming application resolves
to a form-linked picker or relationship field at runtime. |
| [processDate](processdate.md) | Process `z.date()` / `z.iso.date()` — renders as a `DatePicker` component.
No constraints are extracted from the date schema — date validation is handled by the resolver. |
| [processEnum](processenum.md) | Process `z.enum()` — renders as a `Select` component with options derived from enum entries.
Duplicate values are deduplicated, and labels are generated via `inferLabel`. |
| [processLiteral](processliteral.md) | Process `z.literal()` — renders as a read-only `Select` with a single fixed option.
The field is marked `readOnly` because literal fields have exactly one valid value. |
| [processFallback](processfallback.md) | Fallback processor for Zod types without a dedicated handler.
Renders as a plain text `Input`, preserving the schema's `def.type` on the field.
Used for `custom`, `any`, `unknown`, `nan`, `void`, `null`, `undefined`, `symbol`,
`transform`, `promise`, `function`, and other exotic types. |
| [processFile](processfile.md) | Process `z.file()` — renders as a `FileInput` component.
No constraints are extracted. The field renderer sets `valueAsFile: true` on registration
so RHF stores a `File` object rather than the raw input value. |
| [processNumber](processnumber.md) | Process `z.number()` / `z.bigint()` — renders as a numeric `Input` with `type="number"`.
Extracts `min`/`max` from the constraint bag and detects integer constraints from `def.checks`.
Sets `step=1` when an integer constraint is detected. |
| [processObject](processobject.md) | Process `z.object()` — renders as a `Fieldset` with each shape key as a child field.
Recursively processes all shape entries via `ctx.processChild`. |
| [processIntersection](processintersection.md) | Process `z.intersection()` — renders as a `Fieldset` that merges the left and right shape entries.
Both the left and right schemas must be `z.object()` types for their shapes to be merged.
Non-object intersection members are silently skipped. |
| [processRecord](processrecord.md) | Process `z.record()` — renders as a plain `Input` with an item template derived from the value type.
The item template is stored in `field.arrayItem` for codegen to use in dynamic key-value entry forms. |
| [processString](processstring.md) | Process `z.string()` — renders as an `Input` (or `DatePicker` for date/time formats).
Extracts format, minLength, maxLength, and pattern constraints from the constraint bag.
Converts regex patterns to input masks via `regexToMask` when possible. |
| [processTemplateLiteral](processtemplateliteral.md) | Process `z.templateLiteral()` — renders as a plain text `Input`.
Template literals have a fixed structure; no constraints are extracted. |
| [processUnion](processunion.md) | Process `z.union()` — renders as a `Select` when all options are literals,
or delegates to `processDiscriminatedUnion` when a discriminator property is detected.
Falls back to a plain `Input` for mixed unions. |
| [processDiscriminatedUnion](processdiscriminatedunion.md) | Process `z.discriminatedUnion()` — renders as a `Select` for the discriminator field,
with variant child fields stored in `field.props._variants` for runtime conditional rendering.
The runtime `DiscriminatedUnionBlock` and codegen both read `_discriminator` and `_variants`. |
| [processDefault](processdefault.md) | Process `z.default()` / `z.prefault()` — extracts the default value and delegates to the inner type.
Sets `field.defaultValue` from the schema's default (evaluating functions eagerly). |
| [processLazy](processlazy.md) | Process `z.lazy()` — evaluates the lazy getter and delegates to the inner schema's processor.
Guards against infinite recursion using `ctx.currentDepth` / `ctx.maxDepth` and the `seen` WeakSet.
Renders as a plain text `Input` when the depth limit is reached or the schema is cyclic. |
| [processNullable](processnullable.md) | Process `z.nullable()` — unwraps to the inner type and marks the field as not required.
Nullable fields accept null in addition to the inner type; the field renders normally. |
| [processOptional](processoptional.md) | Process `z.optional()` — unwraps to the inner type and marks the field as not required.
Delegates to the inner type's processor for all component and constraint extraction. |
| [processPipe](processpipe.md) | Process `z.pipe()` — unwraps to the input type and delegates to its processor.
The output/transform side is handled by the L1 optimizer for submit-time validation. |
| [processReadonly](processreadonly.md) | Process `z.readonly()` — marks the field as read-only and delegates to the inner type.
The rendered component receives `readOnly: true` via the base field props. |