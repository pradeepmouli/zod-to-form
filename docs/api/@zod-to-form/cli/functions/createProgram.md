[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / createProgram

# Function: createProgram()

> **createProgram**(): `Command`

Defined in: [cli/src/index.ts:237](https://github.com/pradeepmouli/zod-to-form/blob/f52a0ed6020c1b7e4faaba6683436bbe29928d05/packages/cli/src/index.ts#L237)

Creates the Commander.js CLI program for `zod-to-form`.

Registers the `generate` and `init` sub-commands with all their options and
action handlers. Consumers can pass the returned `Command` to `.parseAsync()`
to run the CLI, or use it for testing without spawning a child process.

## Returns

`Command`

A fully configured `Command` instance ready to be parsed.
