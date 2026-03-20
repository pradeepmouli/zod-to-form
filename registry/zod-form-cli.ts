import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui/zod-form-components',
    preset: 'shadcn'
  },
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FieldControl'
  },
  defaults: {
    mode: 'submit',
    ui: 'shadcn',
    overwrite: false,
    serverAction: false
  }
});
