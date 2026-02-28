# Data Model: zodform

**Feature**: 001-zodform | **Date**: 2026-02-26

## Core Entities

### FormField (Intermediate Representation)

The central data structure produced by the core walker. A recursive tree of field descriptors that fully describes the form UI without any framework dependency.

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Field path (e.g., `"name"`, `"address.street"`, `"items.0.name"`) |
| `component` | `string` | Component name from ComponentMap (e.g., `"Input"`, `"Select"`, `"Textarea"`) |
| `props` | `Record<string, unknown>` | Pass-through props for the component |
| `label` | `string` | Display label (from metadata or inferred from key) |
| `description` | `string \| undefined` | Help text (from `.describe()` or `.meta()`) |
| `placeholder` | `string \| undefined` | Placeholder text (from `examples[0]` or metadata) |
| `required` | `boolean` | Whether the field is required (from optionality detection) |
| `defaultValue` | `unknown \| undefined` | Default value (from `z.default()` or metadata) |
| `readOnly` | `boolean` | Read-only state (from `z.readonly()` or metadata) |
| `hidden` | `boolean` | Hidden but in form state (from form registry `hidden: true`) |
| `order` | `number \| undefined` | Display order override (from form registry) |
| `gridColumn` | `string \| undefined` | CSS grid-column hint (from form registry `gridColumn`) |
| `options` | `FormFieldOption[] \| undefined` | For enum/union select fields |
| `children` | `FormField[] \| undefined` | For nested objects (recursive) |
| `arrayItem` | `FormField \| undefined` | Template for array items |
| `constraints` | `FormFieldConstraints` | Validation constraints extracted from bag |
| `zodType` | `string` | Original Zod def.type for reference |

### FormFieldOption

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string \| number` | Option value |
| `label` | `string` | Display label |
| `disabled` | `boolean` | Whether option is disabled |

### FormFieldConstraints

| Field | Type | Description |
|-------|------|-------------|
| `min` | `number \| undefined` | Minimum value (number) or min length (string/array) |
| `max` | `number \| undefined` | Maximum value (number) or max length (string/array) |
| `minLength` | `number \| undefined` | Minimum string/array length |
| `maxLength` | `number \| undefined` | Maximum string/array length |
| `pattern` | `string \| undefined` | Regex pattern |
| `format` | `string \| undefined` | Semantic format (email, url, uuid, etc.) |
| `step` | `number \| undefined` | Numeric step value |

### FormProcessor

| Field | Type | Description |
|-------|------|-------------|
| (function) | `(schema: ZodType, ctx: FormProcessorContext, field: FormField, params: ProcessParams) => void` | Reads Zod internals for a specific type, populates the FormField descriptor |

### FormProcessorContext

| Field | Type | Description |
|-------|------|-------------|
| `processors` | `Record<string, FormProcessor>` | Registry mapping `def.type` → processor function |
| `formRegistry` | `ZodRegistry<FormMeta> \| undefined` | Form-specific metadata registry |
| `path` | `string[]` | Current field path stack |
| `seen` | `WeakSet<ZodType>` | Cycle detection for recursive schemas |
| `maxDepth` | `number` | Maximum recursion depth (default: 5) |
| `currentDepth` | `number` | Current recursion depth |

### FormMeta (Registry Annotation)

| Field | Type | Description |
|-------|------|-------------|
| `fieldType` | `string \| undefined` | Override component (e.g., `"textarea"`, `"switch"`, `"combobox"`) |
| `order` | `number \| undefined` | Display order override |
| `hidden` | `boolean \| undefined` | Hide field from UI (remains in form state) |
| `gridColumn` | `string \| undefined` | CSS grid column hint |
| `render` | `((field: FormField, props: unknown) => unknown) \| undefined` | Custom render function (runtime only; React package narrows return to ReactNode) |

### ComponentMap

| Field | Type | Description |
|-------|------|-------------|
| `Input` | `ComponentType` | Text/number/email input |
| `Textarea` | `ComponentType` | Multiline text input |
| `Checkbox` | `ComponentType` | Boolean checkbox |
| `Switch` | `ComponentType` | Boolean toggle switch |
| `Select` | `ComponentType` | Dropdown select |
| `DatePicker` | `ComponentType` | Date input |
| `FileInput` | `ComponentType` | File upload |
| `RadioGroup` | `ComponentType` | Radio button group |
| `FormField` | `ComponentType` | Field wrapper (label + input + error) |
| `FormLabel` | `ComponentType` | Label element |
| `FormDescription` | `ComponentType` | Description text |
| `FormMessage` | `ComponentType` | Validation error message |

### ProcessParams

| Field | Type | Description |
|-------|------|-------------|
| `parentKey` | `string \| undefined` | Parent field path for nested fields |
| `isArrayItem` | `boolean` | Whether this field is an array item template |
| `index` | `number \| undefined` | Array item index (for rendering) |

## Entity Relationships

```
ZodType schema
    │
    ▼
┌──────────────────────┐
│  FormProcessorContext │──── processors: Record<string, FormProcessor>
│  (traversal state)   │──── formRegistry: ZodRegistry<FormMeta>
│                      │──── seen: WeakSet (cycle detection)
└──────────┬───────────┘
           │ process(schema, ctx, params)
           ▼
┌──────────────────────┐
│     FormProcessor     │ ◄── one per def.type
│  reads: _zod.def     │
│  reads: _zod.bag     │
│  reads: registries   │
│  writes: FormField   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐        ┌──────────────────┐
│    FormField[]        │───────►│  Runtime Renderer │ (packages/react)
│ (intermediate repr)   │        │  FormField → JSX  │
│                       │        │  via ComponentMap  │
│  ┌─ children: []     │        └──────────────────┘
│  ├─ arrayItem: {}    │
│  ├─ options: []      │        ┌──────────────────┐
│  └─ constraints: {}  │───────►│   CLI Codegen     │ (packages/cli)
└──────────────────────┘        │  FormField → .tsx │
                                │  static output    │
                                └──────────────────┘
```

## Zod Type → Component Mapping (Default)

| Zod def.type | Default Component | Input Type / Notes |
|--------------|-------------------|-------------------|
| `string` | `Input` | `type="text"` (or email/url/uuid based on format) |
| `number` | `Input` | `type="number"` |
| `bigint` | `Input` | `type="text"` with bigint parsing |
| `boolean` | `Checkbox` | `type="checkbox"` |
| `date` | `DatePicker` | `type="date"` |
| `enum` | `Select` | `<option>` per entry |
| `nativeEnum` | `Select` | `<option>` per entry |
| `literal` | (hidden or read-only) | Single fixed value |
| `file` | `FileInput` | `type="file"` |
| `object` | (group) | Recurse into `def.shape` → `children` |
| `array` | (repeater) | `useFieldArray` + `arrayItem` template |
| `tuple` | (group) | Fixed-length array with positional types |
| `union` | `Select` | Options from union variants |
| `discriminatedUnion` | `Select` + conditional | Select for discriminator, reveal variant fields |
| `optional` | (unwrap) | Set `required: false`, process inner type |
| `nullable` | (unwrap) | Set `required: false`, process inner type |
| `default` | (unwrap) | Set `defaultValue`, process inner type |
| `readonly` | (unwrap) | Set `readOnly: true`, process inner type |
| `pipe` | (unwrap) | Process input type |
| `transform` | `Input` | Fallback to text input |
| `custom` | `Input` | Fallback to text input |
| `lazy` | (depth-limited) | Recurse with cycle detection |
| `intersection` | (merge) | Merge shapes from both sides |
| `record` | (key-value) | Dynamic key-value pairs |

## State Transitions

### Form Lifecycle (Runtime)

```
Schema provided
    │
    ▼
Walk schema → FormField[] (memoized on schema reference)
    │
    ▼
useForm({ resolver: zodResolver(schema), defaultValues })
    │
    ▼
Render fields from FormField[] via ComponentMap
    │
    ├── User edits → RHF validates on change/blur
    │
    ├── User submits (invalid) → Display errors from zodResolver
    │
    └── User submits (valid) → onSubmit(data: z.infer<typeof schema>)
```

### Codegen Lifecycle (CLI)

```
CLI invoked with --schema, --export
    │
    ▼
Load schema via jiti dynamic import
    │
    ▼
Walk schema → FormField[]
    │
    ▼
Generate .tsx source from FormField[]
    │
    ├── Generate form component with explicit markup
    ├── Generate server action (if --server-action)
    │
    ▼
Format with Prettier → Write to --out path
    │
    ▼
(--watch: monitor schema file, repeat on change)
```
