// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    // Keep production prerendering from replacing the running dev server's optimized dependencies.
    cacheDir: process.env.NODE_ENV === 'production'
      ? 'node_modules/.vite-build'
      : 'node_modules/.vite-dev',
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      }
    }
  },

  integrations: [react()]
});