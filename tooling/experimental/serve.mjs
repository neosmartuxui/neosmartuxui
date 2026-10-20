import {createServer} from 'node:http';
import {stat,readFile} from 'node:fs/promises';
import {resolve,relative,sep,extname} from 'node:path';
const root=resolve(import.meta.dirname,'../../artifacts/experimental-public');
const port=Number(process.env.NEOSMARTUXUI_EXPERIMENTAL_PORT||4404);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  let candidate=resolve(root,'.'+pathname);
  const rel=relative(root,candidate);
  if(rel.startsWith('..')||rel.includes('..'+sep))return res.writeHead(403).end('Forbidden');
  if((await stat(candidate)).isDirectory())candidate=resolve(candidate,'index.html');
  const rel2=relative(root,candidate);
  if(rel2.startsWith('..')||rel2.includes('..'+sep))return res.writeHead(403).end('Forbidden');
  const data=await readFile(candidate);
  res.writeHead(200,{'Content-Type':mime[extname(candidate)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(data);
 }catch{res.writeHead(404).end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log('Experimental gallery: http://127.0.0.1:'+port+'/'));
