---
name: zod-to-form-core
description: Schema-Driven Form Generation for Zod v4 - walks Zod internal type tree using processor registry pattern to emit React form components instead of JSON Schema
license: MIT
---

# @zod-to-form/core

Schema-Driven Form Generation for Zod v4 - walks Zod internal type tree using processor registry pattern to emit React form components instead of JSON Schema

## When to Use

- API surface: 42 functions, 27 types, 4 constants

## Quick Reference

`createOptimizers`, `builtinOptimizers`
**schema-lite:** `createSchemaLiteCollector`
**config:** `defineConfig`, `validateConfig`, `resolveFieldConfig`, `normalizeConfig`, `ComponentOverride`, `ComponentPreset`, `ComponentsConfig`, `TypedFieldConfig`, `ZodFormsConfig`, `ZodTypeConfig`, `ConfigDefaults`, `OptimizationConfig`, `StripIndexSignature`, `SHADCN_OVERRIDES`, `DEFAULT_OVERRIDES`
**utils:** `inferLabel`, `joinPath`, `createBaseField`, `getEmptyDefault`, `normalizeFieldKey`, `collectFieldSections`
**normalize:** `normalizeFormValues`
**walker:** `walkSchema`
**registry:** `createProcessors`, `builtinProcessors`
**register:** `registerDeep`, `registerFlat`
**array:** `processArray`, `processTuple`
**boolean:** `processBoolean`
**collections:** `processMap`, `processSet`
**cross-ref:** `processCrossRef`
**date:** `processDate`
**enum:** `processEnum`, `processLiteral`
**fallback:** `processFallback`
**file:** `processFile`
**number:** `processNumber`
**object:** `processObject`, `processIntersection`
**record:** `processRecord`
**string:** `processString`, `processTemplateLiteral`
**union:** `processUnion`, `processDiscriminatedUnion`
**wrappers:** `processDefault`, `processLazy`, `processNullable`, `processOptional`, `processPipe`, `processReadonly`
**types:** `FormField`, `FormFieldOption`, `FormFieldConstraints`, `FormProcessor`, `FormProcessorContext`, `FormMeta`, `FieldConfig`, `FieldExpression`, `ProcessParams`, `WalkOptions`, `ZodFormRegistry`, `NativeRules`, `ValidationStrategy`, `FormOptimizer`, `FormOptimizerContext`, `WalkResult`, `SchemaLiteCollector`, `SchemaLiteInfo`

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form)
- Author: Pradeep Mouli <noreply@anthropic.com>