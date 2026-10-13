'use strict';
// CommonJS entry keeps initialization exceptions inside the request boundary.
process.env.CRM_SERVERLESS = 'true';
let loaded;
module.exports = async function handler(req, res) {
  try {
    loaded ||= require('./application.cjs');
    await loaded.serverReady;
    const incoming = new URL(req.url || '/', 'http://enact360.internal');
    const routedPath = incoming.searchParams.get('__enact_path');
    if (routedPath && (routedPath === '/api' || routedPath.startsWith('/api/') || routedPath.startsWith('/auth/'))) {
      incoming.searchParams.delete('__enact_path');
      req.url = routedPath + (incoming.search ? incoming.search : '');
    }
    return loaded.app(req, res);
  } catch (error) {
    console.error('Enact360 backend initialization failed:', error?.stack || error?.message || String(error));
    if (res.headersSent) {res.end(); return;}
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({success:false,code:'BACKEND_INITIALIZATION_FAILED',message:'The backend could not initialize. Open this deployment’s Vercel Runtime Logs for the exception.'}));
  }
};
