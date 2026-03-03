# Quickstart: CLI init + component-config bootstrap

## Prerequisites

- Run `pnpm install` at repository root
- Use Node.js `>=20` and pnpm `>=10`

## 1) Write tests first (red phase)

Add/adjust tests for:
- `zodform init` creates `component-config.ts`
- shadcn introspection maps discovered aliases/paths to config defaults
- `z2f.config.ts` fallback load behavior remains functional
- default concise output vs `--verbose` diagnostic output
- schema import path/extension behavior compiles with tsconfig settings

Run focused test suites:

```bash
pnpm --filter @zod-to-form/cli test
pnpm --filter @zod-to-form/core test
```

## 2) Implement by feature slice

- `packages/cli`
  - Add `init` command and options (`--force`, `--dry-run`, `--verbose`)
  - Implement config file generation and shadcn introspection mapping
  - Add concise progress + final summary output; expand details when verbose
  - Verify schema import path/extension generation logic against tsconfig behavior

- `packages/core`
  - Move shared component-config contracts/types to core exports
  - Ensure CLI imports and uses shared contracts

## 3) Validate quality gates

```bash
pnpm --filter @zod-to-form/cli test
pnpm --filter @zod-to-form/core test
pnpm run lint
pnpm run type-check
pnpm test
pnpm run format:check
```

## 4) Manual verification checklist

- `zodform init` in project without existing config writes `component-config.ts`
- `zodform init --dry-run` prints planned output without writing file
- `zodform init` with existing config blocks without `--force`
- `zodform init --verbose` includes detailed step-level diagnostics
- Existing `z2f.config.ts` projects continue to load/generate correctly
- Generated schema imports compile under workspace tsconfig settings

## Definition of done

- All acceptance criteria from spec are covered by tests
- No regressions in existing CLI generation paths
- Docs updated with new init command and config naming guidance
