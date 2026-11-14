// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react({
      include: ['**/components/react/*.{jsx,tsx}', '**/components/react/**/*.{jsx,tsx}'],
      exclude: ['**/*.vue', '**/*.vue?*', '**/*.svelte', '**/*.svelte?*'],
    }),
    vue(),
    svelte(),
  ],
});
