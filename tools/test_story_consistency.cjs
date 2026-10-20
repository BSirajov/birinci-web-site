/* Local browser regression matrix. Set QA_BASE to a local publish-tree server. */
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.QA_BASE||'http://127.0.0.1:8877';
if(!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(base))throw Error('Run the broad matrix locally, not against production');
const langs=['az','en','ru','ky','de'];
const results=[];
(async()=>{const browser=await chromium.launch();try{
 for(const width of [390,1280])for(const colorScheme of ['light','dark']){
 const ctx=await browser.newContext({viewport:{width,height:900},colorScheme});const p=await ctx.newPage();
 for(const lang of langs){
 const files=fs.readdirSync(`${lang}/categories`).filter(x=>x.endsWith('.html')&&fs.readFileSync(`${lang}/categories/${x}`,'utf8').includes('class="story '));
 for(const file of files){
  const url=`${base}/${lang}/categories/${file}`;assert.equal((await p.goto(url)).status(),200);
  await p.locator('article.story .story__source').first().waitFor();
  const state=await p.evaluate(()=>({
   stories:document.querySelectorAll('article.story').length,
   linkedTitles:document.querySelectorAll('article.story .story__title a').length,
   overflow:[...document.querySelectorAll('.story__moral,.story__source-line')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+1).length,
   badColors:[...document.querySelectorAll('.story__moral')].filter(e=>getComputedStyle(e).backgroundColor!==(matchMedia('(prefers-color-scheme: dark)').matches?'rgb(51, 46, 32)':'rgb(255, 249, 230)')).length
  }));
  assert.equal(state.linkedTitles,0,url);assert.equal(state.overflow,0,url);assert.equal(state.badColors,0,url);
  if(file===files[0]){
   const title=p.locator('article.story .story__title').first();await title.click();await p.locator('.text-lightbox').waitFor({state:'visible'});await p.keyboard.press('Escape');await p.locator('.text-lightbox').waitFor({state:'hidden'});
   const stem=await p.locator('article.story').first().getAttribute('id');
   await p.goto(url+'#'+stem);await p.locator('.lang-switcher__toggle').first().click();
   for(const target of langs){const href=await p.locator(`.lang-switcher a[data-lang="${target}"]`).first().getAttribute('href');assert.ok(href.includes('/'+target+'/categories/'),href);assert.ok(href.endsWith('#'+stem),href);}
   await p.keyboard.press('Escape');
  }
  results.push({lang,file,width,colorScheme,...state});
 }
 console.log(`PASS ${lang} ${width} ${colorScheme}: ${files.length} category pages`);
 }
 await ctx.close();
 }
 console.log('PASS '+results.length+' category rendering checks; title modal and language targets in each locale/mode');
}finally{fs.mkdirSync('tmp/consistency',{recursive:true});fs.writeFileSync('tmp/consistency/results.json',JSON.stringify(results,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
