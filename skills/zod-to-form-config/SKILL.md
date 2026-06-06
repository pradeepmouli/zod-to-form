---
description: "Configuration for zod-to-form code generation (defineConfig / z2f.config.ts): component library, generation defaults, file selection, and per-schema overrides. Also: zod, zod-v4, forms, form-generation, schema, schema-walker, processor-registry, react-hook-form, schema-driven, form-schema, zod-registry."
name: zod-to-form-config
---

# zod-to-form-config

Configuration for zod-to-form code generation (defineConfig / z2f.config.ts): component library, generation defaults, file selection, and per-schema overrides.

## Quick Start

import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },

  defaults: {
    out: 'src/forms',
    mode: 'submit',
    overwrite: true,
  },

  include: ['*Schema'],
  exclude: ['InternalSchema'],

  fields: {
    'address.street': {
      helpText: 'Include apartment or suite number if applicable',
    },
    'phone': {
      props: { type: 'tel' },
    },
  },

  schemas: {
    UserSchema: {
      name: 'UserProfileForm',
      out: 'src/forms/user',
...

## Configuration

**ZodFormsConfig** (7 options — see references/config.md)

## References

Load these on demand — do NOT read all at once:

- When configuring options → read `references/config.md` for all settings and defaults

## Links

- [Repository](https://github.com/pradeepmouli/zod-to-form.git)