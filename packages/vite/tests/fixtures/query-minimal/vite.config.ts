import { defineConfig } from 'vite';
import { z2fVite } from '../../../src/index.js';

export default defineConfig({
  plugins: [
    z2fVite({
      configOverride: {
        components: { source: '@/components/ui', preset: 'html' },
        defaults: { mode: 'submit', ui: 'html' },
        schemas: {
          ['signupSchema']: { name: 'SignupForm' },
          ['userSchema']: { name: 'SignupForm' },
          ['mySchema']: { name: 'SignupForm' },
          ['activeSchema']: { name: 'SignupForm' },
          ['TestSchema']: { name: 'SignupForm' },
          ['testSchema']: { name: 'SignupForm' },
          ['schema']: { name: 'SignupForm' }
        }
      },
      logLevel: 'silent'
    })
  ],
  build: {
    write: false
  }
});
