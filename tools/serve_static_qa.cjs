/* Local-only static QA server. Send "quit" on stdin to stop. */
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),cache=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff'};
const server=http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(url.pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!mime[path.extname(file)]){res.writeHead(404);res.end();return}let data=cache.get(file);if(!data){data=await fs.readFile(file);cache.set(file,data)}res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Content-Length':data.length,'Cache-Control':'no-cache'});res.end(data)}catch(e){res.writeHead(404);res.end('Not found')}});
server.listen(8889,'127.0.0.1',511,()=>console.log('Static QA server: http://127.0.0.1:8889'));
process.stdin.on('data',data=>{if(String(data).includes('quit'))server.close(()=>process.exit(0))});
