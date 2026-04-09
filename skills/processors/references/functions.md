# Functions

## `processArray`
```ts
processArray(schema: $ZodArray, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodArray` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processTuple`
```ts
processTuple(schema: $ZodTuple, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodTuple` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processBoolean`
```ts
processBoolean(schema: $ZodBoolean, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodBoolean` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processMap`
Process z.map() — renders as an array-like repeater of key-value pair fieldsets.
Each entry has a `key` field and a `value` field derived from the Map's type params.
```ts
processMap(schema: $ZodMap, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodMap` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processSet`
Process z.set() — renders as an array-like repeater of unique items.
The value type determines the item template.
```ts
processSet(schema: $ZodSet, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodSet` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processCrossRef`
```ts
processCrossRef(schema: $ZodType, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodType` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processDate`
```ts
processDate(_schema: $ZodDate<unknown> | $ZodISODate, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `_schema: $ZodDate<unknown> | $ZodISODate` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processEnum`
```ts
processEnum(schema: $ZodEnum, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodEnum` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processLiteral`
```ts
processLiteral(schema: $ZodLiteral, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodLiteral` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processFallback`
```ts
processFallback(schema: $ZodType, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodType` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processFile`
```ts
processFile(_schema: $ZodType, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `_schema: $ZodType` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processNumber`
```ts
processNumber(schema: $ZodNumber<unknown> | $ZodBigInt<unknown>, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodNumber<unknown> | $ZodBigInt<unknown>` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processObject`
```ts
processObject(schema: $ZodObject, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodObject` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processIntersection`
```ts
processIntersection(schema: $ZodIntersection, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodIntersection` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processRecord`
```ts
processRecord(schema: $ZodRecord, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodRecord` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processString`
```ts
processString(schema: $ZodString, ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodString` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processTemplateLiteral`
```ts
processTemplateLiteral(schema: $ZodTemplateLiteral, _ctx: FormProcessorContext, field: FormField, _params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodTemplateLiteral` — 
- `_ctx: FormProcessorContext` — 
- `field: FormField` — 
- `_params: ProcessParams` — 

## `processUnion`
```ts
processUnion(schema: $ZodUnion, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodUnion` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processDiscriminatedUnion`
```ts
processDiscriminatedUnion(schema: $ZodDiscriminatedUnion, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodDiscriminatedUnion` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processDefault`
```ts
processDefault(schema: $ZodDefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>> | $ZodPrefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodDefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>> | $ZodPrefault<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processLazy`
```ts
processLazy(schema: $ZodLazy, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodLazy` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processNullable`
```ts
processNullable(schema: $ZodNullable, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodNullable` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processOptional`
```ts
processOptional(schema: $ZodOptional, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodOptional` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processPipe`
```ts
processPipe(schema: $ZodPipe, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodPipe` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 

## `processReadonly`
```ts
processReadonly(schema: $ZodReadonly, ctx: FormProcessorContext, field: FormField, params: ProcessParams): void
```
**Parameters:**
- `schema: $ZodReadonly` — 
- `ctx: FormProcessorContext` — 
- `field: FormField` — 
- `params: ProcessParams` — 
