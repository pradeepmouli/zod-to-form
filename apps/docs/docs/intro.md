---
title: Introduction
sidebar_position: 1
slug: /intro
description: zod-to-form generates type-safe React Hook Form components from Zod v4 schemas — at runtime or as static .tsx files.
---

# Introduction

**zod-to-form** is schema-driven form generation for [Zod v4](https://zod.dev). Walk a Zod schema once — render a validated form at runtime, or generate a static hand-readable `.tsx` component at build time.

```tsx
import { ZodForm } from '@zod-to-form/react';

<ZodForm schema={userSchema} onSubmit={(data) => console.log(data)}>
  <button type="submit">Submit</button>
</ZodForm>
```

## When to Use Which Path

| Path | Choose when |
|---|---|
| **Runtime** (`<ZodForm>`) | Schemas change frequently, rapid prototyping, admin/CRUD, instant feedback |
| **CLI** (`zodform generate`) | Production forms, design-system integration, zero runtime dep on zod-to-form, code should be inspectable and committed |

Both paths share `@zod-to-form/core` — the same walker produces the same `FormField[]` tree. A [component config](./guides/component-config.md) file can drive both paths to produce functionally identical forms.

## Packages

| Package | Description |
|---|---|
| [`@zod-to-form/core`](https://www.npmjs.com/package/@zod-to-form/core) | Schema walker & processor registry — zero runtime deps |
| [`@zod-to-form/react`](https://www.npmjs.com/package/@zod-to-form/react) | `<ZodForm>` runtime renderer + shadcn/ui component map |
| [`@zod-to-form/cli`](https://www.npmjs.com/package/@zod-to-form/cli) | `zodform generate` CLI for static codegen |
| [`@zod-to-form/codegen`](https://www.npmjs.com/package/@zod-to-form/codegen) | Codegen primitives shared by the CLI |

## Features

- **Zod v4 native introspection** — reads `_zod.def`, `_zod.bag`, `.meta()`, and `z.registry()` directly
- **Runtime rendering** — `<ZodForm>` reads schemas at render time for instant iteration
- **CLI codegen** — `npx zodform generate` produces static `.tsx` files with zero runtime dependency
- **Shared component config** — one config drives both CLI and runtime identically
- **Supports all major Zod types** — nested objects (fieldsets), arrays (repeaters), discriminated unions (variant reveal)
- **Zero-dependency core** — `@zod-to-form/core` has no runtime dependencies (Zod is a peer)

## Next Steps

- [Quickstart](./quickstart.md) — install and render your first form
- [Runtime Rendering](./guides/runtime.md) — `<ZodForm>` and `useZodForm`
- [CLI Codegen](./guides/cli.md) — `zodform generate` workflow
- [API Reference](./api/index.md) — auto-generated from source
