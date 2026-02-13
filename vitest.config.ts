import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'main.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).href,
      '@domain': new URL('./src/domain', import.meta.url).href,
      '@application': new URL('./src/application', import.meta.url).href,
      '@infrastructure': new URL('./src/infrastructure', import.meta.url).href,
      '@presentation': new URL('./src/presentation', import.meta.url).href,
    },
  },
});
