import app, { serverReady } from '../server';

export default async function handler(req: any, res: any) {
  if (req.url) {
    let url = req.url;
    if (!url.startsWith('/api/') && url !== '/api' && !url.startsWith('/auth')) {
      const clean = url.startsWith('/') ? url : '/' + url;
      url = '/api' + clean;
    }
    req.url = url;
  }
  // Ensure the durable store is hydrated from Postgres before the first request
  // is served (cold-start safety on Vercel).
  await serverReady;
  return app(req, res);
}
