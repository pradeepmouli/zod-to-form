---
sidebar_position: 10
title: Benchmarks
description: Full form-lifecycle performance measurements across optimization levels and the codegen-vs-runtime axis.
---

# Benchmarks

:::info
All numbers in this document come from a real benchmark run you can reproduce locally with `pnpm run bench:report`. Results are written to [`benchmarks/RESULTS.md`](https://github.com/pradeepmouli/zod-to-form/blob/master/benchmarks/RESULTS.md) in the repo. The numbers on this page are a snapshot from April 2026 on Chromium via Playwright.
:::

## Headline

For a medium-size form (18 fields) with light editing (20 keystrokes before submit), **z2f's fastest config is `1.77×` faster** than a hand-wired `useForm + zodResolver` baseline. On large forms (50 fields) with heavy editing (500 keystrokes), the gap widens to **`2.00×`**.

The single biggest win is **per-keystroke validation cost**: `~109ns` with L2 native rules vs `~2.57μs` with `zodResolver` on a 50-field schema — a **`~24×` speedup** on the keystroke hot path.

## Why we optimize the form lifecycle, not `.parse()` throughput

Every form session consists of four kinds of work:

1. **Walk** — read the Zod schema, produce a `FormField[]` tree. Happens once per form instance (or zero times with codegen).
2. **Mount** — React renders the form. Happens once per form instance.
3. **Keystroke validation** — each character typed triggers a validator on the changed field. Happens N times per session.
4. **Submit validation** — whole-form validation + cross-field effects. Happens once per session.

Each of these dominates at a different point in the session. A single `.parse()` throughput number doesn't tell you what a real interactive form feels like — you need the full lifecycle, amortized over realistic session lengths.

z2f's optimizer chain addresses each step:

- **Codegen** eliminates step 1 entirely — the walk happens at build time. Runtime mount imports a pre-walked module.
- **L1 (decompose)** stores per-field `zodSchema` references so keystroke validation parses one field, not the whole form.
- **L2 (native rules)** converts Zod constraints to RHF's `register({ minLength, pattern, ... })` rule objects, bypassing Zod entirely at the keystroke hot path.
- **`schemaLite`** splits top-level `superRefine` / `refine` / `transform` effects from per-field validators so cross-field checks only run on submit, not on every keystroke.

## Schema fixtures

Three sizes, exercised at `no-opt / L1 / L2` × `runtime / codegen` = six configurations per size.

| Size | Fields | Shape |
|---|---|---|
| small | 5 | flat primitives, one enum, one optional string |
| medium | 18 | flat primitives + one nested object + one array |
| large | 50 | five nested object groups + discriminated union + array-of-objects |

Source: [`packages/react/tests/performance/schemas.ts`](https://github.com/pradeepmouli/zod-to-form/blob/master/packages/react/tests/performance/schemas.ts).

## Primitive costs (browser)

Each of the four lifecycle steps measured in isolation. Lower is better.

### Walk cost (`walkSchema` only, once per form instance)

| Schema | no-opt | L1 | L2 |
|---|---|---|---|
| small (5) | 2.60μs | 3.28μs | 3.54μs |
| medium (18) | 13.75μs | 36.78μs | 37.39μs |
| large (50) | 38.01μs | 97.60μs | 103.37μs |

L1/L2 walks are slower than no-opt because the optimizer chain runs per field (L1 stores the schema reference, L2 extracts native rules). This cost is paid once per mount — or, with codegen, zero times.

### Mount cost (walk + React render + commit)

| Schema | Runtime (walks) | Codegen (no walk) | Codegen speedup |
|---|---|---|---|
| small (5) no-opt | 497μs | 394μs | 1.26× |
| small (5) L2 | 797μs | 638μs | 1.25× |
| medium (18) L2 | 2.35ms | 862μs | **2.73×** |
| large (50) L1 | 3.29ms | 1.68ms | **1.96×** |
| large (50) L2 | 4.01ms | 1.79ms | **2.24×** |

The walk + optimizer cost compounds with React rendering — runtime pays both, codegen pays only React.

### Keystroke cost (single-field validation per op)

Simulates `mode: 'onChange'` where typing one character re-validates the changed field.

| Schema | no-opt (full schema via zodResolver) | L1 (single-field `safeParse`) | L2 (native rules) |
|---|---|---|---|
| small (5) | 222ns | 156ns | **91ns** |
| medium (18) | 793ns | 120ns | **101ns** |
| large (50) | 2.57μs | 183ns | **109ns** |

Two things jump out:

1. **no-opt scales with schema size** — RHF with `zodResolver` runs the full schema on every keystroke, so a 50-field form pays 12× more per character than a 5-field form.
2. **L1 and L2 are essentially flat** — both validate only the changed field. L2 wins by a small constant factor because native rules are just property reads + comparisons; L1 still calls into Zod for the one field.

At large size, **L2 is 23.9× faster per keystroke** than the zodResolver baseline. This is the single largest single-operation speedup in the whole system.

### Submit cost (full form validation, once per session)

| Schema | no-opt | L1 | L2 |
|---|---|---|---|
| small (5) | 270ns | 409ns | 247ns |
| medium (18) | 920ns | 1.96μs | 1.82μs |
| large (50) | 2.57μs | 6.58μs | 4.54μs |

Here **no-opt wins** at medium and large — because a single full `schema.safeParse()` is cheaper than N per-field `safeParse` calls + a schemaLite check. Submit-time is where L1/L2 pay some of the cost back.

But submit happens once per session. Keystrokes happen hundreds of times. The amortized math strongly favors L1/L2.

## Amortized session cost

`session_time = mount + K × keystroke + submit`, where `K` is the number of keystrokes before submit.

| K | Represents |
|---|---|
| 0 | `onSubmit` mode, user fills form and submits without per-keystroke validation |
| 20 | `onChange` mode, light editing (a few fields touched) |
| 100 | Moderate editing across most fields |
| 500 | Long session, heavy re-editing |

### small (5 fields)

| Config | K=0 | K=20 | K=100 | K=500 |
|---|---|---|---|---|
| runtime no-opt | 497μs | 502μs | 521μs | 614μs |
| runtime L1 | 638μs | 641μs | 653μs | 712μs |
| runtime L2 | 797μs | 799μs | 806μs | 844μs |
| codegen no-opt | 395μs | 399μs | 418μs | 511μs |
| **codegen L1** | **394μs** | **397μs** | **409μs** | **469μs** |
| codegen L2 | 638μs | 640μs | 648μs | 686μs |

On small forms, all configs are within ~400μs of each other — React mount dominates. Codegen L1 wins because its mount is the cheapest and its per-keystroke cost is close to L2's.

### medium (18 fields)

| Config | K=0 | K=20 | K=100 | K=500 |
|---|---|---|---|---|
| runtime no-opt | 1.51ms | 1.53ms | 1.59ms | 1.90ms |
| runtime L1 | 1.57ms | 1.58ms | 1.59ms | 1.64ms |
| runtime L2 | 2.35ms | 2.35ms | 2.36ms | 2.40ms |
| codegen no-opt | 1.02ms | 1.04ms | 1.10ms | 1.41ms |
| codegen L1 | 1.29ms | 1.29ms | 1.30ms | 1.35ms |
| **codegen L2** | **862μs** | **864μs** | **872μs** | **913μs** |

Codegen L2 wins across all edit counts. At K=500, it's **2.08× faster** than the runtime no-opt baseline and **2.63× faster** than runtime L2 (which pays walk overhead on every mount).

### large (50 fields)

| Config | K=0 | K=20 | K=100 | K=500 |
|---|---|---|---|---|
| runtime no-opt | 2.26ms | 2.31ms | 2.52ms | 3.56ms |
| runtime L1 | 3.29ms | 3.30ms | 3.31ms | 3.39ms |
| runtime L2 | 4.01ms | 4.01ms | 4.02ms | 4.06ms |
| codegen no-opt | 2.83ms | 2.88ms | 3.09ms | 4.13ms |
| **codegen L1** | **1.68ms** | **1.68ms** | **1.70ms** | **1.78ms** |
| codegen L2 | 1.79ms | 1.79ms | 1.80ms | 1.84ms |

At large size, **codegen L1 is 2.00× faster** than runtime no-opt at K=500. Codegen L2 is a close second. The runtime side of the table tells the story: walk + optimizer overhead dominates, and `useZodForm` pays it on every mount.

## Choosing a configuration

| Use case | Recommended config | Why |
|---|---|---|
| Prototype, frequent schema changes, schemas generated dynamically | **runtime no-opt** | Schema iteration without a build step |
| Production form, static schema, medium size | **codegen L2** | Best amortized lifecycle cost at 18+ fields |
| Production form, static schema, heavy refines/transforms | **codegen L1** | L2 falls back for refined fields; L1 handles them uniformly |
| Large form (50+ fields) in a long-running UI | **codegen L1** | Winner at large size, K=500 |

## Methodology notes

- **Harness**: [`vitest bench`](https://vitest.dev/guide/features.html#benchmarking) in Chromium via Playwright. Each bench gets ~1000ms of wall time + warmup. Reported means use `1 / hz` (per-op time derived from throughput), not `median` — Chrome clamps `performance.now()` resolution to `~100μs` for fingerprinting protection, so median becomes unreliable for sub-ms operations.
- **Variance**: browser benchmarks are noisy. Expect ±15–20% run-to-run variance on absolute timings. Relative speedups within a single run are stable; absolute timings across runs less so.
- **Reproducibility**: run `pnpm run bench:report` to regenerate. Node benches run via vitest's default Node mode; browser benches require Playwright (`pnpm exec playwright install chromium` on first use).
- **Fixture generation**: the codegen-vs-runtime bench runs `generateFormComponent` at bench startup to produce real `.tsx` files under `packages/react/tests/performance/generated/` (gitignored). These are imported statically by the bench, so we measure **actual codegen output**, not a pre-walked simulation.
- **React version**: React 19.2.
- **Node version**: Node 24.14.
