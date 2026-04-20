[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / PluginOptions

# Interface: PluginOptions

Defined in: [packages/vite/src/types.ts:113](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/vite/src/types.ts#L113)

Plugin options passed to `z2fVite(options)`. Every field is optional;
the bare `z2fVite()` invocation produces a working plugin.

## Remarks

Pass this to `z2fVite()` in your `vite.config.ts`. Only known keys are
accepted — unknown keys throw `Z2F_VITE_INVALID_OPTIONS` at startup.

## Use When

- Pointing the plugin to a non-standard config file path (`configPath`)
- Enabling generate mode to rewrite `<ZodForm>` call sites at build time (`generate`)
- Overriding config programmatically without a `z2f.config.ts` (`configOverride`)
- Adjusting diagnostic verbosity (`logLevel`)

## Avoid When

- You want zero-config usage — the bare `z2fVite()` call with no options works out of the box

## Pitfalls

- NEVER set `generate: {}` in production without auditing what files it matches — by default
  it targets all `**/*.{ts,tsx,js,jsx}` and rewrites every `<ZodForm>` call site it can
  statically resolve, which changes compiled output the developer didn't explicitly annotate
- NEVER pass unknown option keys — the plugin validates the options object at startup and
  throws `Z2F_VITE_INVALID_OPTIONS` for any unrecognized key

## Config

## Properties

### configOverride?

> `optional` **configOverride?**: `Partial`\<[`Z2FViteConfig`](../type-aliases/Z2FViteConfig.md)\>

Defined in: [packages/vite/src/types.ts:121](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/vite/src/types.ts#L121)

Shallow override merged on top of the loaded config.

***

### configPath?

> `optional` **configPath?**: `string`

Defined in: [packages/vite/src/types.ts:118](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/vite/src/types.ts#L118)

Path to `z2f.config.{ts,js,mjs}`. Auto-discovered from the Vite root
if undefined.

***

### generate?

> `optional` **generate?**: `object`

Defined in: [packages/vite/src/types.ts:136](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/vite/src/types.ts#L136)

Generate mode: scan JSX source for `<ZodForm>` elements and replace
statically resolvable call sites with generated form components at
build time. The name mirrors the CLI's `zod-to-form generate`
command — it's the same codegen, driven by static analysis of your
JSX instead of explicit CLI invocation.

**OFF by default** (FR-024): generate mode silently changes compiled
output for code the developer didn't explicitly annotate, so it is a
deliberate opt-in. Presence of this object (even empty `{}`) enables
it; omit the field entirely to keep it off. This avoids the invalid
state where `include` is set but the mode is disabled.

#### exclude?

> `optional` **exclude?**: `string`[]

Glob patterns excluded from generate mode.

#### include?

> `optional` **include?**: `string`[]

Glob patterns for files generate mode should consider.

***

### logLevel?

> `optional` **logLevel?**: `"silent"` \| `"warn"` \| `"info"` \| `"debug"`

Defined in: [packages/vite/src/types.ts:147](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/vite/src/types.ts#L147)

Plugin-specific log level. Independent of Vite's log level.

***

### write?

> `optional` **write?**: [`WriteOptions`](WriteOptions.md)

Defined in: [packages/vite/src/types.ts:144](https://github.com/pradeepmouli/zod-to-form/blob/4dbc81702f0a9a2a7fa8f750c3efdc32bb88ac3b/packages/vite/src/types.ts#L144)

Optional opt-in to emit generated files to disk.
