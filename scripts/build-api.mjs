import {build} from 'esbuild';
import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
// Discard legacy API entries before Vercel constructs deployment output.
await rm('api',{recursive:true,force:true});
await rm('.vercel/output',{recursive:true,force:true});
const functionPath='.vercel/output/functions/api.func';
await mkdir(functionPath,{recursive:true});
await cp('dist','.vercel/output/static',{recursive:true});
await build({
 entryPoints:['server.ts'],outfile:functionPath+'/application.cjs',bundle:true,
 platform:'node',format:'cjs',target:'node22',external:['vite','pg-native'],
 define:{'import.meta.url':'__deploymentModuleUrl'},
 banner:{js:'const __deploymentModuleUrl = require("node:url").pathToFileURL(__filename).href;'},
});
await cp('backend/function-entry.cjs',functionPath+'/index.cjs');
await writeFile(functionPath+'/.vc-config.json',JSON.stringify({runtime:'nodejs22.x',handler:'index.cjs',launcherType:'Nodejs',maxDuration:60},null,2));
await writeFile('.vercel/output/config.json',JSON.stringify({version:3,routes:[
 {src:'^(/api(?:/.*)?)$',dest:'/api?__enact_path=$1'},
 {src:'^(/auth(?:/.*)?)$',dest:'/api?__enact_path=$1'},
 {handle:'filesystem'},
 {src:'/.*',dest:'/index.html'},
]},null,2));
console.log('Vercel deployment output built: one bundled Node 22 function and static frontend.');
