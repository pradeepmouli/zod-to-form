[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / HMRInvalidationMap

# Interface: HMRInvalidationMap

Defined in: packages/vite/src/types.ts:210

The graph edges that `handleHotUpdate` walks when a watched file changes.

Built incrementally as the plugin sees `resolveId` / `load` / `transform`
calls. Reset on dev server restart.

## Properties

### configWatchers

> **configWatchers**: `Set`\<`string`\>

Defined in: packages/vite/src/types.ts:221

All modules that depend on the config (for config-change fan-out).

***

### schemaToImporters

> **schemaToImporters**: `Map`\<`string`, `Set`\<`string`\>\>

Defined in: packages/vite/src/types.ts:215

For each schema file, the set of Vite module ids that import it.

***

### schemaToTargets

> **schemaToTargets**: `Map`\<`string`, `Set`\<`string`\>\>

Defined in: packages/vite/src/types.ts:212

For each schema file, the set of cache keys depending on it.

***

### targetToImporters

> **targetToImporters**: `Map`\<`string`, `Set`\<`string`\>\>

Defined in: packages/vite/src/types.ts:218

For each cache entry, the set of modules that import its virtual id.
