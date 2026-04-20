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

## Registry

### `builtinProcessors`
The default processor registry — maps every Zod v4 `def.type` string to its processor.
The typed `typedProcessors` constant provides compile-time safety; this export widens
to `Record<string, FormProcessor>` for runtime dispatch.
```ts
const builtinProcessors: Record<string, FormProcessor>
```
