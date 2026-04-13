# Configuration

## WalkOptions

### Properties

#### formRegistry

Custom form registry for metadata annotations

**Type:** `ZodFormRegistry`

#### processors

Custom processors to add or override built-in ones

**Type:** `Record<string, FormProcessor<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>>`

#### maxDepth

Maximum recursion depth for lazy/recursive schemas (default: 5)

**Type:** `number`

#### optimization

Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

**Type:** `{ level: 1 | 2 | 3; optimizers?: Record<string, FormOptimizer[]> }`