# Quickstart: Rune Integration Additions

## Prerequisites

- `pnpm install` completed at repository root
- Node.js environment compatible with workspace tooling

## Task Traceability

- **US1-AC1..3**: Implemented by `T011`–`T025`
- **US2-AC1..4**: Implemented by `T026`–`T034`
- **US3-AC1..4**: Implemented by `T035`–`T049`, `T056`
- **Edge cases EC-001..EC-007**: Covered by `T026`–`T040`, `T052`, `T054`, `T055`

## 1) Run tests in red-green order (recommended)

1. Add/adjust tests first for:
   - core processor exports and override behavior (`US1-AC1..3`)
   - runtime `onValueChange` lifecycle and mount semantics (`US2-AC1..4`)
   - CLI `--mode auto-save` and `--component-config` behavior (`US3-AC1..4`)
   - negative config/runtime resolution paths (`EC-003..EC-005`)
2. Run focused package tests:

```bash
pnpm --filter @zod-to-form/core test
pnpm --filter @zod-to-form/react test
pnpm --filter @zod-to-form/cli test
```

## 2) Implement feature slices by package

- `packages/core`
  - Export built-in processors from `src/processors/index.ts`
  - Add cross-ref processor export
  - Ensure processor-over-metadata precedence
  - Update docs with custom processor end-to-end sample

- `packages/react`
  - Extend `useZodForm` and `ZodForm` with `onValueChange`, `mode`, and `componentConfig`
  - Enforce no-emit-on-mount and no-emit-when-invalid behavior
  - Resolve configured components from `config.components` with import caching

- `packages/cli`
  - Add `--mode auto-save` codegen behavior
  - Add `--component-config` loading for `.json` and `.ts` (`jiti`)
  - Emit imports from `config.components` and component keys
  - Preserve fallback to default inputs when config absent

## 3) Validate contracts and compile outputs

- Validate generated source compilation in integration tests (`SC-003`, `SC-004`, `SC-009`)
- Validate precedence behavior (`SC-010`)
- Validate runtime diagnostics for invalid component entries (`SC-012`)

## 4) Run repository quality gates

```bash
pnpm run lint
pnpm run type-check
pnpm test
pnpm run format:check
```

## 5) Definition of done checklist

- All acceptance scenarios `US1-AC1..3`, `US2-AC1..4`, `US3-AC1..4` pass
- All edge cases `EC-001..EC-007` covered by tests
- No Next.js dependency introduced
- Generated output remains framework-agnostic and standalone

## Validation Results

Executed validation commands and outcomes:

- `pnpm --filter @zod-to-form/core test` → pass
- `pnpm --filter @zod-to-form/react test` → pass
- `pnpm --filter @zod-to-form/cli test` → pass
- `pnpm run lint` → pass (warnings only)
- `pnpm run type-check` → pass
- `pnpm test` → pass
- `pnpm run format` then `pnpm run format:check` → pass
