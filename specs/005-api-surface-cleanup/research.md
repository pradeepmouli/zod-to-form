# Research: API Surface Cleanup

**Feature**: 005-api-surface-cleanup | **Date**: 2026-03-23

## Decision Log

### D1: Field Expression Detection Strategy

**Decision**: Exact string match against a fixed set of 5 known expressions.

**Rationale**: The set of RHF controller field properties is small and stable (`field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`). Exact matching eliminates ambiguity — no regex, no prefix matching, no runtime heuristics. A user who passes `'field.value'` as a prop value gets it resolved; a user who passes `'field.valueLabel'` gets it as a literal string.

**Alternatives considered**:
- Prefix matching (`field.*`) — rejected: too broad, would capture unintended strings like `field.description`.
- Wrapper type (e.g., `{ $ref: 'field.onChange' }`) — rejected: adds syntax weight to the most common use case; the whole point is simplification.
- Symbol/tagged union — rejected: JSON-incompatible, breaks codegen serialization.

### D2: Props Merge Order

**Decision**: Shallow merge with field config winning. `{ ...presetOverrideProps, ...fieldConfigProps }`.

**Rationale**: Matches the existing precedence cascade (preset < user overrides < per-field). Shallow merge avoids unpredictable deep-merge behavior with nested objects like `style`. Users who need to combine nested values can do so explicitly in their field config.

**Alternatives considered**:
- Deep merge — rejected: `style: { color: 'red' }` + `style: { padding: 4 }` → `style: { color: 'red', padding: 4 }` seems intuitive but breaks when the intent is to fully replace the style object. Surprising behavior at scale.
- Preset wins — rejected: contradicts the principle that user config overrides defaults.

### D3: Field Template Component Contract

**Decision**: Standard React component receiving named props: `children`, `label`, `description`, `helpText`, `error`, `name`, `deprecated`.

**Rationale**: Named props are explicit, discoverable via TypeScript autocomplete, and don't couple the template to internal form state objects. The template is a regular React component — no special patterns to learn.

**Alternatives considered**:
- Single context object — rejected: less discoverable, requires destructuring, harder to type narrowly.
- Render props pattern — rejected: over-engineered for a layout concern; adds indirection.

### D4: Zero-Dep Eject Strategy

**Decision**: Shadcn preset omits `normalizeFormValues` entirely; html preset inlines it. Both inline `StripIndexSignature`.

**Rationale**: Shadcn's controlled components (via `Controller`) already receive typed values from RHF — no string-to-native normalization needed. The html preset uses uncontrolled `<input>` elements where all values are strings, so normalization is necessary. `StripIndexSignature` is a pure type utility (~12 lines) that's trivial to inline.

**Alternatives considered**:
- Always inline both — rejected: unnecessary code in shadcn output where `normalizeFormValues` is never called.
- Ship as a separate `@zod-to-form/utils` package — rejected: still a dependency; defeats the purpose.

### D5: Removed Key Error Behavior

**Decision**: Console warning at runtime (not a thrown error) when `propMap`, `gridColumn`, or `sectionComponents` appear in config.

**Rationale**: TypeScript type errors catch these at compile time for TS users. The console warning serves JS users and cases where types aren't checked. A thrown error would break existing forms during migration — a warning gives users time to update without downtime.

**Alternatives considered**:
- Thrown error — rejected: too disruptive for migration.
- Silent ignore — rejected: users wouldn't know their config is no longer effective.
- TypeScript `@deprecated` annotation — rejected: these keys are removed, not deprecated. Annotations on non-existent keys don't help.

### D6: Preset Field Template Defaults

**Decision**: Each preset ships a default field template component. Shadcn uses `FormField`/`FormLabel`/`FormControl`/`FormDescription`/`FormMessage`. Html uses `div`/`label`/`p` elements.

**Rationale**: The field template is the most common customization point. Shipping a concrete default per preset means out-of-the-box rendering matches the preset's component library. The CLI emits this as an editable file.

**Alternatives considered**:
- Single universal default — rejected: shadcn and html have fundamentally different component primitives.
- No default (require explicit template) — rejected: breaks the "works out of the box" promise.

### D7: Remove FormPrimitivesConfig

**Decision**: Remove `FormPrimitivesConfig` (`field`, `label`, `control`) entirely. It is subsumed by `fieldTemplate`.

**Rationale**: `FormPrimitivesConfig` was a partial solution — it let users name the wrapper components but not control their arrangement. `fieldTemplate` gives full control over field composition as a standard React component. Keeping both creates confusion about which mechanism to use and potential conflicts.

**Alternatives considered**:
- Keep both and document interaction — rejected: two mechanisms for the same concern is a source of bugs and user confusion.
- Deprecate with warning — rejected: clean removal is better for a breaking change release. Console warning for the removed key provides migration guidance.
