/* Local regression for breadcrumb wrapping and mobile story interactions.
   Run with the site served at BIRINCI_TEST_URL (default localhost:8775). */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.BIRINCI_TEST_URL||'http://127.0.0.1:8775';
(async()=>{
 const browser=await chromium.launch();
 try {
  for(const lang of ['az','en','de','ru','ky']) for(const colorScheme of ['light','dark']) {
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/${lang}/categories/hikmet-ve-heyat-dersleri.html#light-of-the-world`);
   const story=page.locator('article#light-of-the-world');
   await story.locator('.story__title').waitFor();
   await page.waitForTimeout(1200); // Allow initial anchor correction and sticky measurements.
   const positions=await page.evaluate(async()=>{
    const samples=[];
    for(let i=0;i<20;i++) {
     const story=document.querySelector('article#light-of-the-world');
     samples.push({top:story.getBoundingClientRect().top,crumb:document.querySelector('.breadcrumbs').textContent});
     await new Promise(r=>setTimeout(r,50));
    }
    return samples;
   });
   assert.equal(new Set(positions.map(p=>p.crumb)).size,1,`${lang}: breadcrumb oscillation`);
   assert.ok(Math.max(...positions.map(p=>p.top))-Math.min(...positions.map(p=>p.top))<1,`${lang}: unstable story position`);
   const img=story.locator('.story__figure img');
   await img.scrollIntoViewIfNeeded({timeout:5000});
   await page.waitForFunction(()=>document.querySelector('article#light-of-the-world .story__figure img').naturalWidth>0);
   await story.locator('.story__title').click({timeout:5000});
   await page.locator('.text-lightbox').waitFor({state:'visible'});
   await page.keyboard.press('Escape');
   // Moving past a story in either direction must still update the active crumb.
   const neighbors=await story.evaluate(el=>{
    const all=[...document.querySelectorAll('article.story')];const i=all.indexOf(el);
    return [all[i+1]?.id,all[i-1]?.id].filter(Boolean);
   });
   for(const id of neighbors) {
    await page.evaluate(id=>{
     const el=document.getElementById(id);
     window.scrollTo({top:scrollY+el.getBoundingClientRect().top,behavior:'instant'});
    },id);
    await page.waitForFunction(id=>{
     const a=document.querySelector(`.timeline-list a[href="#${CSS.escape(id)}"]`);
     return a&&a.getAttribute('aria-current')==='true';
    },id,{timeout:5000});
   }
   assert.deepEqual(errors,[]);console.log(`PASS ${lang} mobile ${colorScheme}: stable breadcrumb, image, expanded reading, bidirectional scroll spy`);
   await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
