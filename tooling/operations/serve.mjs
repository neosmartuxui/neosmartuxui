import {createServer} from 'node:http';
import {stat,readFile} from 'node:fs/promises';
import {resolve,relative,sep,extname} from 'node:path';
const dir=resolve(import.meta.dirname,'../../artifacts/operations-preview');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.ico':'image/x-icon'};
const port=Number(process.env.NEOSMARTUXUI_OPERATIONS_PORT||4401);
createServer(async(req,res)=>{
 try{
  const input=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=resolve(dir,'.'+(input==='/'?'/index.html':input));
  const rel=relative(dir,file);
  if(rel.startsWith('..')||rel.includes('..'+sep)||rel===''){res.writeHead(403);res.end();return}
  if(!(await stat(file)).isFile())throw new Error('not a file');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log('[operations] http://127.0.0.1:'+port));
