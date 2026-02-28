# Phase 0 Research: Rune Integration Additions

## Decision 1: Keep `FormField[]` as the shared IR for runtime and CLI

- **Decision**: Continue using the existing `FormField[]` output from core walker as the sole bridge into `@zod-to-form/react` and `@zod-to-form/cli`.
- **Rationale**: This is mandated by the constitution (Dual-Mode Output) and avoids divergence between runtime/render-time behavior and generated code behavior.
- **Alternatives considered**:
  - Separate runtime and codegen models: rejected due to behavior drift risk.
  - JSON Schema intermediary: rejected by constitution Principle I and potential information loss.

## Decision 2: Export built-in processors from `@zod-to-form/core/processors`

- **Decision**: Surface named built-in processors from a public processors entrypoint and document custom override registration.
- **Rationale**: Solves the primary adoption blocker by making extension points concrete, testable, and importable without forking.
- **Alternatives considered**:
  - Keep processors internal and document behavior only: rejected because consumers still cannot compose/override safely.
  - Expose walker internals directly: rejected as too leaky and brittle.

## Decision 3: Add `onValueChange` and `mode` to runtime form API

- **Decision**: Add optional `onValueChange` callback and pass-through `mode` config to React Hook Form; do not emit on mount.
- **Rationale**: Required for debounced autosave patterns; non-emission on mount prevents accidental initial writes.
- **Alternatives considered**:
  - Submit-only lifecycle: rejected because it blocks rune-langium integration.
  - `emitOnMount` option now: rejected to minimize scope and ambiguity.

## Decision 4: Introduce CLI `--mode auto-save` generation mode

- **Decision**: Add an explicit generation mode that emits watch/effect wiring and omits submit button while preserving default submit mode behavior.
- **Rationale**: Maintains backward compatibility and provides deterministic generated output for autosave use cases.
- **Alternatives considered**:
  - Auto-detect mode from schema/meta: rejected as implicit and error-prone.
  - Replace default mode entirely: rejected due to regression risk.

## Decision 5: Use unified `component-config` for CLI and runtime

- **Decision**: Define one config shape consumed by both codegen and runtime rendering, including `components` module path, `fieldTypes`, and optional `fields` overrides.
- **Rationale**: Eliminates config drift and keeps build-time and runtime component resolution consistent.
- **Alternatives considered**:
  - CLI-only mapping config: rejected because runtime would need duplicate mapping logic.
  - Runtime-only component map: rejected because CLI cannot consume function references at build time.

## Decision 6: TypeScript component-config loading via `jiti`

- **Decision**: Accept `.json` and `.ts` component-config files; resolve TS configs via `jiti` in CLI.
- **Rationale**: Enables typed configs with `satisfies` while keeping setup friction low.
- **Alternatives considered**:
  - JSON only: rejected because it loses compile-time key validation.
  - Require ts-node/tsx peer tooling: rejected due to extra setup burden.

## Decision 7: Enforce precedence and fallback rules

- **Decision**: Precedence rules are: processor output over form metadata in core, and `fields` over `fieldTypes` in component-config; absent config falls back to type defaults.
- **Rationale**: Most-specific-wins is predictable and aligns with clarified user decisions.
- **Alternatives considered**:
  - Error on overlaps: rejected because it makes normal override workflows cumbersome.
  - fieldTypes over fields: rejected because it blocks targeted per-field overrides.

## Decision 8: Runtime validation/error semantics for component resolution

- **Decision**: Runtime resolves `(await import(config.components))[entry.component]`, caches module load, and throws explicit errors for non-function resolved component or non-function `render` override.
- **Rationale**: Fail-fast diagnostics improve developer feedback and reduce silent misconfiguration.
- **Alternatives considered**:
  - Silent fallback to input on runtime mismatch: rejected due to hidden bugs.
  - Throw generic error messages: rejected due to poor debuggability.

## Decision 9: No Next.js dependency introduction

- **Decision**: Keep all runtime and generated output framework-agnostic and avoid Next.js-specific dependencies/adapters.
- **Rationale**: Required by clarified requirement and rune-langium browser-focused integration needs.
- **Alternatives considered**:
  - Optional Next.js hooks in generated output: rejected as unnecessary coupling.

## Feature Test Matrix Notes

- **US1-AC1..US1-AC3**: Core processor export, override, and metadata precedence tests (`packages/core/tests/**`).
- **US2-AC1..US2-AC4**: React lifecycle tests for valid-change emission, invalid suppression, submit compatibility, and no mount emit (`packages/react/tests/**`).
- **US3-AC1..US3-AC4**: CLI auto-save output + unified component-config tests and runtime component resolution tests (`packages/cli/tests/**`, `packages/react/tests/**`).
- **EC-003..EC-005**: Malformed config, non-function resolution, and invalid render override diagnostics covered by negative tests.
- **SC-006/FR-016**: Non-Next.js integration verified through plain React fixture compile/runtime validation tasks.

## Validation Runs (Phase 6)

- `pnpm --filter @zod-to-form/core test` ✅ passed (`102` tests)
- `pnpm --filter @zod-to-form/react test` ✅ passed (`30` tests)
- `pnpm --filter @zod-to-form/cli test` ✅ passed (`30` tests)
- `pnpm run lint` ✅ passed with warnings only (no errors)
- `pnpm run type-check` ✅ passed (core/cli/react)
- `pnpm test` ✅ passed (all workspace package tests)
- `pnpm run format:check` ✅ passed after applying `pnpm run format`

Notes:
- React runtime diagnostics tests intentionally emit console error output while asserting fail-fast behavior for invalid component config resolution (`INVALID_RUNTIME_COMPONENT`, `INVALID_COMPONENT_ENTRY`).
