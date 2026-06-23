import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://sc.team',
  output: 'static',

  build: {
    assets: '_assets'
  },

  adapter: cloudflare()
});