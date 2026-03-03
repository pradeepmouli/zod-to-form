# Phase 0 Research: CLI init + component-config bootstrap

## Decision 1: Introduce dedicated `init` command in CLI

- **Decision**: Add `zodform init` to create `component-config.ts` in project root.
- **Rationale**: Reduces manual setup errors and standardizes onboarding.
- **Alternatives considered**:
  - Keep manual config creation only: rejected due to setup friction.
  - Auto-create config on first generate run: rejected due to implicit side effects.

## Decision 2: Use `component-config.ts` as primary config filename with legacy fallback

- **Decision**: New scaffolding writes `component-config.ts`; loader keeps fallback support for `z2f.config.ts`.
- **Rationale**: Enables naming migration without breaking existing users.
- **Alternatives considered**:
  - Immediate hard switch with no fallback: rejected due to breaking change risk.
  - Keep old filename as primary: rejected because migration goal is explicit.

## Decision 3: Infer defaults from shadcn config when available

- **Decision**: Detect shadcn config and map discovered aliases/paths into generated config defaults.
- **Rationale**: Aligns generated forms with existing project conventions and reduces manual edits.
- **Alternatives considered**:
  - Ignore shadcn config entirely: rejected due to poor interoperability.
  - Require explicit flags for every inferred value: rejected as high-friction setup.

## Decision 4: Move shared component-config contracts into core

- **Decision**: Define reusable component-config types/helpers in `@zod-to-form/core` and consume from CLI.
- **Rationale**: Removes duplicate type definitions and keeps contracts consistent across packages.
- **Alternatives considered**:
  - Keep CLI-local types: rejected due to drift risk.
  - Create a new package only for shared config: rejected as unnecessary package complexity.

## Decision 5: Clarified output verbosity model

- **Decision**: Default output is concise progress + final summary; `--verbose` enables detailed diagnostics.
- **Rationale**: Good default UX for humans/CI while preserving deep troubleshooting capability.
- **Alternatives considered**:
  - Always-verbose default: rejected due to noisy logs.
  - Minimal summary-only default: rejected because users lose in-flight visibility.

## Decision 6: Keep TypeScript module resolution aligned with repository config

- **Decision**: Verify/update generated schema import path/extension behavior against `module: nodenext` and current package tsconfig settings.
- **Rationale**: Prevents invalid import specifiers in generated code under strict ESM/Node resolution.
- **Alternatives considered**:
  - Emit extensionless imports universally: rejected due to nodenext incompatibilities.
  - Hardcode `.ts` imports in output: rejected because runtime output should target emitted JS semantics.

## Decision 7: Preserve dependency discipline

- **Decision**: Implement feature with existing CLI dependencies (`commander`, `jiti`) and existing workspace tooling.
- **Rationale**: Complies with constitution Principle IV (Zero Unnecessary Dependencies).
- **Alternatives considered**:
  - Add additional config-parser package: rejected as unnecessary for current scope.

## Decision 8: Testing strategy for reliability and migration safety

- **Decision**: Add tests for init generation, shadcn introspection mapping, fallback loading order, verbosity output modes, and import-path correctness.
- **Rationale**: Covers user-visible behaviors and migration-critical logic before implementation refactors.
- **Alternatives considered**:
  - Manual validation only: rejected due to regression risk across CLI flows.
