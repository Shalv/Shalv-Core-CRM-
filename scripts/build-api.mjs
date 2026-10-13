import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function buildApi() {
  // Discard legacy API entries before Vercel constructs deployment output.
  await rm('api', { recursive: true, force: true }).catch(() => {});

  const outputRoot = '.vercel/output';
  const functionPath = `${outputRoot}/functions/api.func`;
  const staticPath = `${outputRoot}/static`;

  await mkdir(functionPath, { recursive: true });
  await mkdir(staticPath, { recursive: true });

  // Always write config.json so Vercel can never encounter a missing config.json error
  await writeFile(
    `${outputRoot}/config.json`,
    JSON.stringify(
      {
        version: 3,
        routes: [
          { src: '^(/api(?:/.*)?)$', dest: '/api?__enact_path=$1' },
          { src: '^(/auth(?:/.*)?)$', dest: '/api?__enact_path=$1' },
          { handle: 'filesystem' },
          { src: '/.*', dest: '/index.html' },
        ],
      },
      null,
      2
    )
  );

  // Copy compiled static files from dist to .vercel/output/static if available
  if (fs.existsSync('dist')) {
    await cp('dist', staticPath, { recursive: true });
  }

  // Bundle server.ts for Node 22 Vercel Function
  await build({
    entryPoints: ['server.ts'],
    outfile: `${functionPath}/application.cjs`,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['vite', 'pg-native'],
    define: { 'import.meta.url': '__deploymentModuleUrl' },
    banner: {
      js: 'const __deploymentModuleUrl = require("node:url").pathToFileURL(__filename).href;',
    },
  });

  if (fs.existsSync('backend/function-entry.cjs')) {
    await cp('backend/function-entry.cjs', `${functionPath}/index.cjs`);
  }

  await writeFile(
    `${functionPath}/.vc-config.json`,
    JSON.stringify(
      {
        runtime: 'nodejs22.x',
        handler: 'index.cjs',
        launcherType: 'Nodejs',
        maxDuration: 60,
      },
      null,
      2
    )
  );

  console.log('Vercel deployment output built: one bundled Node 22 function and static frontend.');
}

// Execute when run directly as CLI script
if (!process.argv[1] || fileURLToPath(import.meta.url) === process.argv[1]) {
  await buildApi();
}
