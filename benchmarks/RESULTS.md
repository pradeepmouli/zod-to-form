## Performance Benchmarks

> Generated on 2026-10-07 with Node v26.10.0, Zod 4.6.5, darwin/arm64, Apple M4 Pro

Chromium: 153.0.8010.12; React: 19.2.8.

Validation fixtures: small (5 fields); medium (18 root fields, nesting/coercion/collections); large (nested addresses, collections, unions and cross-field refinements). L1/L2 are normalized form-submit validation, not arbitrary-JSON validation. Fresh setup clones the entire schema graph before preparation. Boolean-only validate is reported separately and does not produce messages or parsed output. Ratios above 1 favor compilation; setup includes construction, walking and preparation.

### Node Benchmarks

### Compilation off/on

| Fixture / strategy | Work | Off mean (µs) | On mean (µs) | Off / on |
|---|---|---:|---:|---:|
| validation / small / baseline | input=valid outcome=accepted | 0.137 | 0.064 | 2.14× |
| validation / small / baseline | input=invalid outcome=rejected | 0.981 | 1.034 | 0.95× |
| validation / small / baseline | setup=fresh-schema | 12.112 | 34.577 | 0.35× |
| validation / small / L1 | input=valid outcome=accepted | 0.338 | 0.327 | 1.03× |
| validation / small / L1 | input=invalid outcome=rejected | 1.158 | 1.155 | 1.00× |
| validation / small / L1 | setup=fresh-schema | 19.816 | 46.408 | 0.43× |
| validation / small / L2 | input=valid outcome=accepted | 0.222 | 0.576 | 0.38× |
| validation / small / L2 | input=invalid outcome=rejected | 0.322 | 0.469 | 0.69× |
| validation / small / L2 | setup=fresh-schema | 55.752 | 52.566 | 1.06× |
| boolean-only / small / baseline | input=valid validate | 0.502 | 0.251 | 2.00× |
| boolean-only / small / baseline | input=invalid validate | 0.579 | 0.349 | 1.66× |
| validation / medium / baseline | input=valid outcome=accepted | 0.622 | 0.181 | 3.43× |
| validation / medium / baseline | input=invalid outcome=rejected | 1.563 | 1.734 | 0.90× |
| validation / medium / baseline | setup=fresh-schema | 75.797 | 187.776 | 0.40× |
| validation / medium / L1 | input=valid outcome=accepted | 2.469 | 2.229 | 1.11× |
| validation / medium / L1 | input=invalid outcome=rejected | 3.599 | 3.299 | 1.09× |
| validation / medium / L1 | setup=fresh-schema | 107.271 | 197.706 | 0.54× |
| validation / medium / L2 | input=valid outcome=accepted | 2.031 | 1.753 | 1.16× |
| validation / medium / L2 | input=invalid outcome=rejected | 2.019 | 1.735 | 1.16× |
| validation / medium / L2 | setup=fresh-schema | 107.733 | 108.350 | 0.99× |
| boolean-only / medium / baseline | input=valid validate | 0.622 | 0.186 | 3.34× |
| boolean-only / medium / baseline | input=invalid validate | 0.645 | 0.706 | 0.91× |
| validation / large / baseline | input=valid outcome=accepted | 2.362 | 0.478 | 4.94× |
| validation / large / baseline | input=invalid outcome=rejected | 3.534 | 4.129 | 0.86× |
| validation / large / baseline | setup=fresh-schema | 158.894 | 365.884 | 0.43× |
| validation / large / L1 | input=valid outcome=accepted | 8.677 | 6.641 | 1.31× |
| validation / large / L1 | input=invalid outcome=rejected | 10.124 | 10.156 | 1.00× |
| validation / large / L1 | setup=fresh-schema | 237.094 | 486.586 | 0.49× |
| validation / large / L2 | input=valid outcome=accepted | 6.300 | 5.778 | 1.09× |
| validation / large / L2 | input=invalid outcome=rejected | 7.688 | 8.703 | 0.88× |
| validation / large / L2 | setup=fresh-schema | 252.388 | 283.664 | 0.89× |
| boolean-only / large / baseline | input=valid validate | 2.376 | 0.531 | 4.48× |
| boolean-only / large / baseline | input=invalid validate | 2.410 | 4.140 | 0.58× |
| escape-hatch / refined-string / L1 | input=valid outcome=accepted | 0.156 | 0.091 | 1.72× |
| escape-hatch / refined-string / L1 | input=invalid outcome=rejected | 1.047 | 0.957 | 1.09× |
| escape-hatch / refined-string / L2 | input=valid outcome=accepted | 0.150 | 0.181 | 0.83× |
| escape-hatch / refined-string / L2 | input=invalid outcome=rejected | 1.876 | 2.346 | 0.80× |
#### codegen pipeline (walk + generate)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 6.68us | 149.8K | 29952 |
| small (5 fields) | L1 | 9.56us | 104.6K | 20921 |
| small (5 fields) | L2 | 10.25us | 97.6K | 19511 |
| medium (18 fields) | no optimization | 37.00us | 27.0K | 5406 |
| medium (18 fields) | L1 | 64.00us | 15.6K | 3125 |
| medium (18 fields) | L2 | 63.25us | 15.8K | 3163 |
| large (50 fields) | no optimization | 91.47us | 10.9K | 2187 |
| large (50 fields) | L1 | 166.33us | 6.0K | 1203 |
| large (50 fields) | L2 | 162.64us | 6.1K | 1230 |

#### validation / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 137ns | 7.3M | 1459811 |
| compile=false input=invalid outcome=rejected | 981ns | 1.0M | 203858 |
| compile=false setup=fresh-schema | 12.11us | 82.6K | 16513 |
| compile=true input=valid outcome=accepted | 64ns | 15.6M | 3123375 |
| compile=true input=invalid outcome=rejected | 1.03us | 967.1K | 193411 |
| compile=true setup=fresh-schema | 34.58us | 28.9K | 5785 |

#### validation / small / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 338ns | 3.0M | 592313 |
| compile=false input=invalid outcome=rejected | 1.16us | 863.3K | 172670 |
| compile=false setup=fresh-schema | 19.82us | 50.5K | 10093 |
| compile=true input=valid outcome=accepted | 327ns | 3.1M | 612326 |
| compile=true input=invalid outcome=rejected | 1.16us | 865.6K | 173129 |
| compile=true setup=fresh-schema | 46.41us | 21.5K | 4310 |

#### validation / small / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 222ns | 4.5M | 901719 |
| compile=false input=invalid outcome=rejected | 322ns | 3.1M | 621531 |
| compile=false setup=fresh-schema | 55.75us | 17.9K | 3588 |
| compile=true input=valid outcome=accepted | 576ns | 1.7M | 347136 |
| compile=true input=invalid outcome=rejected | 469ns | 2.1M | 426636 |
| compile=true setup=fresh-schema | 52.57us | 19.0K | 3819 |

#### boolean-only / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 502ns | 2.0M | 398050 |
| compile=false input=invalid validate | 579ns | 1.7M | 348733 |
| compile=true input=valid validate | 251ns | 4.0M | 804898 |
| compile=true input=invalid validate | 349ns | 2.9M | 573561 |

#### validation / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 622ns | 1.6M | 321650 |
| compile=false input=invalid outcome=rejected | 1.56us | 639.7K | 127935 |
| compile=false setup=fresh-schema | 75.80us | 13.2K | 2639 |
| compile=true input=valid outcome=accepted | 181ns | 5.5M | 1103652 |
| compile=true input=invalid outcome=rejected | 1.73us | 576.7K | 115348 |
| compile=true setup=fresh-schema | 187.78us | 5.3K | 1066 |

#### validation / medium / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 2.47us | 405.0K | 81000 |
| compile=false input=invalid outcome=rejected | 3.60us | 277.9K | 55579 |
| compile=false setup=fresh-schema | 107.27us | 9.3K | 1873 |
| compile=true input=valid outcome=accepted | 2.23us | 448.6K | 89720 |
| compile=true input=invalid outcome=rejected | 3.30us | 303.1K | 60617 |
| compile=true setup=fresh-schema | 197.71us | 5.1K | 1012 |

#### validation / medium / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 2.03us | 492.3K | 98470 |
| compile=false input=invalid outcome=rejected | 2.02us | 495.4K | 99084 |
| compile=false setup=fresh-schema | 107.73us | 9.3K | 1857 |
| compile=true input=valid outcome=accepted | 1.75us | 570.5K | 114106 |
| compile=true input=invalid outcome=rejected | 1.74us | 576.3K | 115266 |
| compile=true setup=fresh-schema | 108.35us | 9.2K | 1846 |

#### boolean-only / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 622ns | 1.6M | 321439 |
| compile=false input=invalid validate | 645ns | 1.5M | 309954 |
| compile=true input=valid validate | 186ns | 5.4M | 1074793 |
| compile=true input=invalid validate | 706ns | 1.4M | 283344 |

#### validation / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 2.36us | 423.3K | 84664 |
| compile=false input=invalid outcome=rejected | 3.53us | 283.0K | 56592 |
| compile=false setup=fresh-schema | 158.89us | 6.3K | 1273 |
| compile=true input=valid outcome=accepted | 478ns | 2.1M | 420838 |
| compile=true input=invalid outcome=rejected | 4.13us | 242.2K | 48435 |
| compile=true setup=fresh-schema | 365.88us | 2.7K | 547 |

#### validation / large / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 8.68us | 115.2K | 23050 |
| compile=false input=invalid outcome=rejected | 10.12us | 98.8K | 19756 |
| compile=false setup=fresh-schema | 237.09us | 4.2K | 844 |
| compile=true input=valid outcome=accepted | 6.64us | 150.6K | 30116 |
| compile=true input=invalid outcome=rejected | 10.16us | 98.5K | 19694 |
| compile=true setup=fresh-schema | 486.59us | 2.1K | 418 |

#### validation / large / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 6.30us | 158.7K | 31745 |
| compile=false input=invalid outcome=rejected | 7.69us | 130.1K | 26016 |
| compile=false setup=fresh-schema | 252.39us | 4.0K | 793 |
| compile=true input=valid outcome=accepted | 5.78us | 173.1K | 34615 |
| compile=true input=invalid outcome=rejected | 8.70us | 114.9K | 22982 |
| compile=true setup=fresh-schema | 283.66us | 3.5K | 707 |

#### boolean-only / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 2.38us | 420.8K | 84169 |
| compile=false input=invalid validate | 2.41us | 415.0K | 82991 |
| compile=true input=valid validate | 531ns | 1.9M | 376851 |
| compile=true input=invalid validate | 4.14us | 241.5K | 48308 |

#### escape-hatch / refined-string / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 156ns | 6.4M | 1285994 |
| compile=false input=invalid outcome=rejected | 1.05us | 955.0K | 191002 |
| compile=true input=valid outcome=accepted | 91ns | 11.0M | 2205765 |
| compile=true input=invalid outcome=rejected | 957ns | 1.0M | 209043 |

#### escape-hatch / refined-string / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 150ns | 6.7M | 1335970 |
| compile=false input=invalid outcome=rejected | 1.88us | 533.2K | 106643 |
| compile=true input=valid outcome=accepted | 181ns | 5.5M | 1105545 |
| compile=true input=invalid outcome=rejected | 2.35us | 426.3K | 86033 |

#### walker / small (5 fields)

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| no optimization | 8.51us | 117.6K | 23512 |
| L1 | 11.78us | 84.9K | 17113 |
| L2 | 16.75us | 59.7K | 11946 |

#### walker / medium (18 fields)

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| no optimization | 45.86us | 21.8K | 4362 |
| L1 | 83.94us | 11.9K | 2383 |
| L2 | 106.19us | 9.4K | 1891 |

#### walker / large (50 fields)

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| no optimization | 141.68us | 7.1K | 1412 |
| L1 | 161.99us | 6.2K | 1235 |
| L2 | 112.79us | 8.9K | 1774 |

### Browser Benchmarks (Chromium via Playwright)

### Compilation off/on

| Fixture / strategy | Work | Off mean (µs) | On mean (µs) | Off / on |
|---|---|---:|---:|---:|
| mount / small / None | path=codegen | 411.934 | 434.783 | 0.95× |
| mount / small / None | path=runtime | 448.322 | 348.000 | 1.29× |
| mount / small / L1 | path=codegen | 308.642 | 585.088 | 0.53× |
| mount / small / L1 | path=runtime | 369.061 | 406.504 | 0.91× |
| mount / small / L2 | path=codegen | 435.730 | 592.604 | 0.74× |
| mount / small / L2 | path=runtime | 423.256 | 518.135 | 0.82× |
| mount / medium / None | path=codegen | 758.333 | 1369.863 | 0.55× |
| mount / medium / None | path=runtime | 1312.418 | 1007.000 | 1.30× |
| mount / medium / L1 | path=codegen | 505.303 | 983.824 | 0.51× |
| mount / medium / L1 | path=runtime | 1724.138 | 900.901 | 1.91× |
| mount / medium / L2 | path=codegen | 656.209 | 959.809 | 0.68× |
| mount / medium / L2 | path=runtime | 1600.000 | 1460.584 | 1.10× |
| mount / large / None | path=codegen | 1299.351 | 1489.630 | 0.87× |
| mount / large / None | path=runtime | 1998.020 | 2961.765 | 0.67× |
| mount / large / L1 | path=codegen | 1157.803 | 1470.073 | 0.79× |
| mount / large / L1 | path=runtime | 2286.364 | 3642.188 | 0.63× |
| mount / large / L2 | path=codegen | 1000.000 | 1548.462 | 0.65× |
| mount / large / L2 | path=runtime | 2441.463 | 2907.246 | 0.84× |
| validation / small / baseline | input=valid outcome=accepted | 0.110 | 0.054 | 2.05× |
| validation / small / baseline | input=invalid outcome=rejected | 2.577 | 2.768 | 0.93× |
| validation / small / baseline | setup=fresh-schema | 6.141 | 21.097 | 0.29× |
| validation / small / L1 | input=valid outcome=accepted | 0.279 | 0.245 | 1.14× |
| validation / small / L1 | input=invalid outcome=rejected | 2.885 | 2.885 | 1.00× |
| validation / small / L1 | setup=fresh-schema | 10.407 | 27.300 | 0.38× |
| validation / small / L2 | input=valid outcome=accepted | 0.151 | 0.148 | 1.02× |
| validation / small / L2 | input=invalid outcome=rejected | 0.146 | 0.149 | 0.98× |
| validation / small / L2 | setup=fresh-schema | 11.344 | 11.575 | 0.98× |
| boolean-only / small / baseline | input=valid validate | 0.110 | 0.040 | 2.72× |
| boolean-only / small / baseline | input=invalid validate | 0.131 | 0.040 | 3.30× |
| validation / medium / baseline | input=valid outcome=accepted | 0.482 | 0.148 | 3.25× |
| validation / medium / baseline | input=invalid outcome=rejected | 3.285 | 3.351 | 0.98× |
| validation / medium / baseline | setup=fresh-schema | 40.778 | 120.120 | 0.34× |
| validation / medium / L1 | input=valid outcome=accepted | 1.840 | 1.682 | 1.09× |
| validation / medium / L1 | input=invalid outcome=rejected | 4.736 | 4.478 | 1.06× |
| validation / medium / L1 | setup=fresh-schema | 58.651 | 128.516 | 0.46× |
| validation / medium / L2 | input=valid outcome=accepted | 1.537 | 1.320 | 1.16× |
| validation / medium / L2 | input=invalid outcome=rejected | 1.538 | 1.303 | 1.18× |
| validation / medium / L2 | setup=fresh-schema | 62.008 | 62.150 | 1.00× |
| boolean-only / medium / baseline | input=valid validate | 0.455 | 0.105 | 4.33× |
| boolean-only / medium / baseline | input=invalid validate | 0.482 | 0.521 | 0.93× |
| validation / large / baseline | input=valid outcome=accepted | 1.920 | 0.427 | 4.50× |
| validation / large / baseline | input=invalid outcome=rejected | 4.982 | 5.595 | 0.89× |
| validation / large / baseline | setup=fresh-schema | 81.408 | 230.681 | 0.35× |
| validation / large / L1 | input=valid outcome=accepted | 5.837 | 4.636 | 1.26× |
| validation / large / L1 | input=invalid outcome=rejected | 9.591 | 9.658 | 0.99× |
| validation / large / L1 | setup=fresh-schema | 129.598 | 278.830 | 0.46× |
| validation / large / L2 | input=valid outcome=accepted | 4.576 | 3.992 | 1.15× |
| validation / large / L2 | input=invalid outcome=rejected | 7.684 | 8.443 | 0.91× |
| validation / large / L2 | setup=fresh-schema | 141.537 | 138.144 | 1.02× |
| boolean-only / large / baseline | input=valid validate | 1.898 | 0.419 | 4.53× |
| boolean-only / large / baseline | input=invalid validate | 1.921 | 2.375 | 0.81× |
| escape-hatch / refined-string / L1 | input=valid outcome=accepted | 0.165 | 0.100 | 1.64× |
| escape-hatch / refined-string / L1 | input=invalid outcome=rejected | 2.726 | 2.712 | 1.01× |
| escape-hatch / refined-string / L2 | input=valid outcome=accepted | 0.163 | 0.095 | 1.72× |
| escape-hatch / refined-string / L2 | input=invalid outcome=rejected | 2.615 | 2.653 | 0.99× |
#### codegen mount (real generated components)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (codegen) | 242.84us | 4.1K | 824 |
| small (5 fields) | L1 (codegen) | 544.02us | 1.8K | 368 |
| small (5 fields) | L2 (codegen) | 354.96us | 2.8K | 564 |
| medium (18 fields) | no optimization (codegen) | 2.17ms | 460 | 92 |
| medium (18 fields) | L1 (codegen) | 886.28us | 1.1K | 226 |
| medium (18 fields) | L2 (codegen) | 1.06ms | 944 | 190 |
| large (50 fields) | no optimization (codegen) | 2.33ms | 429 | 86 |
| large (50 fields) | L1 (codegen) | 1.29ms | 772 | 156 |
| large (50 fields) | L2 (codegen) | 1.68ms | 594 | 119 |

#### runtime mount (walk every time)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization (runtime) | 439.52us | 2.3K | 458 |
| small (5 fields) | L1 (runtime) | 606.97us | 1.6K | 330 |
| small (5 fields) | L2 (runtime) | 349.21us | 2.9K | 573 |
| medium (18 fields) | no optimization (runtime) | 1.26ms | 795 | 159 |
| medium (18 fields) | L1 (runtime) | 1.55ms | 645 | 130 |
| medium (18 fields) | L2 (runtime) | 1.11ms | 901 | 181 |
| large (50 fields) | no optimization (runtime) | 2.43ms | 412 | 83 |
| large (50 fields) | L1 (runtime) | 2.91ms | 344 | 69 |
| large (50 fields) | L2 (runtime) | 2.18ms | 458 | 92 |

#### mount / small / None

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 411.93us | 2.4K | 486 |
| compile=false path=runtime | 448.32us | 2.2K | 447 |
| compile=true path=codegen | 434.78us | 2.3K | 460 |
| compile=true path=runtime | 348.00us | 2.9K | 575 |

#### mount / small / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 308.64us | 3.2K | 648 |
| compile=false path=runtime | 369.06us | 2.7K | 543 |
| compile=true path=codegen | 585.09us | 1.7K | 342 |
| compile=true path=runtime | 406.50us | 2.5K | 492 |

#### mount / small / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 435.73us | 2.3K | 459 |
| compile=false path=runtime | 423.26us | 2.4K | 473 |
| compile=true path=codegen | 592.60us | 1.7K | 338 |
| compile=true path=runtime | 518.13us | 1.9K | 386 |

#### mount / medium / None

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 758.33us | 1.3K | 264 |
| compile=false path=runtime | 1.31ms | 762 | 153 |
| compile=true path=codegen | 1.37ms | 730 | 146 |
| compile=true path=runtime | 1.01ms | 993 | 200 |

#### mount / medium / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 505.30us | 2.0K | 396 |
| compile=false path=runtime | 1.72ms | 580 | 116 |
| compile=true path=codegen | 983.82us | 1.0K | 204 |
| compile=true path=runtime | 900.90us | 1.1K | 222 |

#### mount / medium / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 656.21us | 1.5K | 306 |
| compile=false path=runtime | 1.60ms | 625 | 126 |
| compile=true path=codegen | 959.81us | 1.0K | 209 |
| compile=true path=runtime | 1.46ms | 685 | 137 |

#### mount / large / None

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 1.30ms | 770 | 154 |
| compile=false path=runtime | 2.00ms | 500 | 101 |
| compile=true path=codegen | 1.49ms | 671 | 135 |
| compile=true path=runtime | 2.96ms | 338 | 68 |

#### mount / large / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 1.16ms | 864 | 173 |
| compile=false path=runtime | 2.29ms | 437 | 88 |
| compile=true path=codegen | 1.47ms | 680 | 137 |
| compile=true path=runtime | 3.64ms | 275 | 64 |

#### mount / large / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false path=codegen | 1.00ms | 1000 | 201 |
| compile=false path=runtime | 2.44ms | 410 | 82 |
| compile=true path=codegen | 1.55ms | 646 | 130 |
| compile=true path=runtime | 2.91ms | 344 | 69 |

#### browser render (walk + React mount)

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 408.37us | 2.4K | 490 |
| small (5 fields) | L1 | 431.03us | 2.3K | 464 |
| small (5 fields) | L2 | 374.72us | 2.7K | 534 |
| medium (18 fields) | no optimization | 1.59ms | 630 | 127 |
| medium (18 fields) | L1 | 1.25ms | 802 | 161 |
| medium (18 fields) | L2 | 1.16ms | 862 | 173 |
| large (50 fields) | no optimization | 2.98ms | 336 | 68 |
| large (50 fields) | L1 | 2.28ms | 439 | 88 |
| large (50 fields) | L2 | 3.33ms | 300 | 64 |

#### browser walkSchema

| Schema | Level | Mean | ops/sec | Samples |
|--------|-------|------|---------|---------|
| small (5 fields) | no optimization | 2.73us | 366.0K | 73204 |
| small (5 fields) | L1 | 3.40us | 294.0K | 58794 |
| small (5 fields) | L2 | 4.19us | 238.6K | 47738 |
| medium (18 fields) | no optimization | 13.81us | 72.4K | 14480 |
| medium (18 fields) | L1 | 24.40us | 41.0K | 8197 |
| medium (18 fields) | L2 | 26.90us | 37.2K | 7434 |
| large (50 fields) | no optimization | 38.39us | 26.1K | 5210 |
| large (50 fields) | L1 | 66.33us | 15.1K | 3015 |
| large (50 fields) | L2 | 73.88us | 13.5K | 2707 |

#### validation / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 110ns | 9.1M | 1812612 |
| compile=false input=invalid outcome=rejected | 2.58us | 388.1K | 77620 |
| compile=false setup=fresh-schema | 6.14us | 162.8K | 32582 |
| compile=true input=valid outcome=accepted | 54ns | 18.6M | 3721408 |
| compile=true input=invalid outcome=rejected | 2.77us | 361.3K | 72255 |
| compile=true setup=fresh-schema | 21.10us | 47.4K | 9480 |

#### validation / small / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 279ns | 3.6M | 717095 |
| compile=false input=invalid outcome=rejected | 2.88us | 346.6K | 69327 |
| compile=false setup=fresh-schema | 10.41us | 96.1K | 19228 |
| compile=true input=valid outcome=accepted | 245ns | 4.1M | 815439 |
| compile=true input=invalid outcome=rejected | 2.89us | 346.6K | 69355 |
| compile=true setup=fresh-schema | 27.30us | 36.6K | 7370 |

#### validation / small / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 151ns | 6.6M | 1328481 |
| compile=false input=invalid outcome=rejected | 146ns | 6.9M | 1371450 |
| compile=false setup=fresh-schema | 11.34us | 88.1K | 17630 |
| compile=true input=valid outcome=accepted | 148ns | 6.8M | 1355557 |
| compile=true input=invalid outcome=rejected | 149ns | 6.7M | 1340603 |
| compile=true setup=fresh-schema | 11.58us | 86.4K | 17287 |

#### boolean-only / small / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 110ns | 9.1M | 1818972 |
| compile=false input=invalid validate | 131ns | 7.6M | 1529191 |
| compile=true input=valid validate | 40ns | 24.7M | 4949542 |
| compile=true input=invalid validate | 40ns | 25.2M | 5049340 |

#### validation / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 482ns | 2.1M | 414718 |
| compile=false input=invalid outcome=rejected | 3.28us | 304.4K | 61041 |
| compile=false setup=fresh-schema | 40.78us | 24.5K | 4907 |
| compile=true input=valid outcome=accepted | 148ns | 6.7M | 1348147 |
| compile=true input=invalid outcome=rejected | 3.35us | 298.4K | 59710 |
| compile=true setup=fresh-schema | 120.12us | 8.3K | 1665 |

#### validation / medium / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 1.84us | 543.5K | 108759 |
| compile=false input=invalid outcome=rejected | 4.74us | 211.2K | 42233 |
| compile=false setup=fresh-schema | 58.65us | 17.0K | 3410 |
| compile=true input=valid outcome=accepted | 1.68us | 594.5K | 118894 |
| compile=true input=invalid outcome=rejected | 4.48us | 223.3K | 44661 |
| compile=true setup=fresh-schema | 128.52us | 7.8K | 1557 |

#### validation / medium / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 1.54us | 650.7K | 130133 |
| compile=false input=invalid outcome=rejected | 1.54us | 650.4K | 130136 |
| compile=false setup=fresh-schema | 62.01us | 16.1K | 3227 |
| compile=true input=valid outcome=accepted | 1.32us | 757.8K | 151643 |
| compile=true input=invalid outcome=rejected | 1.30us | 767.7K | 153537 |
| compile=true setup=fresh-schema | 62.15us | 16.1K | 3218 |

#### boolean-only / medium / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 455ns | 2.2M | 440020 |
| compile=false input=invalid validate | 482ns | 2.1M | 415210 |
| compile=true input=valid validate | 105ns | 9.5M | 1905881 |
| compile=true input=invalid validate | 521ns | 1.9M | 384389 |

#### validation / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 1.92us | 520.9K | 104179 |
| compile=false input=invalid outcome=rejected | 4.98us | 200.7K | 40146 |
| compile=false setup=fresh-schema | 81.41us | 12.3K | 2458 |
| compile=true input=valid outcome=accepted | 427ns | 2.3M | 468454 |
| compile=true input=invalid outcome=rejected | 5.60us | 178.7K | 35762 |
| compile=true setup=fresh-schema | 230.68us | 4.3K | 867 |

#### validation / large / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 5.84us | 171.3K | 34263 |
| compile=false input=invalid outcome=rejected | 9.59us | 104.3K | 20852 |
| compile=false setup=fresh-schema | 129.60us | 7.7K | 1544 |
| compile=true input=valid outcome=accepted | 4.64us | 215.7K | 43161 |
| compile=true input=invalid outcome=rejected | 9.66us | 103.5K | 20709 |
| compile=true setup=fresh-schema | 278.83us | 3.6K | 718 |

#### validation / large / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 4.58us | 218.5K | 43725 |
| compile=false input=invalid outcome=rejected | 7.68us | 130.1K | 26028 |
| compile=false setup=fresh-schema | 141.54us | 7.1K | 1418 |
| compile=true input=valid outcome=accepted | 3.99us | 250.5K | 50125 |
| compile=true input=invalid outcome=rejected | 8.44us | 118.4K | 23687 |
| compile=true setup=fresh-schema | 138.14us | 7.2K | 1455 |

#### boolean-only / large / baseline

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid validate | 1.90us | 526.8K | 105368 |
| compile=false input=invalid validate | 1.92us | 520.5K | 104160 |
| compile=true input=valid validate | 419ns | 2.4M | 477512 |
| compile=true input=invalid validate | 2.37us | 421.1K | 84262 |

#### escape-hatch / refined-string / L1

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 165ns | 6.1M | 1213840 |
| compile=false input=invalid outcome=rejected | 2.73us | 366.8K | 73768 |
| compile=true input=valid outcome=accepted | 100ns | 10.0M | 1996511 |
| compile=true input=invalid outcome=rejected | 2.71us | 368.7K | 73744 |

#### escape-hatch / refined-string / L2

| Level | Mean | ops/sec | Samples |
|-------|------|---------|---------|
| compile=false input=valid outcome=accepted | 163ns | 6.1M | 1225119 |
| compile=false input=invalid outcome=rejected | 2.61us | 382.4K | 76522 |
| compile=true input=valid outcome=accepted | 95ns | 10.6M | 2112100 |
| compile=true input=invalid outcome=rejected | 2.65us | 377.0K | 75430 |

### Codegen vs Runtime (Browser Mount)

> Codegen: pre-walked `FormField[]` imported from a generated module — mount pays only React work.
> Runtime: `useZodForm(schema, ...)` walks + optimizes + mounts on every page load.

#### small (5 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 242.84us | 439.52us | 1.81× |
| L1 | 544.02us | 606.97us | 1.12× |
| L2 | 354.96us | 349.21us | 0.98× |

#### medium (18 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 2.17ms | 1.26ms | 0.58× |
| L1 | 886.28us | 1.55ms | 1.75× |
| L2 | 1.06ms | 1.11ms | 1.05× |

#### large (50 fields)

| Level | Codegen mount | Runtime mount | Speedup |
|-------|---------------|---------------|---------|
| no optimization | 2.33ms | 2.43ms | 1.04× |
| L1 | 1.29ms | 2.91ms | 2.24× |
| L2 | 1.68ms | 2.18ms | 1.30× |
