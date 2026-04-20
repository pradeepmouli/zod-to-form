[**Documentation v0.2.0**](../../../README.md)

***

[Documentation](../../../README.md) / [@zod-to-form/cli](../README.md) / createProgram

# Function: createProgram()

> **createProgram**(): `Command`

Defined in: [cli/src/index.ts:325](https://github.com/pradeepmouli/zod-to-form/blob/a4dd58978c639c7b27f819dd2141da3ec858bcf3/packages/cli/src/index.ts#L325)

Creates the Commander.js CLI program for `zod-to-form`.

Registers the `generate` and `init` sub-commands with all their options and
action handlers. Consumers can pass the returned `Command` to `.parseAsync()`
to run the CLI, or use it for testing without spawning a child process.

## Returns

`Command`

A fully configured `Command` instance ready to be parsed.

## Use When

- Testing CLI commands programmatically without spawning a child process
- Extending the CLI with custom sub-commands in a wrapper tool

## Avoid When

- You just want to generate a form from a script — use `runGenerate()` directly
- End-user invocation — use `npx zod-to-form` (the binary entry point) instead

## Pitfalls

- NEVER call `program.parse()` (synchronous) in ESM environments — use
  `.parseAsync(process.argv)` instead or the program will silently not execute

## Example

```ts
const program = createProgram();
await program.parseAsync(['node', 'z2f', 'generate',
  '--config', 'z2f.config.ts',
  '--schema', 'src/schemas/user.ts',
  '--export', 'UserSchema',
]);
```
