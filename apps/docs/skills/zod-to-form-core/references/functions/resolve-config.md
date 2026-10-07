# Functions

## resolve-config

### `mergeConfigLayers`
Merge authored layers without expanding presets. Arrays and props replace.
```ts
mergeConfigLayers(layers: ConfigPatch[]): ZodFormsConfig
```
**Parameters:**
- `layers: ConfigPatch[]`
**Returns:** `ZodFormsConfig`

### `resolveFormConfig`
Resolve one root export from the canonical config and optional variant.
```ts
resolveFormConfig(__namedParameters: { config: ZodFormsConfig; exportName: string; variant?: string; invocation?: ConfigInvocation }): ResolvedFormConfig
```
**Parameters:**
- `__namedParameters: { config: ZodFormsConfig; exportName: string; variant?: string; invocation?: ConfigInvocation }`
**Returns:** `ResolvedFormConfig`
