[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / HMRInvalidationMap

# Interface: HMRInvalidationMap

Defined in: [packages/vite/src/types.ts:265](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/types.ts#L265)

The graph edges that `handleHotUpdate` walks when a watched file changes.

Built incrementally as the plugin sees `resolveId` / `load` / `transform`
calls. Reset on dev server restart.

## Properties

### configWatchers

> **configWatchers**: `Set`\<`string`\>

Defined in: [packages/vite/src/types.ts:276](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/types.ts#L276)

All modules that depend on the config (for config-change fan-out).

***

### schemaToImporters

> **schemaToImporters**: `Map`\<`string`, `Set`\<`string`\>\>

Defined in: [packages/vite/src/types.ts:270](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/types.ts#L270)

For each schema file, the set of Vite module ids that import it.

***

### schemaToTargets

> **schemaToTargets**: `Map`\<`string`, `Set`\<`string`\>\>

Defined in: [packages/vite/src/types.ts:267](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/types.ts#L267)

For each schema file, the set of cache keys depending on it.

***

### targetToImporters

> **targetToImporters**: `Map`\<`string`, `Set`\<`string`\>\>

Defined in: [packages/vite/src/types.ts:273](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/types.ts#L273)

For each cache entry, the set of modules that import its virtual id.
