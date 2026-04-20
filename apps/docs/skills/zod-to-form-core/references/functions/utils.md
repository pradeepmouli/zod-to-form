# Functions

## Utils

### `joinPath`
Join a parent path and a child key with a dot separator.
Returns `key` directly when `parent` is undefined or empty.
```ts
joinPath(parent: string | undefined, key: string): string
```
**Parameters:**
- `parent: string | undefined` — The parent path (e.g. `"address"`) or undefined for top-level fields.
- `key: string` — The child field key to append (e.g. `"street"`).
**Returns:** `string` — The joined path (e.g. `"address.street"`) or `key` when parent is absent.
```ts
joinPath('address', 'street') → 'address.street'
```
```ts
joinPath(undefined, 'name') → 'name'
```

### `createBaseField`
Create a base FormField with sensible defaults.
Processors fill in the specific component and props after calling this.
```ts
createBaseField(key: string, zodType: string): FormField
```
**Parameters:**
- `key: string` — The field path (e.g. `"name"`, `"address.street"`).
- `zodType: string` — The Zod `def.type` string (e.g. `"string"`, `"object"`).
**Returns:** `FormField` — A FormField with all required properties set to their defaults.

### `getEmptyDefault`
Returns a type-safe empty default value for a FormField based on its zodType
and structure. Used by codegen for useFieldArray append() defaults and
by runtime for initial values.

- string → ''
- number/bigint → 0
- boolean → false
- date → undefined
- object (Fieldset) → recursively builds from children
- array (ArrayField) → []
- enum → first option value or ''
- union/discriminatedUnion → first variant's empty default
```ts
getEmptyDefault(field: FormField): unknown
```
**Parameters:**
- `field: FormField` — The FormField to generate an empty default for.
**Returns:** `unknown` — An empty default value matching the field's type structure.

### `normalizeFieldKey`
Normalise a concrete field key to the bracket notation used in config.
Replaces `.0.`, `.${index}.`, and any `.<digits>.` segments with `[].`.
```ts
normalizeFieldKey(key: string): string
```
**Parameters:**
- `key: string` — A concrete field key potentially containing numeric array indices.
**Returns:** `string` — The normalized key with array index segments replaced by `[]`.
```ts
normalizeFieldKey('items.0.name') → 'items[].name'
```
```ts
normalizeFieldKey('items.${index}.name') → 'items[].name'
```
```ts
normalizeFieldKey('tags.2') → 'tags[]'
```

### `collectFieldSections`
Collect section groupings from fields and a config override lookup.
Returns a Map of section name → array of field keys that belong to it.
Recursively visits nested children and array item templates.
```ts
collectFieldSections(fields: FormField[], getOverride: (key: string) => { section?: string } | undefined): Map<string, string[]>
```
**Parameters:**
- `fields: FormField[]` — The flat or nested FormField array to scan for section assignments.
- `getOverride: (key: string) => { section?: string } | undefined` — A function that returns the config override (if any) for a given field key.
**Returns:** `Map<string, string[]>` — A Map from section name to the ordered list of field keys assigned to that section.
