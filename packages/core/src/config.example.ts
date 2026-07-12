import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn'
  },

  defaults: {
    out: 'src/forms',
    mode: 'submit',
    overwrite: true
  },

  include: ['*Schema'],
  exclude: ['InternalSchema'],

  fields: {
    'address.street': {
      helpText: 'Include apartment or suite number if applicable'
    },
    phone: {
      props: { type: 'tel' }
    }
  },

  schemas: {
    UserSchema: {
      name: 'UserProfileForm',
      out: 'src/forms/user',
      fields: {
        bio: {
          component: 'Textarea',
          helpText: 'Tell us a little about yourself'
        }
      }
    },
    ContactSchema: {
      mode: 'auto-save',
      serverAction: true
    }
  }
});
