## Performance Benchmarks

> Generated on 2026-04-13 with Node v24.14.1

### Node Benchmarks

#### codegen pipeline (walk + generate)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 5.15us | 194.3K | 97136 |
| small (5 fields) | L1 | 7.83us | 127.7K | 63868 |
| small (5 fields) | L2 | 8.18us | 122.3K | 61164 |
| medium (18 fields) | no optimization | 29.03us | 34.5K | 17226 |
| medium (18 fields) | L1 | 69.59us | 14.4K | 7186 |
| medium (18 fields) | L2 | 71.39us | 14.0K | 7004 |
| large (50 fields) | no optimization | 74.92us | 13.3K | 6674 |
| large (50 fields) | L1 | 173.88us | 5.8K | 2876 |
| large (50 fields) | L2 | 182.54us | 5.5K | 2742 |

#### walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 2.78us | 359.1K | 179539 |
| small (5 fields) | L1 | 3.82us | 261.7K | 130867 |
| small (5 fields) | L2 | 4.00us | 250.3K | 125145 |
| medium (18 fields) | no optimization | 17.41us | 57.4K | 28720 |
| medium (18 fields) | L1 | 53.18us | 18.8K | 9403 |
| medium (18 fields) | L2 | 49.02us | 20.4K | 10201 |
| large (50 fields) | no optimization | 52.78us | 18.9K | 9473 |
| large (50 fields) | L1 | 139.09us | 7.2K | 3595 |
| large (50 fields) | L2 | 143.49us | 7.0K | 3485 |

### Browser Benchmarks (Chromium via Playwright)

#### browser render (walk + React mount)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 438.00us | 2.3K | 1142 |
| small (5 fields) | L1 | 670.64us | 1.5K | 746 |
| small (5 fields) | L2 | 588.47us | 1.7K | 850 |
| medium (18 fields) | no optimization | 2.02ms | 495 | 249 |
| medium (18 fields) | L1 | 2.93ms | 341 | 171 |
| medium (18 fields) | L2 | 1.54ms | 648 | 324 |
| large (50 fields) | no optimization | 2.86ms | 350 | 175 |
| large (50 fields) | L1 | 4.45ms | 225 | 113 |
| large (50 fields) | L2 | 2.86ms | 350 | 175 |

#### browser walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 2.52us | 396.5K | 198274 |
| small (5 fields) | L1 | 3.28us | 304.5K | 152274 |
| small (5 fields) | L2 | 3.69us | 271.0K | 135510 |
| medium (18 fields) | no optimization | 13.43us | 74.5K | 37239 |
| medium (18 fields) | L1 | 39.82us | 25.1K | 12556 |
| medium (18 fields) | L2 | 43.26us | 23.1K | 11558 |
| large (50 fields) | no optimization | 38.95us | 25.7K | 12836 |
| large (50 fields) | L1 | 112.79us | 8.9K | 4434 |
| large (50 fields) | L2 | 117.06us | 8.5K | 4272 |

#### browser keystroke validation (1 field per op)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (zodResolver → full schema) | 216ns | 4.6M | 2312365 |
| small (5 fields) | L1 (single-field zodSchema.safeParse) | 151ns | 6.6M | 3316725 |
| small (5 fields) | L2 (single-field native rule check) | 92ns | 10.9M | 5451572 |
| medium (18 fields) | no optimization (zodResolver → full schema) | 840ns | 1.2M | 595296 |
| medium (18 fields) | L1 (single-field zodSchema.safeParse) | 117ns | 8.5M | 4264891 |
| medium (18 fields) | L2 (single-field native rule check) | 106ns | 9.4M | 4721518 |
| large (50 fields) | no optimization (zodResolver → full schema) | 2.60us | 384.9K | 192470 |
| large (50 fields) | L1 (single-field zodSchema.safeParse) | 193ns | 5.2M | 2591265 |
| large (50 fields) | L2 (single-field native rule check) | 111ns | 9.0M | 4494190 |

#### browser submit validation (full form per op)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (full schema.safeParse) | 275ns | 3.6M | 1820254 |
| small (5 fields) | L1 (N field parses + schemaLite) | 409ns | 2.4M | 1221564 |
| small (5 fields) | L2 (N native checks + schemaLite) | 247ns | 4.1M | 2025800 |
| medium (18 fields) | no optimization (full schema.safeParse) | 931ns | 1.1M | 536821 |
| medium (18 fields) | L1 (N field parses + schemaLite) | 2.11us | 473.5K | 236740 |
| medium (18 fields) | L2 (N native checks + schemaLite) | 1.86us | 536.7K | 268399 |
| large (50 fields) | no optimization (full schema.safeParse) | 2.56us | 390.2K | 195155 |
| large (50 fields) | L1 (N field parses + schemaLite) | 6.83us | 146.5K | 73261 |
| large (50 fields) | L2 (N native checks + schemaLite) | 4.53us | 220.6K | 110279 |

#### browser schemaLite (cross-field effects only)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| medium (18 fields) | L1 schemaLite.safeParse | 498ns | 2.0M | 1005143 |
| medium (18 fields) | L2 schemaLite.safeParse | 520ns | 1.9M | 962630 |
| large (50 fields) | L1 schemaLite.safeParse | 1.28us | 783.5K | 391775 |
| large (50 fields) | L2 schemaLite.safeParse | 1.27us | 785.7K | 392861 |

### Amortized Session Cost (Browser)

> Total time for a session: `walk + render + K × keystroke + submit`.
> `render` includes walk, so the formula is `render + K × keystroke + submit`.
> onSubmit mode ≈ K=0 (no per-keystroke validation). onChange with light editing ≈ K=20. Heavy editing ≈ K=100.

#### small (5 fields)

| Level | Mount only (K=0) | 20 edits | 100 edits |
|-------|------------------|----------|-----------|
| no optimization | 438.28us | 442.60us | 459.91us |
| L1 | 671.05us | 674.07us | 686.13us |
| L2 | 588.72us | 590.55us | 597.89us |

#### medium (18 fields)

| Level | Mount only (K=0) | 20 edits | 100 edits |
|-------|------------------|----------|-----------|
| no optimization | 2.02ms | 2.04ms | 2.10ms |
| L1 | 2.93ms | 2.93ms | 2.94ms |
| L2 | 1.55ms | 1.55ms | 1.56ms |

#### large (50 fields)

| Level | Mount only (K=0) | 20 edits | 100 edits |
|-------|------------------|----------|-----------|
| no optimization | 2.86ms | 2.91ms | 3.12ms |
| L1 | 4.46ms | 4.46ms | 4.48ms |
| L2 | 2.87ms | 2.87ms | 2.88ms |
