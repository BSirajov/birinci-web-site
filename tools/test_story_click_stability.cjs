const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:8890';
(async()=>{
 const browser=await chromium.launch(process.env.QA_CHROME?{executablePath:process.env.QA_CHROME}:{});
 try{for(const mobile of [false,true])for(const lang of ['az','de','en','ru','ky']){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,colorScheme:mobile?'dark':'light',reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/${lang}/index.html?view=list`);
  await page.waitForFunction(()=>!!window.__BIRINCI_STORIES__ && document.querySelector('.story-nav [data-stem]'));
  await page.evaluate(()=>{for(let i=0;i<12;i++){const b=document.querySelector('[data-home-stories-more]');if(!b||b.hidden)break;b.click()}window.KT_SIDEBAR_TOC_GROUPS.expandAll(document.querySelector('.story-nav .sidebar-widget'));});
  for(const id of ['father-and-son','friend-of-allah','keep-your-self-respect']){
   if(mobile)await page.locator('.stories-drawer-launch').click();
   await page.evaluate(id=>document.querySelector(`.story-nav li[data-stem="${id}"] a`).click(),id);
   await page.waitForTimeout(150);
   const snapshot=()=>page.evaluate(id=>({top:document.getElementById(id).getBoundingClientRect().top,active:document.querySelector('.story-nav a.tl-active')?.getAttribute('href'),side:document.querySelector('.story-nav .widget-body').scrollTop}),id);
   const first=await snapshot();await page.waitForTimeout(1050);const after=await snapshot();
   assert.equal(after.active,'#'+id,lang+' chosen story stays active');
   assert.ok(Math.abs(after.top-first.top)<=2,lang+' reader must not jump');
   assert.ok(Math.abs(after.side-first.side)<=2,lang+' menu must not jump');
  }
  // Main-pane reading order differs from the alphabetized panel order.
  for(const id of ['father-and-son','friend-of-allah','shepherds-word']){
   await page.evaluate(id=>{const el=document.getElementById(id);const offset=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sticky-stack-bottom'))||180;window.scrollTo({top:scrollY+el.getBoundingClientRect().top-offset+20,behavior:'instant'});},id);
   await page.waitForTimeout(250);
   assert.equal(await page.locator('.story-nav a.tl-active').getAttribute('href'),'#'+id,lang+' spy follows reading pane');
  }
  assert.deepEqual(errors,[]);console.log('PASS '+lang+' '+(mobile?'mobile/dark':'desktop/light')+': stable selection and document-order scroll tracking');await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
