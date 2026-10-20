import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../../artifacts/commerce-preview');
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const port=Number(process.env.NEOSMARTUXUI_COMMERCE_PORT||4399);
createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  const rel=relative(root,file);
  if(rel.startsWith('..')||rel.includes('..'+sep)||file===root){res.writeHead(403);res.end();return;}
  const info=await stat(file);
  if(!info.isFile()){res.writeHead(404);res.end();return;}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Length':data.length});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Commerce local preview: http://127.0.0.1:'+port));
