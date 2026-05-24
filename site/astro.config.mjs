// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site: https://anubhavg-icpl.github.io/vibe
export default defineConfig({
  site: 'https://anubhavg-icpl.github.io',
  base: '/vibe',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // Asset pages are the long tail; browse is a JS app, the rest are hubs.
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        const url = item.url;
        if (url.endsWith('/vibe/') || url.endsWith('/vibe')) item.priority = 1.0;
        else if (url.includes('/category/')) item.priority = 0.7;
        else if (url.includes('/browse')) item.priority = 0.6;
        else item.priority = 0.5;
        return item;
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
