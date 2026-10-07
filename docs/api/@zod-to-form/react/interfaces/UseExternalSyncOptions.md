[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/react](../README.md) / [](../README.md) / UseExternalSyncOptions

# Interface: UseExternalSyncOptions

Defined in: packages/react/src/useExternalSync.ts:18

Options for [useExternalSync](../functions/useExternalSync.md).

## Properties

### keepDirty?

> `optional` **keepDirty?**: `boolean`

Defined in: packages/react/src/useExternalSync.ts:24

If true, preserve dirty fields across an external reset.
Defaults to false (matches the common "I switched contexts; discard edits"
intent).
