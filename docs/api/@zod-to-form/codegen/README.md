[**Documentation v0.2.0**](../../README.md)

***

[Documentation](../../README.md) / @zod-to-form/codegen

# @zod-to-form/codegen

Browser-safe code generation utilities for Zod v4 form components.

Provides the building blocks for generating React form TSX files from a
`FormField[]` tree and a `ZodFormsConfig`. No Node.js dependencies — safe
to import in browser and server environments alike.

Key exports:
- `generateFormComponent` — produce a complete TSX form component string
- `getFileHeader` — emit import declarations for generated files
- `renderField` — render a single field to its JSX string
- `buildConfigSource` — generate a `z2f.config.ts` starter file
- `getFieldTemplateSource` — emit the preset FieldTemplate component source
- `generateSchemaLiteFile` — emit the lite schema file for optimized validation

## Use When

- You are building a custom codegen pipeline on top of `walkSchema`
- You need to generate form components programmatically (e.g. a playground or IDE plugin)

## Avoid When

- You just want to generate forms — use the CLI (`npx zod-to-form generate`) instead

## Never

- NEVER import this in a browser bundle that tree-shakes — the template strings are large.
  Use dynamic `import()` if you only need codegen in certain code paths.

## Codegen

- [generateFormComponent](functions/generateFormComponent.md)
- [resolveFieldMapping](functions/resolveFieldMapping.md)

## Config Templates

- [buildConfigSource](functions/buildConfigSource.md)

## Other

- [CodegenConfig](type-aliases/CodegenConfig.md)
- [ConfigTemplateOptions](type-aliases/ConfigTemplateOptions.md)
- [PRESET\_TEMPLATE\_IMPORTS](variables/PRESET_TEMPLATE_IMPORTS.md)

## Templates

- [generateSchemaLiteFile](functions/generateSchemaLiteFile.md)
- [getFieldTemplateSource](functions/getFieldTemplateSource.md)
- [getFileHeader](functions/getFileHeader.md)
- [registerPathExpr](functions/registerPathExpr.md)
- [renderField](functions/renderField.md)
