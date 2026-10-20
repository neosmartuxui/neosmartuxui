import {createServer} from 'node:http';
import {stat,readFile} from 'node:fs/promises';
import {resolve,relative,sep,extname} from 'node:path';
const root=resolve(import.meta.dirname,'../../artifacts/portal-stage');
const port=Number(process.env.NEOSMARTUXUI_PORTAL_PORT||4405);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  let file=resolve(root,'.'+pathname),rel=relative(root,file);
  if(rel.startsWith('..')||rel.includes('..'+sep))return res.writeHead(403).end('Forbidden');
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  rel=relative(root,file);
  if(rel.startsWith('..')||rel.includes('..'+sep))return res.writeHead(403).end('Forbidden');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(data);
 }catch{res.writeHead(404).end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log('Portal staging: http://127.0.0.1:'+port+'/'));
