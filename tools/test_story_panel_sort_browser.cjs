const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const base=process.env.QA_BASE||'http://127.0.0.1:8889';
const baseline=execFileSync('git',['show','HEAD:assets/site.js'],{encoding:'utf8',maxBuffer:4*1024*1024});
const langs=['az','de','en','ru','ky'];
const expected=Object.fromEntries(langs.map(lang=>{const raw=fs.readFileSync(`${lang}/assets/stories-data.js`,'utf8');const data=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));const collator=new Intl.Collator(lang,{sensitivity:'accent'});return [lang,data.categories.slice().sort((a,b)=>collator.compare(a.title,b.title))]}));
async function ready(page){
 await page.waitForFunction(()=>!!window.__BIRINCI_STORIES__ && document.querySelectorAll('.story-nav [data-stem]').length>0);
 await page.evaluate(()=>{for(let i=0;i<12;i++){const b=document.querySelector('[data-home-stories-more]');if(!b||b.hidden)break;b.click();}});
 await page.waitForFunction(()=>document.querySelectorAll('.story-nav .toc-group').length===12);
}
async function snapshot(page){return page.evaluate(()=>({
 groups:Array.from(document.querySelectorAll('.story-nav .toc-group'),g=>g.dataset.tocCat),
 links:Array.from(document.querySelectorAll('.story-nav a[href]'),a=>[a.textContent,a.getAttribute('href')]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),
 switchers:Array.from(document.querySelectorAll('.lang-switcher a[data-lang]'),a=>[a.dataset.lang,a.getAttribute('href')]),
}));}
(async()=>{
 const browser=await chromium.launch(process.env.QA_CHROME?{executablePath:process.env.QA_CHROME}:{});
 try{
  for(const mobile of [false,true])for(const lang of langs){
   const options={viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,colorScheme:mobile?'dark':'light',reducedMotion:'reduce'};
   const oldContext=await browser.newContext(options);const oldPage=await oldContext.newPage();
   await oldPage.route('**/assets/site.js*',r=>r.fulfill({contentType:'text/javascript',body:baseline}));
   oldPage.setDefaultTimeout(20000);await oldPage.goto(`${base}/${lang}/index.html?view=list`);await ready(oldPage);
   const old=await snapshot(oldPage);await oldContext.close();
   const context=await browser.newContext(options);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   page.setDefaultTimeout(20000);await page.goto(`${base}/${lang}/index.html?view=list`);await ready(page);
   const now=await snapshot(page);
   assert.deepEqual(now.groups,expected[lang].map(g=>g.slug),lang+' group order');
   assert.deepEqual(now.links,old.links,lang+' links and labels');
   assert.deepEqual(now.switchers,old.switchers,lang+' language links');
   if(mobile){await page.locator('.stories-drawer-launch').click();await page.waitForFunction(()=>document.body.classList.contains('stories-drawer-open'));await page.locator('.stories-drawer-close').click();}
   const next=langs[(langs.indexOf(lang)+1)%langs.length];
   await page.evaluate(next=>document.querySelector(`.lang-switcher a[data-lang="${next}"]`).click(),next);
   await page.waitForURL(u=>u.pathname.startsWith('/'+next+'/'));await ready(page);
   assert.deepEqual((await snapshot(page)).groups,expected[next].map(g=>g.slug),lang+' switch to '+next);
   assert.deepEqual(errors,[],lang+' browser errors');
   console.log('PASS '+lang+' '+(mobile?'mobile/dark':'desktop/light')+': sorted groups, unchanged links, drawer and language switch');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
