[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/core](../README.md) / [](../README.md) / configPropertySchemas

# Variable: configPropertySchemas

> `const` **configPropertySchemas**: `object`

Defined in: config.ts:312

Shared property validators for configuration editors and adapters.

## Type Declaration

### components

> **components**: `ZodObject`\<\{ `fieldTemplate`: `ZodOptional`\<`ZodString`\>; `overrides`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodObject`\<\{ `controlled`: `ZodOptional`\<`ZodBoolean`\>; `props`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; \}, `$loose`\>\>\>; `preset`: `ZodOptional`\<`ZodEnum`\<\{ `html`: `"html"`; `shadcn`: `"shadcn"`; \}\>\>; `source`: `ZodString`; \}, `$loose`\> = `componentsConfigSchema`

### defaults

> **defaults**: `ZodOptional`\<`ZodObject`\<\{ `formProvider`: `ZodOptional`\<`ZodBoolean`\>; `mode`: `ZodOptional`\<`ZodEnum`\<\{ `auto-save`: `"auto-save"`; `submit`: `"submit"`; \}\>\>; `optimization`: `ZodOptional`\<`ZodObject`\<\{ `compileZod`: `ZodOptional`\<`ZodBoolean`\>; `level`: `ZodOptional`\<`ZodUnion`\<readonly \[`ZodLiteral`\<...\>, `ZodLiteral`\<...\>, `ZodLiteral`\<...\>\]\>\>; \}, `$loose`\>\>; `out`: `ZodOptional`\<`ZodString`\>; `overwrite`: `ZodOptional`\<`ZodBoolean`\>; `serverAction`: `ZodOptional`\<`ZodBoolean`\>; `ui`: `ZodOptional`\<`ZodEnum`\<\{ `html`: `"html"`; `shadcn`: `"shadcn"`; \}\>\>; \}, `$loose`\>\> = `defaultsSchema`

### exclude

> **exclude**: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>

### fields

> **fields**: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodObject`\<\{ `component`: `ZodOptional`\<`ZodString`\>; `disabled`: `ZodOptional`\<`ZodBoolean`\>; `helpText`: `ZodOptional`\<`ZodString`\>; `hidden`: `ZodOptional`\<`ZodBoolean`\>; `order`: `ZodOptional`\<`ZodNumber`\>; `props`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `section`: `ZodOptional`\<`ZodString`\>; \}, `$loose`\>\>\>

### include

> **include**: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>

### schemas

> **schemas**: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodObject`\<\{ `component`: `ZodOptional`\<`ZodString`\>; `fields`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodObject`\<\{ `component`: `ZodOptional`\<`ZodString`\>; `disabled`: `ZodOptional`\<`ZodBoolean`\>; `helpText`: `ZodOptional`\<`ZodString`\>; `hidden`: `ZodOptional`\<`ZodBoolean`\>; `order`: `ZodOptional`\<`ZodNumber`\>; `props`: `ZodOptional`\<`ZodRecord`\<..., ...\>\>; `section`: `ZodOptional`\<`ZodString`\>; \}, `$loose`\>\>\>; `mode`: `ZodOptional`\<`ZodEnum`\<\{ `auto-save`: `"auto-save"`; `submit`: `"submit"`; \}\>\>; `name`: `ZodOptional`\<`ZodString`\>; `out`: `ZodOptional`\<`ZodString`\>; `serverAction`: `ZodOptional`\<`ZodBoolean`\>; \}, `$loose`\>\>\>

### types

> **types**: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>
