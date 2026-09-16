import { defineConfig } from 'astro/config';
import { execSync } from 'node:child_process';

let commitHash = '';
try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch {}

export default defineConfig({
  site: 'https://sc.team',
  output: 'static',

  server: {
    allowedHosts: ['acdbentity-gets-receipt-helped.trycloudflare.com']
  },

  build: {
    assets: '_assets'
  },

  vite: {
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'),
      __COMMIT_HASH__: JSON.stringify(commitHash),
    }
  }
});
