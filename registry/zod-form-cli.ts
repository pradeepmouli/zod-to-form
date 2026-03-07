import { defineConfig, SHADCN_FIELD_TYPES } from '@zod-to-form/core';

export default defineConfig({
  components: '@/components/ui/zod-form-components',
  preset: 'shadcn',
  formPrimitives: {
    field: 'Field',
    label: 'FieldLabel',
    control: 'FormControl',
  },
  defaults: {
    mode: 'submit',
    ui: 'shadcn',
    overwrite: false,
    serverAction: false,
  },
  fieldTypes: {
    ...SHADCN_FIELD_TYPES,
  },
});
