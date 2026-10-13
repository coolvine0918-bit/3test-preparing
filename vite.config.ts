import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  handleGrade,
  handleHint,
  handleAppsScriptSubmit,
  handleAppsScriptFetch,
} from './src/server/apiRouter.ts';

function devApiMiddlewarePlugin(): Plugin {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (
          (url === '/api/grade' ||
            url === '/api/hint' ||
            url === '/api/apps-script/submit' ||
            url === '/api/apps-script/fetch') &&
          req.method === 'POST'
        ) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              (req as any).body = JSON.parse(body || '{}');
            } catch {
              (req as any).body = {};
            }
            if (url === '/api/grade') return handleGrade(req, res);
            if (url === '/api/hint') return handleHint(req, res);
            if (url === '/api/apps-script/submit') return handleAppsScriptSubmit(req, res);
            if (url === '/api/apps-script/fetch') return handleAppsScriptFetch(req, res);
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), devApiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
