/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import type { UserConfigExport } from 'vite';
import {resolve} from 'node:path';
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
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
    resolve: {
      alias: [{ find: "@", replacement: resolve(__dirname, "./src") }]
    }
  },
} as UserConfigExport);
