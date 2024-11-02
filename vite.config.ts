/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { UserConfigExport, UserConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(async (): Promise<UserConfig> => {
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default;

  return {
    plugins: [
      react(),
      tsconfigPaths(),
    ],
    resolve: {
      alias: [{ find: "@", replacement: resolve(__dirname, "./src") }]
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
          '**/*.d.ts',
        ],
      },
      deps: {
        inline: [/@testing-library\/jest-dom/]
      }
    },
  };
});