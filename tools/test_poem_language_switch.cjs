const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:8775',dir='docs/reviews/language-switch-20261102';
const poems=JSON.parse(fs.readFileSync('tools/poem-translations.json','utf8'));
const inventory=require('./story_switch_test_support.cjs').inventory;
const restricted=process.env.POEM_RETRY||process.env.POEM_WIDTH;const previous=restricted?JSON.parse(fs.readFileSync(dir+'/poem-cases.json','utf8')):[];const caseKey=r=>[r.scenario,r.id,r.to,r.width||''].join('/');const shouldRun=r=>process.env.POEM_WIDTH?r.width===Number(process.env.POEM_WIDTH):!process.env.POEM_RETRY||previous.some(p=>caseKey(p)===caseKey(r)&&!p.pass);
(async()=>{
  const browser=await chromium.launch();const results=[];
  try {
    for(const id of Object.keys(poems))for(const to of ['en','de','ru','ky'])for(const width of [390,1280]){
      if(!shouldRun({id,to,width,scenario:'unavailable-poem'}))continue;
      const context=await browser.newContext({viewport:{width,height:900},colorScheme:width===390?'dark':'light',reducedMotion:'reduce'});
      const page=await context.newPage();let result={id,from:'az',to,width,scenario:'unavailable-poem'};
      try {
        const source=inventory.find(r=>r.id===id&&r.lang==='az');
        await page.goto(base+'/'+source.route);
        await page.waitForFunction(()=>window.__BIRINCI_STORIES__?.lang==='az');
        await page.evaluate(id=>scrollTo({top:scrollY+document.getElementById(id).getBoundingClientRect().top-240,behavior:'instant'}),id);
        await page.waitForTimeout(180);
        const before=await page.evaluate(()=>({url:location.href,y:scrollY,language:localStorage.getItem('birinci-lang')}));
        let navigations=0;page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())navigations++});
        await page.evaluate(to=>document.querySelector('.lang-switcher a[data-lang="'+to+'"]').click(),to);
        const notice=page.locator('[data-poem-translation-notice]');await notice.waitFor({state:'visible'});
        assert.equal(await notice.getAttribute('lang'),to);assert.ok((await notice.innerText()).length>20);
        assert.equal(page.url(),before.url);assert.equal(await page.locator('html').getAttribute('lang'),'az');
        assert.equal(await page.locator('.lang-switcher a[aria-selected="true"]').getAttribute('data-lang'),'az');
        assert.equal(await page.evaluate(()=>localStorage.getItem('birinci-lang')),before.language);
        assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before.y)<2);assert.equal(navigations,0);
        result.pass=true;result.message=await notice.innerText();
      }catch(e){result.pass=false;result.error=e.message.slice(0,500)}
      results.push(result);await context.close();
      console.log(id,to,width,result.pass);
    }
    // Fixture only: classify an existing translated story as a poem in memory.
    // No source, production route or story classification is changed by this test.
    for(const to of ['en','de','ru','ky']){
      if(!shouldRun({id:'friend-of-allah',to,scenario:'translated-poem-fixture'}))continue;
      const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),page=await context.newPage();
      let result={id:'friend-of-allah',from:'az',to,scenario:'translated-poem-fixture'};
      try{
        await page.goto(base+'/'+inventory.find(r=>r.lang==='az'&&r.id===result.id).route);
        await page.waitForFunction(()=>window.__BIRINCI_STORIES__?.lang==='az');
        await page.evaluate(()=>{window.__BIRINCI_STORY_ROUTES__.poems['friend-of-allah']=['az','en','de','ru','ky'];const el=document.getElementById('friend-of-allah');scrollTo({top:scrollY+el.getBoundingClientRect().top-240,behavior:'instant'})});
        await page.evaluate(to=>document.querySelector('.lang-switcher a[data-lang="'+to+'"]').click(),to);
        await page.waitForURL(u=>u.pathname.startsWith('/'+to+'/'));
        assert.equal(new URL(page.url()).hash,'#friend-of-allah');result.pass=true;
      }catch(e){result.pass=false;result.error=e.message.slice(0,500)}
      results.push(result);await context.close();
    }
    if(restricted){fs.writeFileSync(dir+(process.env.POEM_WIDTH?'/poem-before-mobile-recheck.json':'/poem-initial-observations.json'),JSON.stringify(previous,null,2));const updates=new Map(results.map(r=>[caseKey(r),r]));fs.writeFileSync(dir+'/poem-cases.json',JSON.stringify(previous.map(r=>updates.get(caseKey(r))||r),null,2))}else fs.writeFileSync(dir+'/poem-cases.json',JSON.stringify(results,null,2));console.log({total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length});
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
