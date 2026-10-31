// Capture real controls from the local runtime site; never submit feedback.
const {chromium}=require('C:/Users/BSira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve('deployment'),offline='C:/dev/birinci-offline/build/pwa';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]),base=root;if(url.startsWith('/offline/')){base=offline;url=url.slice(8);}if(url.endsWith('/'))url+='index.html';const p=path.resolve(base,'.'+url);if(!p.startsWith(path.resolve(base)+path.sep)){res.writeHead(403);return res.end();}fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(e?'Not found':b);});});
// Render the native control on transparency for inline documentation.
async function transparentShot(el, output) {
 await el.evaluate(e=>e.setAttribute('data-capture-target',''));
 try { await el.screenshot({path:output, omitBackground:true, animations:'disabled', style:`
 html, body {background:transparent!important;}
 html::before,html::after,body::before,body::after {display:none!important;}
 body * {visibility:hidden!important;} iframe {visibility:visible!important;}
 [data-capture-target], [data-capture-target] * {visibility:visible!important;}
 [data-capture-target].nav-toggle[aria-expanded="true"] {position:relative!important;}
 [data-capture-target].nav-toggle[aria-expanded="false"] {position:relative!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;padding:0!important;}
 [data-capture-target].nav-toggle[aria-expanded="false"] span {position:absolute!important;left:50%!important;top:50%!important;width:18px!important;height:2px!important;margin:0!important;opacity:1!important;}
 [data-capture-target].nav-toggle[aria-expanded="false"] span:nth-child(1) {transform:translate(-50%,-50%) translateY(-6px)!important;}
 [data-capture-target].nav-toggle[aria-expanded="false"] span:nth-child(2) {transform:translate(-50%,-50%)!important;}
 [data-capture-target].nav-toggle[aria-expanded="false"] span:nth-child(3) {transform:translate(-50%,-50%) translateY(6px)!important;}
 [data-capture-target].nav-toggle[aria-expanded="true"] span {position:absolute!important;left:50%!important;top:50%!important;margin:0!important;}
 [data-capture-target].nav-toggle[aria-expanded="true"] span:nth-child(1) {transform:translate(-50%,-50%) rotate(45deg)!important;}
 [data-capture-target].nav-toggle[aria-expanded="true"] span:nth-child(2) {display:none!important;}
 [data-capture-target].nav-toggle[aria-expanded="true"] span:nth-child(3) {transform:translate(-50%,-50%) rotate(-45deg)!important;}
 [data-capture-target] {background:transparent!important;box-shadow:none!important;border-color:transparent!important;color:#16456a!important;outline:none!important;}
 `}); } finally {await el.evaluate(e=>e.removeAttribute('data-capture-target'));}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({channel:'msedge',headless:true});const result=(process.argv.includes('--offline-only')||process.argv.includes('--comparison-only')||process.argv.includes('--menu-only'))?JSON.parse(fs.readFileSync('docs/manuals/button-references.json','utf8')):{};try{
 for(const lang of (process.argv.includes('--offline-only')?[]:['az','en','de','ru','ky'])){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,colorScheme:'light'});const p=await ctx.newPage();p.setDefaultTimeout(8000);
  const dir=path.resolve('assets/manuals/buttons',lang);fs.mkdirSync(dir,{recursive:true});result[lang]=result[lang]||{};
  const shot=async(id,selector)=>{const el=p.locator(selector).first();await el.waitFor({state:'visible'});await el.scrollIntoViewIfNeeded();await p.evaluate(()=>document.fonts.ready);const meta=await el.evaluate(e=>({label:e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent.trim(),text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));if(meta.width>500||meta.height>100)throw Error('Not a compact button: '+id);await transparentShot(el,path.join(dir,id+'.png'));result[lang][id]=meta;};
  if(process.argv.includes('--menu-only')) {await p.goto(base+'/'+lang+'/user-manual.html');await p.setViewportSize({width:390,height:844});await shot('open-menu','#nav-toggle');await p.locator('#nav-toggle').click();await p.waitForTimeout(250);await shot('close-menu','#nav-toggle');await ctx.close();continue;}
  if(!process.argv.includes('--comparison-only')) {
  await p.goto(base+'/'+lang+'/index.html');
  for(const [id,sel] of Object.entries({help:'[data-nav-help]',feedback:'[data-nav-feedback]',sitemap:'[data-nav-sitemap]',search:'#global-search-toggle',language:'.lang-switcher__toggle',cards:'button[data-home-view="cards"]',list:'button[data-home-view="list"]'}))await shot(id,sel);
  await p.goto(base+'/'+lang+'/categories/dostluq-ve-insan-munasibetleri.html');
  await p.locator('[data-tools-search]').fill('a');
  await shot('clear-filter','[data-search-filter-clear]');await p.locator('[data-tools-search]').fill('');
  for(const [id,sel] of Object.entries({'show-image':'[data-images-mode="show"]','hide-image':'[data-images-mode="hide"]','show-text':'[data-texts-mode="show"]','hide-text':'[data-texts-mode="hide"]',compare:'.story-multilingual-btn'}))await shot(id,sel);
  } else {await p.goto(base+'/'+lang+'/categories/dostluq-ve-insan-munasibetleri.html');}
  await p.locator('.story-multilingual-btn').first().click();await p.waitForTimeout(600);
  const frame=await ctx.newPage();await frame.goto(new URL(await p.locator('#story-compare-overlay iframe').getAttribute('src'),p.url()).href);
  for(const code of ['az','de','en','ky','ru']){
   const el=frame.locator('button.sc-lang[data-lang="'+code+'"]');await el.waitFor();
   await transparentShot(el,path.join(dir,'lang-'+code+'.png'));
   result[lang]['lang-'+code]=await el.evaluate(e=>({label:e.textContent.trim(),text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
  }
  // Capture comparison buttons in their own frame with their actual symbols.
  for(const [id,selector] of Object.entries({previous:'#sc-pager-prev',next:'#sc-pager-next',first:'#sc-pager-first',last:'#sc-pager-last'})){
   const el=frame.locator(selector);if(await el.count()){await transparentShot(el,path.join(dir,id+'.png'));result[lang][id]=await el.evaluate(e=>({label:e.title||e.getAttribute('aria-label')||e.textContent.trim(),text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));}
  }
  await frame.close();
  if(process.argv.includes('--comparison-only')) {await ctx.close();continue;}
  await p.keyboard.press('Escape');
  await p.locator('#global-search-toggle').click();await shot('close','.global-search__close');await p.keyboard.press('Escape');
  await p.goto(base+'/'+lang+'/feedback.html');
  await shot('choose-file','#attachment-choose');await shot('send-feedback','#appSubmitBtn');
  await p.locator('input[type=file]').first().setInputFiles(path.resolve('assets/manuals/buttons',lang,'help.png'));
  await shot('replace-file','.app-file-replace');await shot('remove-file','.app-file-remove');
  await p.goto(base+'/'+lang+'/user-manual.html');await shot('section-link','.permalink');
  await shot('top','#back-to-top');await shot('bottom','#go-to-bottom');
  await p.setViewportSize({width:390,height:844});await shot('open-menu','#nav-toggle');await p.locator('#nav-toggle').click();await p.waitForTimeout(250);await shot('close-menu','#nav-toggle');
  await p.goto(base+'/'+lang+'/categories/dostluq-ve-insan-munasibetleri.html');await shot('stories-menu','.stories-drawer-launch');
  await ctx.close();console.log('Captured',lang,Object.keys(result[lang]).length,'controls');
 }
 // An isolated local browser profile supplies pack-state fixtures so the real
 // offline UI renders installed/update controls without downloading the library.
 if(!process.argv.includes('--comparison-only')&&!process.argv.includes('--menu-only')) {
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage();
 await p.goto(base+'/offline/');await p.locator('#packs button').first().waitFor();
 await p.locator('#ui-language').selectOption('en');await p.waitForTimeout(500);
 const captureOffline=async(id,el)=>{await el.waitFor();for(const lang of Object.keys(result)){await transparentShot(el,path.resolve('assets/manuals/buttons',lang,id+'.png'));const m=await el.evaluate(e=>({label:e.textContent.trim(),text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));if(!m.height||m.height>100||m.width>500)throw Error('Invalid offline button: '+id);result[lang][id]=m;}};
 await captureOffline('download',p.getByRole('button',{name:'Download',exact:true}).first());
 await captureOffline('updates',p.locator('#check-updates'));await captureOffline('persist',p.locator('#persist'));
 await p.evaluate(async()=>{const catalog=await(await fetch('offline-packs.json')).json();const store=OfflineStore.create(location.href);for(const id of ['core','az-text','az-media','de-text'])await store.setState(id,{id,version:id==='de-text'?'previous':catalog.version,cache:'button-capture-fixture',files:[]});});
 await p.reload();await p.locator('#packs button').first().waitFor();
 for(const [id,label] of Object.entries({repair:'Download / repair',verify:'Verify',update:'Update','remove-language':'Remove language','remove-illustrations':'Remove illustrations'}))await captureOffline(id,p.getByRole('button',{name:label,exact:true}).first());
 await captureOffline('open',p.locator('#packs a.open').first());
 // The pause control is authored in the page, hidden outside a download.
 await p.locator('#progress-panel').evaluate(e=>e.hidden=false);await captureOffline('pause',p.locator('#cancel'));
 await p.goto(base+'/offline/en/index.html');await captureOffline('downloads',p.locator('.offline-edition-strip a'));
 await ctx.close();
 }
 fs.writeFileSync('docs/manuals/button-references.json',JSON.stringify(result,null,2));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});





