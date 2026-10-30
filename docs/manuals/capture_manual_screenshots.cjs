const {chromium}=require('C:/Users/BSira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve('deployment');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(e?'Not found':b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({channel:'msedge',headless:true});const records=[];try{
for(const lang of (process.argv.slice(2).length?process.argv.slice(2):['az','en','de','ru','ky'])){
 const dir=path.resolve('docs/manuals/screenshots-20261030',lang);fs.mkdirSync(dir,{recursive:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:'light'});
 await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const page=await ctx.newPage();page.setDefaultTimeout(12000);
 const go=async url=>{await page.goto(base+'/'+lang+'/'+url,{waitUntil:'domcontentloaded'});await page.waitForTimeout(600);};
 const shot=async name=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0).map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:path.join(dir,name+'.png')});records.push({lang,name,url:page.url().replace(base,'https://birinci.cloud')});};
 await go('index.html?view=cards');await shot('home');
 await page.locator('.lang-switcher__toggle').click();await shot('languages');await page.keyboard.press('Escape');
 await page.locator('#global-search-toggle').click();await page.locator('#global-search-input').fill({az:'dost',en:'friend',de:'Freund',ru:'друг',ky:'дос'}[lang]);await page.waitForTimeout(700);await shot('search');await page.keyboard.press('Escape');
 await go('categories/dostluq-ve-insan-munasibetleri.html');await shot('category');
 const story=page.locator('#friendship-of-horses');await story.scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollBy(0,-100));await shot('story');
 await story.locator('.story__title').click();await page.locator('.text-lightbox').waitFor({state:'visible'});await page.locator('.text-lightbox__copy').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('reading');await page.keyboard.press('Escape');
 await story.locator('.story__figure-open').click();await page.locator('.illustration-lightbox').waitFor({state:'visible'});await shot('illustration');await page.keyboard.press('Escape');
 await story.locator('a.story-multilingual-btn').click();const frame=page.frameLocator('#story-compare-overlay iframe');await frame.locator('#sc-pager-num').waitFor({state:'visible'});await page.waitForTimeout(700);
 // Two columns keep the printed example readable. This is a normal user preference.
 for(const code of ['de','ky','ru']){const button=frame.locator('[data-sc-lang="'+code+'"]');if(await button.count()&&await button.getAttribute('aria-pressed')==='true')await button.click();}
 await shot('comparison');await page.keyboard.press('Escape');
 await go('feedback.html');await page.locator('#feedbackForm').scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollTo(0,document.querySelector('#feedbackForm').getBoundingClientRect().top+scrollY-110));await shot('feedback');
 await page.evaluate(()=>window.scrollTo(0,document.querySelector('#app-file-uploads').getBoundingClientRect().top+scrollY-145));await page.waitForTimeout(250);await shot('attachment');
 await go('sitemap.html');await shot('sitemap');
 await page.locator('#site-footer').scrollIntoViewIfNeeded();await shot('footer');
 await go('about/mission-vision-values.html');await shot('mission');
 await ctx.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,colorScheme:'light'});await mobile.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const mp=await mobile.newPage();await mp.goto(base+'/'+lang+'/index.html?view=cards');await mp.locator('#nav-toggle').click();await mp.waitForTimeout(300);await mp.screenshot({path:path.join(dir,'mobile.png')});await mobile.close();console.log('Captured',lang,14,'screenshots');
}fs.writeFileSync('tmp/manual-refresh/screenshot-records.json',JSON.stringify(records,null,2));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
