// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tinaDirective from "./astro-tina-directive/register";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: process.env.SITE_URL || `https://${process.env.VERCEL_URL}`,
  integrations: [
    mdx(),
    sitemap(),
    react(),
    tinaDirective(),
    pagefind(),
  ],
  // FIX: removed empty domains:[] (no-op, use remotePatterns if external images needed)
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            warning.exporter === 'tinacms/dist/client'
          ) return;
          warn(warning);
        },
      },
    },
  },
});
