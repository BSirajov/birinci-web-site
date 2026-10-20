const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.QA_BASE||'http://127.0.0.1:8877/deployment';
if(!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(base))throw Error('Local tests only');
const pages=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.html'))pages.push(p.replaceAll('\\','/').replace(/^deployment\//,''));}}
walk('deployment');
(async()=>{const b=await chromium.launch();const results=[];try{
for(const width of [390,1280])for(const colorScheme of ['light','dark']){
 const c=await b.newContext({viewport:{width,height:900},colorScheme});const p=await c.newPage();
 for(const file of pages){const errors=[];const handler=e=>errors.push(e.message);p.on('pageerror',handler);
 const response=await p.goto(base+'/'+file);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(80);
 const state=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,title:document.title}));
 results.push({file,width,colorScheme,status:response.status(),errors,...state});p.off('pageerror',handler);
 }
 console.log(`Checked ${pages.length} public pages ${width} ${colorScheme}`);await c.close();
}
}finally{fs.mkdirSync('tmp/consistency',{recursive:true});fs.writeFileSync('tmp/consistency/published-layout.json',JSON.stringify(results,null,2));await b.close();}
const failed=results.filter(r=>r.status!==200||r.overflow||r.errors.length);console.log(JSON.stringify({checks:results.length,failed}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
