import { defineConfig } from 'vite';
import { z2fVite } from '../../../src/index.js';

export default defineConfig({
  plugins: [
    z2fVite({
      configOverride: {
        componentName: 'SignupForm',
        mode: 'submit',
        ui: 'html'
      },
      logLevel: 'silent'
    })
  ],
  build: {
    write: false
  }
});
