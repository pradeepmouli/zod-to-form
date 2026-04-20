[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/vite](../README.md) / Z2FViteErrorCode

# Type Alias: Z2FViteErrorCode

> **Z2FViteErrorCode** = `"Z2F_VITE_CONFIG_NOT_FOUND"` \| `"Z2F_VITE_CONFIG_INVALID"` \| `"Z2F_VITE_SCHEMA_NOT_FOUND"` \| `"Z2F_VITE_SCHEMA_OUTSIDE_ROOT"` \| `"Z2F_VITE_SCHEMA_NOT_ZOD"` \| `"Z2F_VITE_AMBIGUOUS_EXPORT"` \| `"Z2F_VITE_UNKNOWN_VARIANT"` \| `"Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED"` \| `"Z2F_VITE_INVALID_VARIANT_NAME"` \| `"Z2F_VITE_CODEGEN_FAILURE"` \| `"Z2F_VITE_GENERATE_PARSE_ERROR"` \| `"Z2F_VITE_WOULD_CLOBBER_FILE"` \| `"Z2F_VITE_INVALID_OPTIONS"` \| `"Z2F_VITE_NOT_IMPLEMENTED"` \| `"Z2F_VITE_RESOLVER_STRIP_FAILED"`

Defined in: [packages/vite/src/errors.ts:13](https://github.com/pradeepmouli/zod-to-form/blob/80855062565e7587830d7555ce1551eb20fdbb74/packages/vite/src/errors.ts#L13)

Plugin error classes.

Every plugin error carries a stable `code` string and an optional `location`
(file path + line/column). Codes are part of the public contract — see
`specs/007-vite-codegen-plugin/contracts/plugin-options.md`.

Errors are recoverable during `vite dev` (the plugin catches and reports
them via the dev server's error collector without crashing). On `vite build`
they propagate normally and abort the build.
