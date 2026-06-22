import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sc.team',
  output: 'static',
  build: {
    assets: '_assets'
  }
});
