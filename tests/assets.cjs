const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const base='https://baueruknews.github.io/newsrota/';
assert.equal(new URL(manifest.start_url,base).href,base);assert.equal(new URL(manifest.scope,base).href,base);assert.equal(manifest.display,'standalone');
assert(html.includes('rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png"'));
assert(html.includes('rel="manifest" href="./manifest.webmanifest"'));assert(html.includes('name="apple-mobile-web-app-capable" content="yes"'));
const sizes=[['icons/apple-touch-icon.png',180],['icons/favicon-32.png',32],...manifest.icons.map(i=>[i.src,Number(i.sizes.split('x')[0])])];
for(const [file,size] of sizes){assert(new URL(file,base).pathname.startsWith('/newsrota/'));const b=fs.readFileSync(path.join(root,file));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size);}
assert(!html.includes('serviceWorker.register'));console.log('PASS: Safari touch icon and manifest metadata; GitHub project subpath; exact PNG icon dimensions; standalone launch; no added offline service-worker cache.');
