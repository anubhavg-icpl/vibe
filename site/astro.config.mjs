// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://anubhavg-icpl.github.io/vibe
export default defineConfig({
  site: 'https://anubhavg-icpl.github.io',
  base: '/vibe',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
