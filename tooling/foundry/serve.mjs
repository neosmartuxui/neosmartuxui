import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '../../dist/foundry');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8']
]);

const contained = (path) => path === root || path.startsWith(`${root}${sep}`);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    let file = resolve(root, `.${pathname}`);
    if (!contained(file)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(file);
    if (info.isDirectory()) {
      file = resolve(file, 'index.html');
      if (!contained(file)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
    } else if (!info.isFile()) {
      throw new Error('not-file');
    }
    const finalInfo = await stat(file);
    if (!finalInfo.isFile()) throw new Error('not-file');
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': mime.get(extname(file)) || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Serving NeoSmartUI Foundry at http://${host}:${port}`);
});
