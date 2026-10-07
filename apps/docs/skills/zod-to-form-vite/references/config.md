# Configuration

## PluginOptions

Plugin options passed to `z2fVite(options)`. Every field is optional;
the bare `z2fVite()` invocation produces a working plugin.

Pass this to `z2fVite()` in your `vite.config.ts`. Only known keys are
accepted — unknown keys throw `Z2F_VITE_INVALID_OPTIONS` at startup.

### Properties

#### configPath

Path to `z2f.config.{ts,js,mjs}`. Auto-discovered from the Vite root
if undefined.

**Type:** `string`

#### configOverride

Canonical patch merged over the loaded config using shared domain-specific rules.

**Type:** `ConfigPatch`

#### generate

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

**Type:** `{ include?: string[]; exclude?: string[] }`

#### write

Optional opt-in to emit generated files to disk.

**Type:** `WriteOptions`

#### logLevel

Plugin-specific log level. Independent of Vite's log level.

**Type:** `"silent" | "warn" | "info" | "debug"`

### Use when
- Pointing the plugin to a non-standard config file path (`configPath`)
- Enabling generate mode to rewrite `<ZodForm>` call sites at build time (`generate`)
- Overriding config programmatically without a `z2f.config.ts` (`configOverride`)
- Adjusting diagnostic verbosity (`logLevel`)

### NEVER
- NEVER set `generate: {}` in production without auditing what files it matches — by default it targets all `**/*.{ts,tsx,js,jsx}` and rewrites every `<ZodForm>` call site it can statically resolve, which changes compiled output the developer didn't explicitly annotate
- NEVER pass unknown option keys — the plugin validates the options object at startup and throws `Z2F_VITE_INVALID_OPTIONS` for any unrecognized key

## WriteOptions

Optional disk-write settings. When omitted, generated forms are served
as virtual modules only (no files written).

### Properties

#### outDir

Directory for emitted files. If undefined, write each generated file
beside its source schema.

**Type:** `string`

#### filenamePattern

File naming pattern with substitution tokens.
Default: `'{schemaBasename}.{variant}.generated.tsx'`.

**Type:** `string`