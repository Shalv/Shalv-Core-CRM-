import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function vercelBuildOutputPlugin(): Plugin {
  return {
    name: 'vercel-build-output-plugin',
    apply: 'build',
    closeBundle: async () => {
      try {
        const { buildApi } = await import('./scripts/build-api.mjs');
        await buildApi();
      } catch (err: any) {
        console.warn('Note: vercel build output generator:', err?.message || err);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss(), vercelBuildOutputPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
