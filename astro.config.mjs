// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Custom domain. Drives canonical URLs, OG URLs, and the generated sitemap.
  // Deliberately NOT leftphalange.github.io, and no `base` — the site is served
  // from the domain root.
  site: 'https://ethanbovard.com',

  output: 'static',

  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
