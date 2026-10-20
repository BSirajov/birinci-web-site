const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:8877';
if(!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(base))throw Error('Local tests only');
(async()=>{const b=await chromium.launch();try{
 for(const width of [390,1280])for(const colorScheme of ['light','dark']){
 const c=await b.newContext({viewport:{width,height:900},colorScheme});const p=await c.newPage();p.setDefaultTimeout(10000);
 for(const lang of ['az','en','ru','ky','de']){
 await p.goto(`${base}/${lang}/index.html?view=list`);
 await p.locator('article.story:visible .story__title').first().waitFor();
 await p.locator('article.story:visible .story__title').first().click();await p.locator('.text-lightbox').waitFor({state:'visible'});await p.keyboard.press('Escape');
 const search=p.locator('[data-tools-search]').first();await search.fill('zzzzzz-no-story');await p.waitForTimeout(400);assert.equal(await p.locator('article.story:visible').count(),0);
 await search.fill('');await p.locator('article.story').first().waitFor();
 await p.locator('article.story:visible .story-multilingual-btn').first().click();
 await p.locator('#story-compare-overlay').waitFor({state:'visible'});
 await p.locator('#story-compare-overlay iframe').contentFrame().locator('.sc-col__text').first().waitFor();
 await p.locator('[data-story-compare-close]').click();
 const target=lang==='de'?'en':'de';
 await p.locator('.lang-switcher__toggle').first().click();await p.locator(`.lang-switcher a[data-lang="${target}"]`).first().click();
 await p.waitForFunction(t=>document.documentElement.lang===t,target);await p.locator('article.story:visible .story__title').first().waitFor();
 await p.locator('article.story:visible .story__title').first().click();await p.locator('.text-lightbox').waitFor({state:'visible'});await p.keyboard.press('Escape');
 console.log(`PASS home search, title, comparison, language switch ${lang} ${width} ${colorScheme}`);
 }
 await c.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});


