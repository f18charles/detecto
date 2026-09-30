import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test-only config, kept separate from vite.config.js so the app build doesn't
// pull in the Tailwind plugin or the jsdom environment.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
