// Focused browser checks for the five public guides. Run from the project root.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/BSira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(process.env.MANUAL_TEST_ROOT || '.');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(e?'Not found':b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 fs.mkdirSync('tmp/manual-html',{recursive:true});
 try {
 for(const lang of ['az','de','en','ky','ru']) {
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
  await page.goto(`${base}/${lang}/user-manual.html`);
  assert.equal(await page.locator('.guide-section').count(),12);
  assert.equal(await page.locator('.manual-tools button').count(),0);
  assert(await page.evaluate(()=>{const a=document.querySelector('.manual-tools').getBoundingClientRect(),b=document.querySelector('.breadcrumbs').getBoundingClientRect();return Math.abs(a.left-b.left)<1&&Math.abs(a.width-b.width)<1;}));
  await page.evaluate(()=>scrollTo(0,1200));
  if((await page.viewportSize()).width>900){await page.waitForTimeout(150);assert(await page.evaluate(()=>{const a=document.querySelector('.layout>aside').getBoundingClientRect(),b=document.querySelector('.manual-tools').getBoundingClientRect();return Math.abs(a.top-b.bottom-12)<2;}));}
  await page.locator('#go-to-bottom').click();
  await page.waitForFunction(()=>scrollY>500);
  assert(await page.evaluate(()=>{const a=document.querySelector('.manual-tools').getBoundingClientRect(),b=document.querySelector('.breadcrumbs').getBoundingClientRect();return Math.abs(a.top-b.bottom)<2;}));
  await page.locator('#back-to-top').click();
  await page.waitForFunction(()=>scrollY<5);
  assert.equal(await page.locator('.guide-section:visible').count(),12);
  for (const id of ['story','comparison','feedback']) {
    await page.locator('#'+id).evaluate(n=>n.scrollIntoView());
    await page.waitForFunction(id=>document.querySelector('aside a[data-section="'+id+'"]').getAttribute('aria-current')==='location',id);
    assert(await page.locator('aside a[data-section="'+id+'"]').evaluate(a=>{const r=a.getBoundingClientRect(),p=a.closest('ol').getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1;}));
  }
  const source=JSON.parse(fs.readFileSync(`docs/manuals/manual-${lang}.json`,'utf8'));
  for (const s of source.sections) for (const p of s.paras) assert((await page.locator('main').textContent()).includes(p));
  await page.locator('#guide-topic').selectOption('feedback');
  assert.equal(await page.locator('.guide-section:visible').count(),2);
  await page.locator('#guide-search').fill('PDF');
  assert((await page.locator('mark').count())>0);
  assert((await page.locator('.guide-section:visible').count())>=1);
  await page.reload();assert.equal(await page.locator('#guide-search').inputValue(),'PDF');
  await page.locator('#guide-search').fill('zz-no-match-123');assert(await page.locator('#no-results').isVisible());
  await page.locator('#guide-search').fill(''); await page.locator('#guide-topic').selectOption('all');assert.equal(await page.locator('.guide-section:visible').count(),12);
  await page.locator('.guide-section summary').evaluateAll(nodes=>nodes.forEach(n=>n.click()));assert.equal(await page.locator('.guide-section details[open]').count(),0);
  await page.locator('aside a[href="#comparison"]').click();assert(await page.locator('#comparison details').getAttribute('open')!==null);
  await page.locator('#comparison .screenshot').click();assert(await page.locator('dialog').isVisible());
  await page.keyboard.press('Escape');assert(!(await page.locator('dialog').isVisible()));
  await page.locator('.guide-section:not(:has(details[open])) summary').evaluateAll(nodes=>nodes.forEach(n=>n.click()));assert.equal(await page.locator('.guide-section details[open]').count(),12);
  await page.evaluate(()=>{dispatchEvent(new Event('beforeprint'));});
  assert.equal(await page.locator('.guide-section details[open]').count(),12);
  await page.evaluate(()=>{dispatchEvent(new Event('afterprint'));});
  await page.locator('.lang-switcher__toggle').click(); await page.locator('.lang-switcher__option[data-lang="en"]').click();assert(new URL(page.url()).pathname==='/en/user-manual.html');
  await page.goto(`${base}/${lang}/user-manual.html`);
  const home=await ctx.newPage(); await home.goto(`${base}/${lang}/index.html`);
  assert.equal(await page.locator('#site-footer').innerHTML(),await home.locator('#site-footer').innerHTML()); await home.close();
  await page.locator('#site-footer').scrollIntoViewIfNeeded();
  await page.screenshot({path:`tmp/manual-html/${lang}-footer-desktop.png`});
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:`tmp/manual-html/${lang}-desktop.png`});
  await page.setViewportSize({width:390,height:844});
  assert(!(await page.locator('#manual-contents-list').isVisible()));
  await page.locator('.contents-toggle').click(); assert(await page.locator('#manual-contents-list').isVisible());
  await page.keyboard.press('Escape'); assert(!(await page.locator('#manual-contents-list').isVisible()));
  await page.locator('.contents-toggle').click(); await page.locator('aside a[href="#story"]').click();
  assert(!(await page.locator('#manual-contents-list').isVisible()));
  await page.waitForFunction(()=>document.querySelector('aside a[href="#story"]').getAttribute('aria-current')==='location');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.manual-content:not(.manual-tools)')).backgroundColor),'rgb(255, 255, 255)');
  await page.locator('#nav-toggle').click(); assert(await page.locator('[data-nav-help]').isVisible()); await page.screenshot({path:`tmp/manual-html/${lang}-mobile.png`}); await page.locator('#nav-toggle').click();
  await page.evaluate(()=>scrollTo(0,1200));
  if((await page.viewportSize()).width>900){await page.waitForTimeout(150);assert(await page.evaluate(()=>{const a=document.querySelector('.layout>aside').getBoundingClientRect(),b=document.querySelector('.manual-tools').getBoundingClientRect();return Math.abs(a.top-b.bottom-12)<2;}));}
  await page.locator('#go-to-bottom').click(); await page.waitForFunction(()=>scrollY>500);
  assert(await page.evaluate(()=>{const a=document.querySelector('.manual-tools').getBoundingClientRect(),b=document.querySelector('.breadcrumbs').getBoundingClientRect();return Math.abs(a.top-b.bottom)<2;}));
  await page.locator('#back-to-top').click(); await page.waitForFunction(()=>scrollY<5);
  await page.locator('#site-footer').scrollIntoViewIfNeeded();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`tmp/manual-html/${lang}-footer-mobile.png`});
  await page.locator('#guide-topic').selectOption('reading');assert.equal(await page.locator('.guide-section:visible').count(),3);
  await page.locator('#story .screenshot').click();await page.locator('#close-dialog').click();assert(!(await page.locator('dialog').isVisible()));
  assert.deepEqual(errors,[]);await ctx.close();
  const nojs=await browser.newContext({javaScriptEnabled:false});const fallback=await nojs.newPage();await fallback.goto(`${base}/${lang}/user-manual.html`);assert.equal(await fallback.locator('.guide-section:visible').count(),12);await nojs.close();
  console.log('PASS',lang,'content, search, filters, URL state, anchors, dialog, print, mobile/dark, no-JS');
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
