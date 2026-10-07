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

### `configPropertySchemas`
Shared property validators for configuration editors and adapters.
```ts
const configPropertySchemas: { components: ZodObject<{ source: ZodString; preset: ZodOptional<ZodEnum<{ shadcn: "shadcn"; html: "html" }>>; fieldTemplate: ZodOptional<ZodString>; overrides: ZodOptional<ZodRecord<ZodString, ZodObject<{ controlled: ZodOptional<ZodBoolean>; props: ZodOptional<ZodRecord<ZodString, ZodUnknown>> }, $loose>>> }, $loose>; include: ZodOptional<ZodArray<ZodString>>; exclude: ZodOptional<ZodArray<ZodString>>; types: ZodOptional<ZodArray<ZodString>>; fields: ZodOptional<ZodRecord<ZodString, ZodObject<{ component: ZodOptional<ZodString>; order: ZodOptional<ZodNumber>; hidden: ZodOptional<ZodBoolean>; disabled: ZodOptional<ZodBoolean>; props: ZodOptional<ZodRecord<ZodString, ZodUnknown>>; section: ZodOptional<ZodString>; helpText: ZodOptional<ZodString> }, $loose>>>; defaults: ZodOptional<ZodObject<{ mode: ZodOptional<ZodEnum<{ submit: "submit"; auto-save: "auto-save" }>>; ui: ZodOptional<ZodEnum<{ shadcn: "shadcn"; html: "html" }>>; out: ZodOptional<ZodString>; overwrite: ZodOptional<ZodBoolean>; serverAction: ZodOptional<ZodBoolean>; formProvider: ZodOptional<ZodBoolean>; optimization: ZodOptional<ZodObject<{ level: ZodOptional<ZodUnion<readonly [ZodLiteral<(...)>, ZodLiteral<(...)>, ZodLiteral<(...)>]>>; compileZod: ZodOptional<ZodBoolean> }, $loose>> }, $loose>>; schemas: ZodOptional<ZodRecord<ZodString, ZodObject<{ name: ZodOptional<ZodString>; component: ZodOptional<ZodString>; mode: ZodOptional<ZodEnum<{ submit: "submit"; auto-save: "auto-save" }>>; out: ZodOptional<ZodString>; serverAction: ZodOptional<ZodBoolean>; fields: ZodOptional<ZodRecord<ZodString, ZodObject<{ component: ZodOptional<ZodString>; order: ZodOptional<ZodNumber>; hidden: ZodOptional<ZodBoolean>; disabled: ZodOptional<ZodBoolean>; props: ZodOptional<ZodRecord<(...), (...)>>; section: ZodOptional<ZodString>; helpText: ZodOptional<ZodString> }, $loose>>> }, $loose>>> }
```

### `configDraftSchema`
Validated partial draft for configuration editors and persistence.
```ts
const configDraftSchema: ZodPipe<ZodObject<{ variants: ZodOptional<ZodOptional<ZodRecord<ZodString, ZodObject<{ components: ZodOptional<ZodObject<{ source: ...; preset: ...; fieldTemplate: ...; overrides: ... }, $loose>>; include: ZodOptional<ZodArray<ZodString>>; exclude: ZodOptional<ZodArray<ZodString>>; types: ZodOptional<ZodArray<ZodString>>; fields: ZodOptional<ZodRecord<ZodString, ZodObject<(...), (...)>>>; defaults: ZodOptional<ZodObject<{ mode: ...; ui: ...; out: ...; overwrite: ...; serverAction: ...; formProvider: ...; optimization: ... }, $loose>>; schemas: ZodOptional<ZodRecord<ZodString, ZodObject<(...), (...)>>> }, $strict>>>>; include: ZodOptional<ZodOptional<ZodArray<ZodString>>>; exclude: ZodOptional<ZodOptional<ZodArray<ZodString>>>; types: ZodOptional<ZodOptional<ZodArray<ZodString>>>; fields: ZodOptional<ZodOptional<ZodRecord<ZodString, ZodObject<{ component: ZodOptional<ZodString>; order: ZodOptional<ZodNumber>; hidden: ZodOptional<ZodBoolean>; disabled: ZodOptional<ZodBoolean>; props: ZodOptional<ZodRecord<ZodString, ZodUnknown>>; section: ZodOptional<ZodString>; helpText: ZodOptional<ZodString> }, $loose>>>>; defaults: ZodOptional<ZodOptional<ZodObject<{ mode: ZodOptional<ZodEnum<{ submit: "submit"; auto-save: "auto-save" }>>; ui: ZodOptional<ZodEnum<{ shadcn: "shadcn"; html: "html" }>>; out: ZodOptional<ZodString>; overwrite: ZodOptional<ZodBoolean>; serverAction: ZodOptional<ZodBoolean>; formProvider: ZodOptional<ZodBoolean>; optimization: ZodOptional<ZodObject<{ level: ZodOptional<(...)>; compileZod: ZodOptional<(...)> }, $loose>> }, $loose>>>; schemas: ZodOptional<ZodOptional<ZodRecord<ZodString, ZodObject<{ name: ZodOptional<ZodString>; component: ZodOptional<ZodString>; mode: ZodOptional<ZodEnum<{ submit: ...; auto-save: ... }>>; out: ZodOptional<ZodString>; serverAction: ZodOptional<ZodBoolean>; fields: ZodOptional<ZodRecord<ZodString, ZodObject<(...), (...)>>> }, $loose>>>>; components: ZodOptional<ZodObject<{ source: ZodOptional<ZodString>; preset: ZodOptional<ZodOptional<ZodEnum<{ shadcn: "shadcn"; html: "html" }>>>; fieldTemplate: ZodOptional<ZodOptional<ZodString>>; overrides: ZodOptional<ZodOptional<ZodRecord<ZodString, ZodObject<{ controlled: ...; props: ... }, $loose>>>> }, $loose>> }, $strict>, ZodTransform<Omit<Partial<ZodFormsConfig<Record<string, unknown>, Record<string, unknown>>>, "components" | "variants"> & { components?: Partial<ComponentsConfig<Record<string, unknown>>> } & Pick<ZodFormsConfig<Record<string, unknown>, Record<string, unknown>>, "variants">, { variants?: Record<string, { components?: { source?: string; preset?: "shadcn" | "html"; fieldTemplate?: string; overrides?: Record<string, { controlled?: ...; props?: ...; [key: ...]: ... }>; [key: string]: unknown }; include?: string[]; exclude?: string[]; types?: string[]; fields?: Record<string, { component?: string; order?: number; hidden?: boolean; disabled?: boolean; props?: Record<(...), (...)>; section?: string; helpText?: string; [key: string]: unknown }>; defaults?: { mode?: "submit" | "auto-save"; ui?: "shadcn" | "html"; out?: string; overwrite?: boolean; serverAction?: boolean; formProvider?: boolean; optimization?: { level?: (...) | (...) | (...) | (...); compileZod?: (...) | (...) | (...); [key: string]: unknown }; [key: string]: unknown }; schemas?: Record<string, { name?: string; component?: string; mode?: "submit" | "auto-save"; out?: string; serverAction?: boolean; fields?: Record<(...), (...)>; [key: string]: unknown }> }>; include?: string[]; exclude?: string[]; types?: string[]; fields?: Record<string, { component?: string; order?: number; hidden?: boolean; disabled?: boolean; props?: Record<string, unknown>; section?: string; helpText?: string; [key: string]: unknown }>; defaults?: { mode?: "submit" | "auto-save"; ui?: "shadcn" | "html"; out?: string; overwrite?: boolean; serverAction?: boolean; formProvider?: boolean; optimization?: { level?: 1 | 2 | 3; compileZod?: boolean; [key: string]: unknown }; [key: string]: unknown }; schemas?: Record<string, { name?: string; component?: string; mode?: "submit" | "auto-save"; out?: string; serverAction?: boolean; fields?: Record<string, { component?: string; order?: number; hidden?: boolean; disabled?: boolean; props?: Record<(...), (...)>; section?: string; helpText?: string; [key: string]: unknown }>; [key: string]: unknown }>; components?: { source?: string; preset?: "shadcn" | "html"; fieldTemplate?: string; overrides?: Record<string, { controlled?: boolean; props?: Record<string, unknown>; [key: string]: unknown }>; [key: string]: unknown } }>>
```

### `fieldConfigSchema`
```ts
const fieldConfigSchema: ZodObject<{ component: ZodOptional<ZodString>; order: ZodOptional<ZodNumber>; hidden: ZodOptional<ZodBoolean>; disabled: ZodOptional<ZodBoolean>; props: ZodOptional<ZodRecord<ZodString, ZodUnknown>>; section: ZodOptional<ZodString>; helpText: ZodOptional<ZodString> }, $loose>
```

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
to `Record&lt;string, FormProcessor&gt;` for runtime dispatch.
```ts
const builtinProcessors: Record<string, FormProcessor>
```
