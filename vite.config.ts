import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths so the site keeps working if the repo (and so the Pages path) is renamed.
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
