## Performance Benchmarks

> Generated on 2026-04-13 with Node v24.14.1

### Node Benchmarks

#### codegen pipeline (walk + generate)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 5.14us | 194.5K | 97226 |
| small (5 fields) | L1 | 8.37us | 119.4K | 59712 |
| small (5 fields) | L2 | 8.34us | 119.9K | 59959 |
| medium (18 fields) | no optimization | 28.95us | 34.5K | 17271 |
| medium (18 fields) | L1 | 72.09us | 13.9K | 6949 |
| medium (18 fields) | L2 | 67.35us | 14.8K | 7424 |
| large (50 fields) | no optimization | 77.74us | 12.9K | 6432 |
| large (50 fields) | L1 | 193.60us | 5.2K | 2594 |
| large (50 fields) | L2 | 185.46us | 5.4K | 2696 |

#### walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 2.80us | 357.3K | 178652 |
| small (5 fields) | L1 | 3.80us | 263.1K | 131559 |
| small (5 fields) | L2 | 4.16us | 240.3K | 120139 |
| medium (18 fields) | no optimization | 18.57us | 53.8K | 26920 |
| medium (18 fields) | L1 | 53.59us | 18.7K | 9330 |
| medium (18 fields) | L2 | 50.30us | 19.9K | 9941 |
| large (50 fields) | no optimization | 54.53us | 18.3K | 9169 |
| large (50 fields) | L1 | 139.80us | 7.2K | 3577 |
| large (50 fields) | L2 | 147.51us | 6.8K | 3390 |

### Browser Benchmarks (Chromium via Playwright)

#### codegen mount (real generated components)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (codegen) | 394.33us | 2.5K | 1269 |
| small (5 fields) | L1 (codegen) | 393.70us | 2.5K | 1270 |
| small (5 fields) | L2 (codegen) | 637.83us | 1.6K | 785 |
| medium (18 fields) | no optimization (codegen) | 1.02ms | 977 | 489 |
| medium (18 fields) | L1 (codegen) | 1.28ms | 779 | 390 |
| medium (18 fields) | L2 (codegen) | 860.21us | 1.2K | 583 |
| large (50 fields) | no optimization (codegen) | 2.83ms | 354 | 177 |
| large (50 fields) | L1 (codegen) | 1.67ms | 597 | 301 |
| large (50 fields) | L2 (codegen) | 1.78ms | 560 | 281 |

#### runtime mount (walk every time)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (runtime) | 497.12us | 2.0K | 1006 |
| small (5 fields) | L1 (runtime) | 637.45us | 1.6K | 785 |
| small (5 fields) | L2 (runtime) | 796.50us | 1.3K | 628 |
| medium (18 fields) | no optimization (runtime) | 1.51ms | 662 | 332 |
| medium (18 fields) | L1 (runtime) | 1.57ms | 636 | 318 |
| medium (18 fields) | L2 (runtime) | 2.35ms | 426 | 213 |
| large (50 fields) | no optimization (runtime) | 2.25ms | 444 | 222 |
| large (50 fields) | L1 (runtime) | 3.29ms | 304 | 153 |
| large (50 fields) | L2 (runtime) | 4.00ms | 250 | 125 |

#### browser render (walk + React mount)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 484.88us | 2.1K | 1032 |
| small (5 fields) | L1 | 572.31us | 1.7K | 874 |
| small (5 fields) | L2 | 460.41us | 2.2K | 1086 |
| medium (18 fields) | no optimization | 2.25ms | 445 | 223 |
| medium (18 fields) | L1 | 2.32ms | 431 | 216 |
| medium (18 fields) | L2 | 1.48ms | 677 | 339 |
| large (50 fields) | no optimization | 3.45ms | 290 | 145 |
| large (50 fields) | L1 | 3.15ms | 318 | 162 |
| large (50 fields) | L2 | 2.67ms | 374 | 188 |

#### browser walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 2.72us | 367.3K | 183628 |
| small (5 fields) | L1 | 3.26us | 306.9K | 153468 |
| small (5 fields) | L2 | 3.62us | 276.5K | 138238 |
| medium (18 fields) | no optimization | 13.58us | 73.6K | 36825 |
| medium (18 fields) | L1 | 36.97us | 27.0K | 13527 |
| medium (18 fields) | L2 | 38.20us | 26.2K | 13090 |
| large (50 fields) | no optimization | 36.72us | 27.2K | 13619 |
| large (50 fields) | L1 | 100.22us | 10.0K | 4989 |
| large (50 fields) | L2 | 104.25us | 9.6K | 4796 |

#### browser keystroke validation (1 field per op)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (zodResolver → full schema) | 233ns | 4.3M | 2145739 |
| small (5 fields) | L1 (single-field zodSchema.safeParse) | 149ns | 6.7M | 3355566 |
| small (5 fields) | L2 (single-field native rule check) | 95ns | 10.5M | 5261619 |
| medium (18 fields) | no optimization (zodResolver → full schema) | 781ns | 1.3M | 640454 |
| medium (18 fields) | L1 (single-field zodSchema.safeParse) | 126ns | 8.0M | 3983766 |
| medium (18 fields) | L2 (single-field native rule check) | 103ns | 9.7M | 4854130 |
| large (50 fields) | no optimization (zodResolver → full schema) | 2.60us | 384.4K | 192216 |
| large (50 fields) | L1 (single-field zodSchema.safeParse) | 191ns | 5.2M | 2612881 |
| large (50 fields) | L2 (single-field native rule check) | 109ns | 9.2M | 4599245 |

#### browser submit validation (full form per op)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (full schema.safeParse) | 275ns | 3.6M | 1818854 |
| small (5 fields) | L1 (N field parses + schemaLite) | 392ns | 2.6M | 1276241 |
| small (5 fields) | L2 (N native checks + schemaLite) | 226ns | 4.4M | 2208907 |
| medium (18 fields) | no optimization (full schema.safeParse) | 908ns | 1.1M | 550897 |
| medium (18 fields) | L1 (N field parses + schemaLite) | 1.98us | 505.9K | 252947 |
| medium (18 fields) | L2 (N native checks + schemaLite) | 1.68us | 594.3K | 297233 |
| large (50 fields) | no optimization (full schema.safeParse) | 2.56us | 390.9K | 195503 |
| large (50 fields) | L1 (N field parses + schemaLite) | 6.49us | 154.0K | 77026 |
| large (50 fields) | L2 (N native checks + schemaLite) | 4.07us | 246.0K | 122984 |

#### browser schemaLite (cross-field effects only)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| medium (18 fields) | L1 schemaLite.safeParse | 502ns | 2.0M | 996431 |
| medium (18 fields) | L2 schemaLite.safeParse | 511ns | 2.0M | 977736 |
| large (50 fields) | L1 schemaLite.safeParse | 1.24us | 805.3K | 402719 |
| large (50 fields) | L2 schemaLite.safeParse | 1.27us | 785.3K | 392732 |

### Codegen vs Runtime (Browser Mount)

> Codegen: pre-walked `FormField[]` imported from a generated module — mount pays only React work.
> Runtime: `useZodForm(schema, ...)` walks + optimizes + mounts on every page load.

#### small (5 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 394.33us | 497.12us | 1.26× |
| L1 | 393.70us | 637.45us | 1.62× |
| L2 | 637.83us | 796.50us | 1.25× |

#### medium (18 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 1.02ms | 1.51ms | 1.48× |
| L1 | 1.28ms | 1.57ms | 1.22× |
| L2 | 860.21us | 2.35ms | 2.73× |

#### large (50 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 2.83ms | 2.25ms | 0.80× |
| L1 | 1.67ms | 3.29ms | 1.96× |
| L2 | 1.78ms | 4.00ms | 2.24× |

### Amortized Session Cost (Browser)

> Total time for a session: `walk + render + K × keystroke + submit`.
> `render` includes walk, so the formula is `render + K × keystroke + submit`.
> onSubmit mode ≈ K=0 (no per-keystroke validation). onChange with light editing ≈ K=20. Heavy editing ≈ K=100.

#### small (5 fields)

| Level | Mount only (K=0) | 20 edits | 100 edits |
|-------|------------------|----------|-----------|
| no optimization | 485.16us | 489.82us | 508.46us |
| L1 | 572.70us | 575.68us | 587.61us |
| L2 | 460.63us | 462.53us | 470.14us |

#### medium (18 fields)

| Level | Mount only (K=0) | 20 edits | 100 edits |
|-------|------------------|----------|-----------|
| no optimization | 2.25ms | 2.27ms | 2.33ms |
| L1 | 2.32ms | 2.32ms | 2.33ms |
| L2 | 1.48ms | 1.48ms | 1.49ms |

#### large (50 fields)

| Level | Mount only (K=0) | 20 edits | 100 edits |
|-------|------------------|----------|-----------|
| no optimization | 3.45ms | 3.50ms | 3.71ms |
| L1 | 3.15ms | 3.16ms | 3.17ms |
| L2 | 2.67ms | 2.68ms | 2.69ms |
