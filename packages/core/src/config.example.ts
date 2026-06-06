import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn'
  },
  defaults: {
    mode: 'submit',
    out: 'src/forms/generated',
    overwrite: false,
    formProvider: true
  },
  include: ['*Schema', '*Form'],
  exclude: ['Internal*', 'Draft*'],
  fields: {
    email: { component: 'Input', props: { type: 'email', autoComplete: 'email' } },
    password: { component: 'Input', props: { type: 'password', autoComplete: 'current-password' } },
    bio: { component: 'Textarea' }
  },
  schemas: {
    LoginSchema: {
      name: 'LoginForm',
      mode: 'submit',
      out: 'src/forms/generated/login',
      fields: {
        email: { component: 'Input' },
        password: { component: 'Input' }
      }
    },
    ProfileSchema: {
      name: 'ProfileForm',
      mode: 'auto-save',
      fields: {
        bio: { component: 'Textarea' },
        website: { component: 'Input', props: { type: 'url' } }
      }
    }
  }
});
