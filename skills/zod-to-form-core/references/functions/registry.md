# Functions

## Registry

### `createProcessors`
Create a custom processor registry by merging with built-in processors.
Custom entries override built-in processors for the same `def.type` key.
```ts
createProcessors(custom: Record<string, FormProcessor>): Record<string, FormProcessor>
```
**Parameters:**
- `custom: Record<string, FormProcessor>` — Additional or override processors keyed by Zod `def.type` (e.g. `'string'`, `'myCustomType'`).
**Returns:** `Record<string, FormProcessor>` — A merged registry of built-in and custom processors ready for use with `walkSchema`.
