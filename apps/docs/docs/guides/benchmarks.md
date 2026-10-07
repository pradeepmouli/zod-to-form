---
sidebar_position: 10
title: Benchmarks
description: Compilation off/on validation and form mount measurements.
---

# Benchmarks

The current [measured report](https://github.com/pradeepmouli/zod-to-form/blob/develop/benchmarks/RESULTS.md) records Node, Chromium, Zod, CPU and date, absolute means and off/on ratios. Measure your own schemas before enabling compilation: valid inputs can improve while invalid inputs and setup can become slower.

## Matrix

Node and Chromium reuse one correctness-tested case builder with the core small/medium/large fixtures. Each measures baseline, L1 and L2 with `compileZod: false/true`, accepted and rejected input, and fresh setup. Optimized submits consume finalized per-field schemas/native messages and SchemaLite effects. L2 assumes normalized values constrained by the actual widgets; it is not arbitrary-JSON validation. Large rejected input exercises the password refinement in SchemaLite. The refined-string groups measure message-producing escape hatches. Native-only rules have no Zod target to compile.

Fresh setup clones the entire schema graph before walking/preparation; cloning only the root would leave cached child targets. Steady-state setup runs outside measured callbacks. The separate boolean-only `z.validate` group does not produce parsed output or errors and cannot replace message-producing form validators.

Generated/runtime mount cases use real generated TSX and the runtime hook with compilation off/on. Compilation occurs at module initialization for generated output, so mount timings omit that setup; fresh setup timings show its cost separately.

## Reproduce

```sh
pnpm exec playwright install chromium
pnpm bench --run
pnpm bench:browser --run --browser.headless
# Generate tables from captured artifacts without rerunning measurement:
BENCH_BROWSER_VERSION=<observed-chromium-version> pnpm exec tsx scripts/bench-report.ts
# Or run all benchmarks and reporting with the existing convenience command:
pnpm bench:report
```

Mean microseconds derive from throughput (`1e6 / hz`) because browser clock resolution quantizes sub-millisecond samples. Ratios above 1 favor compilation; results include sample counts and remain sensitive to machine load. These are validation/mount microbenchmarks, not a modeled complete user session. Rejected fixtures cover representative field/cross-field errors rather than every error location. Zod may retain an uncompiled target when unsupported; the preparation cache preserves that fallback.
