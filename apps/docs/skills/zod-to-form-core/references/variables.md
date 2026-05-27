# Variables & Constants

## Optimization

### `builtinOptimizers`
The default optimizer registry — L1 (decompose) + L2 (native rules) chains merged per type.
Keyed by `def.type`; each entry is an ordered chain of optimizers applied left-to-right.
NEVER mutate this directly — use `createOptimizers(custom)` to extend.
```ts
const builtinOptimizers: Record<string, FormOptimizer[]>
```

## config

### `SHADCN_OVERRIDES`
shadcn preset — Radix-based components need controlled mode + field expression props
```ts
const SHADCN_OVERRIDES: Record<string, ComponentOverride>
```

### `DEFAULT_OVERRIDES`
Default HTML preset — no controlled components by default
```ts
const DEFAULT_OVERRIDES: Record<string, ComponentOverride>
```

## Configuration

### `RHF_FIELD_EXPRESSIONS`
Known RHF field expression strings recognized in component props config.
When a prop value matches one of these strings, codegen emits it as a JSX
expression (`{field.value}`) rather than a literal string.
```ts
const RHF_FIELD_EXPRESSIONS: ReadonlySet<string>
```

## Helpers

### `NATIVE_INPUT_ATTRS`
The set of DOM-valid native input attributes extracted from `field.props`.
This is the single source of truth so runtime and codegen agree on which props
flow through to the native element. Extend deliberately, not blindly.
```ts
const NATIVE_INPUT_ATTRS: readonly ["type", "minLength", "maxLength", "pattern", "min", "max", "step"]
```

## Registry

### `builtinProcessors`
The default processor registry — maps every Zod v4 `def.type` string to its processor.
The typed `typedProcessors` constant provides compile-time safety; this export widens
to `Record<string, FormProcessor>` for runtime dispatch.
```ts
const builtinProcessors: Record<string, FormProcessor>
```
