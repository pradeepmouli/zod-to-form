## Performance Benchmarks

> Generated on 2026-10-07 with Node v26.10.0, Zod 4.6.5, darwin/arm64, Apple M4 Pro

Chromium: 151.0.7922.34; React: 19.2.8.

Validation fixtures: small (5 fields); medium (18 root fields, nesting/coercion/collections); large (nested addresses, collections, unions and cross-field refinements). L1/L2 are normalized form-submit validation, not arbitrary-JSON validation. Fresh setup clones the entire schema graph before preparation. Boolean-only validate is reported separately and does not produce messages or parsed output. Ratios above 1 favor compilation; setup includes construction, walking and preparation.

### Node Benchmarks

### Compilation off/on

| Fixture / strategy | Work | Off mean (µs) | On mean (µs) | Off / on |
|---|---|---:|---:|---:|
| validation / small / baseline | input=valid outcome=accepted | 0.118 | 0.054 | 2.17× |
| validation / small / baseline | input=invalid outcome=rejected | 1.004 | 1.071 | 0.94× |
| validation / small / baseline | setup=fresh-schema | 13.110 | 34.993 | 0.37× |
| validation / small / L1 | input=valid outcome=accepted | 0.332 | 0.304 | 1.09× |
| validation / small / L1 | input=invalid outcome=rejected | 1.160 | 1.135 | 1.02× |
| validation / small / L1 | setup=fresh-schema | 18.186 | 43.443 | 0.42× |
| validation / small / L2 | input=valid outcome=accepted | 0.208 | 0.202 | 1.03× |
| validation / small / L2 | input=invalid outcome=rejected | 0.205 | 0.204 | 1.00× |
| validation / small / L2 | setup=fresh-schema | 19.340 | 19.709 | 0.98× |
| boolean-only / small / baseline | input=valid validate | 0.192 | 0.110 | 1.75× |
| boolean-only / small / baseline | input=invalid validate | 0.215 | 0.106 | 2.03× |
| validation / medium / baseline | input=valid outcome=accepted | 0.576 | 0.155 | 3.72× |
| validation / medium / baseline | input=invalid outcome=rejected | 1.812 | 1.553 | 1.17× |
| validation / medium / baseline | setup=fresh-schema | 77.023 | 177.325 | 0.43× |
| validation / medium / L1 | input=valid outcome=accepted | 2.541 | 2.683 | 0.95× |
| validation / medium / L1 | input=invalid outcome=rejected | 4.958 | 3.479 | 1.43× |
| validation / medium / L1 | setup=fresh-schema | 181.610 | 208.952 | 0.87× |
| validation / medium / L2 | input=valid outcome=accepted | 2.210 | 1.925 | 1.15× |
| validation / medium / L2 | input=invalid outcome=rejected | 2.222 | 1.916 | 1.16× |
| validation / medium / L2 | setup=fresh-schema | 110.735 | 114.444 | 0.97× |
| boolean-only / medium / baseline | input=valid validate | 0.647 | 0.200 | 3.23× |
| boolean-only / medium / baseline | input=invalid validate | 0.673 | 0.720 | 0.94× |
| validation / large / baseline | input=valid outcome=accepted | 2.252 | 0.449 | 5.02× |
| validation / large / baseline | input=invalid outcome=rejected | 3.268 | 3.877 | 0.84× |
| validation / large / baseline | setup=fresh-schema | 152.215 | 370.734 | 0.41× |
| validation / large / L1 | input=valid outcome=accepted | 8.671 | 7.179 | 1.21× |
| validation / large / L1 | input=invalid outcome=rejected | 10.087 | 10.358 | 0.97× |
| validation / large / L1 | setup=fresh-schema | 222.302 | 440.322 | 0.50× |
| validation / large / L2 | input=valid outcome=accepted | 6.913 | 5.946 | 1.16× |
| validation / large / L2 | input=invalid outcome=rejected | 7.738 | 8.813 | 0.88× |
| validation / large / L2 | setup=fresh-schema | 244.218 | 253.635 | 0.96× |
| boolean-only / large / baseline | input=valid validate | 2.352 | 0.390 | 6.03× |
| boolean-only / large / baseline | input=invalid validate | 2.239 | 2.669 | 0.84× |
| escape-hatch / refined-string / L1 | input=valid outcome=accepted | 0.162 | 0.102 | 1.59× |
| escape-hatch / refined-string / L1 | input=invalid outcome=rejected | 0.946 | 0.967 | 0.98× |
| escape-hatch / refined-string / L2 | input=valid outcome=accepted | 0.161 | 0.101 | 1.60× |
| escape-hatch / refined-string / L2 | input=invalid outcome=rejected | 0.944 | 0.981 | 0.96× |
#### codegen pipeline (walk + generate)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 6.54us | 152.8K | 76403 |
| small (5 fields) | L1 | 9.76us | 102.4K | 51204 |
| small (5 fields) | L2 | 9.29us | 107.7K | 53832 |
| medium (18 fields) | no optimization | 35.75us | 28.0K | 13986 |
| medium (18 fields) | L1 | 59.84us | 16.7K | 8355 |
| medium (18 fields) | L2 | 58.93us | 17.0K | 8485 |
| large (50 fields) | no optimization | 89.90us | 11.1K | 5562 |
| large (50 fields) | L1 | 153.99us | 6.5K | 3251 |
| large (50 fields) | L2 | 148.21us | 6.7K | 3374 |

#### validation / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 118ns | 8.5M | 4253800 |
| compile=false input=invalid outcome=rejected | 1.00us | 995.5K | 497901 |
| compile=false setup=fresh-schema | 13.11us | 76.3K | 38140 |
| compile=true input=valid outcome=accepted | 54ns | 18.5M | 9242344 |
| compile=true input=invalid outcome=rejected | 1.07us | 933.7K | 468378 |
| compile=true setup=fresh-schema | 34.99us | 28.6K | 14289 |

#### validation / small / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 332ns | 3.0M | 1507316 |
| compile=false input=invalid outcome=rejected | 1.16us | 861.9K | 431738 |
| compile=false setup=fresh-schema | 18.19us | 55.0K | 27493 |
| compile=true input=valid outcome=accepted | 304ns | 3.3M | 1642529 |
| compile=true input=invalid outcome=rejected | 1.13us | 881.4K | 440678 |
| compile=true setup=fresh-schema | 43.44us | 23.0K | 11510 |

#### validation / small / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 208ns | 4.8M | 2407113 |
| compile=false input=invalid outcome=rejected | 205ns | 4.9M | 2443805 |
| compile=false setup=fresh-schema | 19.34us | 51.7K | 25854 |
| compile=true input=valid outcome=accepted | 202ns | 4.9M | 2474844 |
| compile=true input=invalid outcome=rejected | 204ns | 4.9M | 2454622 |
| compile=true setup=fresh-schema | 19.71us | 50.7K | 25369 |

#### boolean-only / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 192ns | 5.2M | 2609285 |
| compile=false input=invalid validate | 215ns | 4.6M | 2324631 |
| compile=true input=valid validate | 110ns | 9.1M | 4552771 |
| compile=true input=invalid validate | 106ns | 9.4M | 4719492 |

#### validation / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 576ns | 1.7M | 868672 |
| compile=false input=invalid outcome=rejected | 1.81us | 551.9K | 275951 |
| compile=false setup=fresh-schema | 77.02us | 13.0K | 6492 |
| compile=true input=valid outcome=accepted | 155ns | 6.5M | 3231447 |
| compile=true input=invalid outcome=rejected | 1.55us | 644.0K | 321994 |
| compile=true setup=fresh-schema | 177.32us | 5.6K | 2820 |

#### validation / medium / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 2.54us | 393.6K | 196776 |
| compile=false input=invalid outcome=rejected | 4.96us | 201.7K | 100851 |
| compile=false setup=fresh-schema | 181.61us | 5.5K | 2858 |
| compile=true input=valid outcome=accepted | 2.68us | 372.8K | 186381 |
| compile=true input=invalid outcome=rejected | 3.48us | 287.4K | 143719 |
| compile=true setup=fresh-schema | 208.95us | 4.8K | 2438 |

#### validation / medium / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 2.21us | 452.5K | 226249 |
| compile=false input=invalid outcome=rejected | 2.22us | 450.0K | 225006 |
| compile=false setup=fresh-schema | 110.73us | 9.0K | 4516 |
| compile=true input=valid outcome=accepted | 1.92us | 519.5K | 259754 |
| compile=true input=invalid outcome=rejected | 1.92us | 522.0K | 260984 |
| compile=true setup=fresh-schema | 114.44us | 8.7K | 4371 |

#### boolean-only / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 647ns | 1.5M | 772866 |
| compile=false input=invalid validate | 673ns | 1.5M | 742399 |
| compile=true input=valid validate | 200ns | 5.0M | 2496275 |
| compile=true input=invalid validate | 720ns | 1.4M | 694237 |

#### validation / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 2.25us | 444.1K | 222047 |
| compile=false input=invalid outcome=rejected | 3.27us | 306.0K | 153003 |
| compile=false setup=fresh-schema | 152.22us | 6.6K | 3285 |
| compile=true input=valid outcome=accepted | 449ns | 2.2M | 1113672 |
| compile=true input=invalid outcome=rejected | 3.88us | 257.9K | 128952 |
| compile=true setup=fresh-schema | 370.73us | 2.7K | 1349 |

#### validation / large / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 8.67us | 115.3K | 57666 |
| compile=false input=invalid outcome=rejected | 10.09us | 99.1K | 49571 |
| compile=false setup=fresh-schema | 222.30us | 4.5K | 2250 |
| compile=true input=valid outcome=accepted | 7.18us | 139.3K | 69652 |
| compile=true input=invalid outcome=rejected | 10.36us | 96.5K | 48273 |
| compile=true setup=fresh-schema | 440.32us | 2.3K | 1136 |

#### validation / large / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 6.91us | 144.6K | 72324 |
| compile=false input=invalid outcome=rejected | 7.74us | 129.2K | 64617 |
| compile=false setup=fresh-schema | 244.22us | 4.1K | 2048 |
| compile=true input=valid outcome=accepted | 5.95us | 168.2K | 84093 |
| compile=true input=invalid outcome=rejected | 8.81us | 113.5K | 56735 |
| compile=true setup=fresh-schema | 253.63us | 3.9K | 1972 |

#### boolean-only / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 2.35us | 425.1K | 212542 |
| compile=false input=invalid validate | 2.24us | 446.7K | 223357 |
| compile=true input=valid validate | 390ns | 2.6M | 1282317 |
| compile=true input=invalid validate | 2.67us | 374.7K | 187371 |

#### escape-hatch / refined-string / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 162ns | 6.2M | 3078165 |
| compile=false input=invalid outcome=rejected | 946ns | 1.1M | 528331 |
| compile=true input=valid outcome=accepted | 102ns | 9.8M | 4901126 |
| compile=true input=invalid outcome=rejected | 967ns | 1.0M | 517265 |

#### escape-hatch / refined-string / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 161ns | 6.2M | 3109359 |
| compile=false input=invalid outcome=rejected | 944ns | 1.1M | 529586 |
| compile=true input=valid outcome=accepted | 101ns | 9.9M | 4961489 |
| compile=true input=invalid outcome=rejected | 981ns | 1.0M | 509702 |

#### walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 3.19us | 313.1K | 156574 |
| small (5 fields) | L1 | 4.16us | 240.3K | 120165 |
| small (5 fields) | L2 | 5.00us | 200.2K | 100099 |
| medium (18 fields) | no optimization | 17.88us | 55.9K | 27958 |
| medium (18 fields) | L1 | 35.12us | 28.5K | 14237 |
| medium (18 fields) | L2 | 46.08us | 21.7K | 10850 |
| large (50 fields) | no optimization | 63.82us | 15.7K | 7835 |
| large (50 fields) | L1 | 127.90us | 7.8K | 3910 |
| large (50 fields) | L2 | 115.96us | 8.6K | 4312 |

### Browser Benchmarks (Chromium via Playwright)

### Compilation off/on

| Fixture / strategy | Work | Off mean (µs) | On mean (µs) | Off / on |
|---|---|---:|---:|---:|
| mount / small / None | path=codegen | 304.878 | 357.429 | 0.85× |
| mount / small / None | path=runtime | 418.661 | 439.069 | 0.95× |
| mount / small / L1 | path=codegen | 372.578 | 532.801 | 0.70× |
| mount / small / L1 | path=runtime | 485.437 | 433.622 | 1.12× |
| mount / small / L2 | path=codegen | 440.617 | 373.488 | 1.18× |
| mount / small / L2 | path=runtime | 464.286 | 576.267 | 0.81× |
| mount / medium / None | path=codegen | 828.146 | 698.047 | 1.19× |
| mount / medium / None | path=runtime | 1379.063 | 1551.393 | 0.89× |
| mount / medium / L1 | path=codegen | 657.162 | 710.496 | 0.92× |
| mount / medium / L1 | path=runtime | 1095.624 | 1356.911 | 0.81× |
| mount / medium / L2 | path=codegen | 910.747 | 838.294 | 1.09× |
| mount / medium / L2 | path=runtime | 1064.255 | 1077.204 | 0.99× |
| mount / large / None | path=codegen | 1551.084 | 2255.856 | 0.69× |
| mount / large / None | path=runtime | 2363.679 | 2273.303 | 1.04× |
| mount / large / L1 | path=codegen | 1382.044 | 2087.500 | 0.66× |
| mount / large / L1 | path=runtime | 2317.593 | 2819.101 | 0.82× |
| mount / large / L2 | path=codegen | 1248.130 | 1593.312 | 0.78× |
| mount / large / L2 | path=runtime | 2882.759 | 2554.592 | 1.13× |
| validation / small / baseline | input=valid outcome=accepted | 0.168 | 0.105 | 1.61× |
| validation / small / baseline | input=invalid outcome=rejected | 2.484 | 2.492 | 1.00× |
| validation / small / baseline | setup=fresh-schema | 6.325 | 21.236 | 0.30× |
| validation / small / L1 | input=valid outcome=accepted | 0.323 | 0.304 | 1.06× |
| validation / small / L1 | input=invalid outcome=rejected | 2.605 | 2.705 | 0.96× |
| validation / small / L1 | setup=fresh-schema | 10.390 | 28.657 | 0.36× |
| validation / small / L2 | input=valid outcome=accepted | 0.211 | 0.205 | 1.03× |
| validation / small / L2 | input=invalid outcome=rejected | 0.202 | 0.203 | 1.00× |
| validation / small / L2 | setup=fresh-schema | 11.248 | 11.603 | 0.97× |
| boolean-only / small / baseline | input=valid validate | 0.161 | 0.078 | 2.05× |
| boolean-only / small / baseline | input=invalid validate | 0.182 | 0.077 | 2.36× |
| validation / medium / baseline | input=valid outcome=accepted | 0.558 | 0.204 | 2.73× |
| validation / medium / baseline | input=invalid outcome=rejected | 3.081 | 3.091 | 1.00× |
| validation / medium / baseline | setup=fresh-schema | 40.456 | 115.948 | 0.35× |
| validation / medium / L1 | input=valid outcome=accepted | 1.955 | 1.717 | 1.14× |
| validation / medium / L1 | input=invalid outcome=rejected | 4.570 | 4.340 | 1.05× |
| validation / medium / L1 | setup=fresh-schema | 59.880 | 128.008 | 0.47× |
| validation / medium / L2 | input=valid outcome=accepted | 1.578 | 1.369 | 1.15× |
| validation / medium / L2 | input=invalid outcome=rejected | 1.571 | 1.390 | 1.13× |
| validation / medium / L2 | setup=fresh-schema | 61.866 | 63.315 | 0.98× |
| boolean-only / medium / baseline | input=valid validate | 0.542 | 0.169 | 3.20× |
| boolean-only / medium / baseline | input=invalid validate | 0.569 | 0.605 | 0.94× |
| validation / large / baseline | input=valid outcome=accepted | 1.977 | 0.518 | 3.82× |
| validation / large / baseline | input=invalid outcome=rejected | 4.538 | 5.094 | 0.89× |
| validation / large / baseline | setup=fresh-schema | 80.454 | 235.452 | 0.34× |
| validation / large / L1 | input=valid outcome=accepted | 5.891 | 4.780 | 1.23× |
| validation / large / L1 | input=invalid outcome=rejected | 8.886 | 9.086 | 0.98× |
| validation / large / L1 | setup=fresh-schema | 133.476 | 284.043 | 0.47× |
| validation / large / L2 | input=valid outcome=accepted | 4.666 | 4.172 | 1.12× |
| validation / large / L2 | input=invalid outcome=rejected | 7.308 | 8.264 | 0.88× |
| validation / large / L2 | setup=fresh-schema | 138.840 | 139.237 | 1.00× |
| boolean-only / large / baseline | input=valid validate | 1.935 | 0.484 | 4.00× |
| boolean-only / large / baseline | input=invalid validate | 1.934 | 2.450 | 0.79× |
| escape-hatch / refined-string / L1 | input=valid outcome=accepted | 0.223 | 0.148 | 1.50× |
| escape-hatch / refined-string / L1 | input=invalid outcome=rejected | 2.450 | 2.394 | 1.02× |
| escape-hatch / refined-string / L2 | input=valid outcome=accepted | 0.221 | 0.150 | 1.47× |
| escape-hatch / refined-string / L2 | input=invalid outcome=rejected | 2.383 | 2.411 | 0.99× |
#### codegen mount (real generated components)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (codegen) | 294.46us | 3.4K | 1698 |
| small (5 fields) | L1 (codegen) | 352.57us | 2.8K | 1419 |
| small (5 fields) | L2 (codegen) | 521.35us | 1.9K | 960 |
| medium (18 fields) | no optimization (codegen) | 848.14us | 1.2K | 590 |
| medium (18 fields) | L1 (codegen) | 1.02ms | 984 | 492 |
| medium (18 fields) | L2 (codegen) | 731.14us | 1.4K | 684 |
| large (50 fields) | no optimization (codegen) | 2.10ms | 475 | 238 |
| large (50 fields) | L1 (codegen) | 1.48ms | 676 | 338 |
| large (50 fields) | L2 (codegen) | 1.37ms | 731 | 366 |

#### runtime mount (walk every time)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (runtime) | 434.03us | 2.3K | 1152 |
| small (5 fields) | L1 (runtime) | 459.41us | 2.2K | 1089 |
| small (5 fields) | L2 (runtime) | 401.20us | 2.5K | 1247 |
| medium (18 fields) | no optimization (runtime) | 1.51ms | 661 | 331 |
| medium (18 fields) | L1 (runtime) | 1.06ms | 941 | 473 |
| medium (18 fields) | L2 (runtime) | 949.34us | 1.1K | 527 |
| large (50 fields) | no optimization (runtime) | 2.85ms | 351 | 176 |
| large (50 fields) | L1 (runtime) | 2.27ms | 440 | 221 |
| large (50 fields) | L2 (runtime) | 2.45ms | 408 | 205 |

#### mount / small / None

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 304.88us | 3.3K | 1640 |
| compile=false path=runtime | 418.66us | 2.4K | 1195 |
| compile=true path=codegen | 357.43us | 2.8K | 1400 |
| compile=true path=runtime | 439.07us | 2.3K | 1139 |

#### mount / small / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 372.58us | 2.7K | 1342 |
| compile=false path=runtime | 485.44us | 2.1K | 1030 |
| compile=true path=codegen | 532.80us | 1.9K | 939 |
| compile=true path=runtime | 433.62us | 2.3K | 1154 |

#### mount / small / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 440.62us | 2.3K | 1135 |
| compile=false path=runtime | 464.29us | 2.2K | 1078 |
| compile=true path=codegen | 373.49us | 2.7K | 1339 |
| compile=true path=runtime | 576.27us | 1.7K | 868 |

#### mount / medium / None

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 828.15us | 1.2K | 604 |
| compile=false path=runtime | 1.38ms | 725 | 363 |
| compile=true path=codegen | 698.05us | 1.4K | 717 |
| compile=true path=runtime | 1.55ms | 645 | 323 |

#### mount / medium / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 657.16us | 1.5K | 761 |
| compile=false path=runtime | 1.10ms | 913 | 457 |
| compile=true path=codegen | 710.50us | 1.4K | 705 |
| compile=true path=runtime | 1.36ms | 737 | 369 |

#### mount / medium / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 910.75us | 1.1K | 549 |
| compile=false path=runtime | 1.06ms | 940 | 470 |
| compile=true path=codegen | 838.29us | 1.2K | 598 |
| compile=true path=runtime | 1.08ms | 928 | 465 |

#### mount / large / None

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 1.55ms | 645 | 323 |
| compile=false path=runtime | 2.36ms | 423 | 212 |
| compile=true path=codegen | 2.26ms | 443 | 222 |
| compile=true path=runtime | 2.27ms | 440 | 221 |

#### mount / large / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 1.38ms | 724 | 362 |
| compile=false path=runtime | 2.32ms | 431 | 216 |
| compile=true path=codegen | 2.09ms | 479 | 240 |
| compile=true path=runtime | 2.82ms | 355 | 178 |

#### mount / large / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 1.25ms | 801 | 401 |
| compile=false path=runtime | 2.88ms | 347 | 174 |
| compile=true path=codegen | 1.59ms | 628 | 314 |
| compile=true path=runtime | 2.55ms | 391 | 196 |

#### browser render (walk + React mount)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 429.96us | 2.3K | 1165 |
| small (5 fields) | L1 | 764.98us | 1.3K | 654 |
| small (5 fields) | L2 | 479.87us | 2.1K | 1043 |
| medium (18 fields) | no optimization | 1.38ms | 722 | 362 |
| medium (18 fields) | L1 | 1.39ms | 721 | 361 |
| medium (18 fields) | L2 | 1.29ms | 775 | 388 |
| large (50 fields) | no optimization | 2.73ms | 367 | 184 |
| large (50 fields) | L1 | 2.23ms | 449 | 225 |
| large (50 fields) | L2 | 2.49ms | 401 | 201 |

#### browser walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 2.76us | 362.2K | 181087 |
| small (5 fields) | L1 | 3.42us | 292.5K | 146250 |
| small (5 fields) | L2 | 4.16us | 240.1K | 120050 |
| medium (18 fields) | no optimization | 13.52us | 74.0K | 36994 |
| medium (18 fields) | L1 | 24.36us | 41.1K | 20531 |
| medium (18 fields) | L2 | 26.84us | 37.3K | 18629 |
| large (50 fields) | no optimization | 38.01us | 26.3K | 13153 |
| large (50 fields) | L1 | 65.99us | 15.2K | 7580 |
| large (50 fields) | L2 | 73.87us | 13.5K | 6770 |

#### validation / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 168ns | 5.9M | 2974245 |
| compile=false input=invalid outcome=rejected | 2.48us | 402.6K | 201295 |
| compile=false setup=fresh-schema | 6.33us | 158.1K | 79051 |
| compile=true input=valid outcome=accepted | 105ns | 9.6M | 4778032 |
| compile=true input=invalid outcome=rejected | 2.49us | 401.2K | 200645 |
| compile=true setup=fresh-schema | 21.24us | 47.1K | 23550 |

#### validation / small / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 323ns | 3.1M | 1549234 |
| compile=false input=invalid outcome=rejected | 2.61us | 383.9K | 191930 |
| compile=false setup=fresh-schema | 10.39us | 96.2K | 48123 |
| compile=true input=valid outcome=accepted | 304ns | 3.3M | 1646609 |
| compile=true input=invalid outcome=rejected | 2.70us | 369.7K | 185122 |
| compile=true setup=fresh-schema | 28.66us | 34.9K | 17448 |

#### validation / small / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 211ns | 4.7M | 2369313 |
| compile=false input=invalid outcome=rejected | 202ns | 5.0M | 2475468 |
| compile=false setup=fresh-schema | 11.25us | 88.9K | 44451 |
| compile=true input=valid outcome=accepted | 205ns | 4.9M | 2435818 |
| compile=true input=invalid outcome=rejected | 203ns | 4.9M | 2464188 |
| compile=true setup=fresh-schema | 11.60us | 86.2K | 43094 |

#### boolean-only / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 161ns | 6.2M | 3108472 |
| compile=false input=invalid validate | 182ns | 5.5M | 2744971 |
| compile=true input=valid validate | 78ns | 12.8M | 6387095 |
| compile=true input=invalid validate | 77ns | 13.0M | 6479270 |

#### validation / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 558ns | 1.8M | 896434 |
| compile=false input=invalid outcome=rejected | 3.08us | 324.5K | 162296 |
| compile=false setup=fresh-schema | 40.46us | 24.7K | 12401 |
| compile=true input=valid outcome=accepted | 204ns | 4.9M | 2447818 |
| compile=true input=invalid outcome=rejected | 3.09us | 323.5K | 161772 |
| compile=true setup=fresh-schema | 115.95us | 8.6K | 4314 |

#### validation / medium / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 1.96us | 511.4K | 255692 |
| compile=false input=invalid outcome=rejected | 4.57us | 218.8K | 109435 |
| compile=false setup=fresh-schema | 59.88us | 16.7K | 8350 |
| compile=true input=valid outcome=accepted | 1.72us | 582.3K | 291229 |
| compile=true input=invalid outcome=rejected | 4.34us | 230.4K | 115230 |
| compile=true setup=fresh-schema | 128.01us | 7.8K | 3906 |

#### validation / medium / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 1.58us | 633.9K | 316927 |
| compile=false input=invalid outcome=rejected | 1.57us | 636.5K | 318297 |
| compile=false setup=fresh-schema | 61.87us | 16.2K | 8082 |
| compile=true input=valid outcome=accepted | 1.37us | 730.3K | 365169 |
| compile=true input=invalid outcome=rejected | 1.39us | 719.2K | 359609 |
| compile=true setup=fresh-schema | 63.32us | 15.8K | 7897 |

#### boolean-only / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 542ns | 1.8M | 922803 |
| compile=false input=invalid validate | 569ns | 1.8M | 878265 |
| compile=true input=valid validate | 169ns | 5.9M | 2956728 |
| compile=true input=invalid validate | 605ns | 1.7M | 826221 |

#### validation / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 1.98us | 505.8K | 252881 |
| compile=false input=invalid outcome=rejected | 4.54us | 220.4K | 110201 |
| compile=false setup=fresh-schema | 80.45us | 12.4K | 6216 |
| compile=true input=valid outcome=accepted | 518ns | 1.9M | 966315 |
| compile=true input=invalid outcome=rejected | 5.09us | 196.3K | 98174 |
| compile=true setup=fresh-schema | 235.45us | 4.2K | 2124 |

#### validation / large / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 5.89us | 169.8K | 84899 |
| compile=false input=invalid outcome=rejected | 8.89us | 112.5K | 56277 |
| compile=false setup=fresh-schema | 133.48us | 7.5K | 3746 |
| compile=true input=valid outcome=accepted | 4.78us | 209.2K | 104596 |
| compile=true input=invalid outcome=rejected | 9.09us | 110.1K | 55027 |
| compile=true setup=fresh-schema | 284.04us | 3.5K | 1761 |

#### validation / large / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 4.67us | 214.3K | 107152 |
| compile=false input=invalid outcome=rejected | 7.31us | 136.8K | 68435 |
| compile=false setup=fresh-schema | 138.84us | 7.2K | 3602 |
| compile=true input=valid outcome=accepted | 4.17us | 239.7K | 119847 |
| compile=true input=invalid outcome=rejected | 8.26us | 121.0K | 60506 |
| compile=true setup=fresh-schema | 139.24us | 7.2K | 3591 |

#### boolean-only / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 1.93us | 516.9K | 258509 |
| compile=false input=invalid validate | 1.93us | 517.1K | 258602 |
| compile=true input=valid validate | 484ns | 2.1M | 1034228 |
| compile=true input=invalid validate | 2.45us | 408.1K | 204081 |

#### escape-hatch / refined-string / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 223ns | 4.5M | 2243808 |
| compile=false input=invalid outcome=rejected | 2.45us | 408.2K | 204112 |
| compile=true input=valid outcome=accepted | 148ns | 6.7M | 3370147 |
| compile=true input=invalid outcome=rejected | 2.39us | 417.8K | 208892 |

#### escape-hatch / refined-string / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 221ns | 4.5M | 2264211 |
| compile=false input=invalid outcome=rejected | 2.38us | 419.6K | 209776 |
| compile=true input=valid outcome=accepted | 150ns | 6.7M | 3338534 |
| compile=true input=invalid outcome=rejected | 2.41us | 414.7K | 207360 |

### Codegen vs Runtime (Browser Mount)

> Codegen: pre-walked `FormField[]` imported from a generated module — mount pays only React work.
> Runtime: `useZodForm(schema, ...)` walks + optimizes + mounts on every page load.

#### small (5 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 294.46us | 434.03us | 1.47× |
| L1 | 352.57us | 459.41us | 1.30× |
| L2 | 521.35us | 401.20us | 0.77× |

#### medium (18 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 848.14us | 1.51ms | 1.78× |
| L1 | 1.02ms | 1.06ms | 1.05× |
| L2 | 731.14us | 949.34us | 1.30× |

#### large (50 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 2.10ms | 2.85ms | 1.35× |
| L1 | 1.48ms | 2.27ms | 1.53× |
| L2 | 1.37ms | 2.45ms | 1.79× |
