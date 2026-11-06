const fs=require('node:fs'),path=require('node:path');
const dir=process.env.QA_REPORT_DIR||'docs/reviews/language-switch-20261102';
const base=process.env.QA_BASE||'http://127.0.0.1:8775';
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(base))throw Error('These exhaustive tests are local-only.');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'story-build-manifest.json'),'utf8'));
const inventory=Object.entries(manifest).flatMap(([lang,catalog])=>catalog.categories.flatMap(category=>category.stories.map(story=>({lang,id:story.stem,title:story.title,category:category.slug,route:lang+'/'+(story.href||`categories/${category.slug}.html#${story.stem}`)}))));
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'inventory.json'),JSON.stringify(inventory,null,2));
module.exports={dir,base,inventory,langs:Object.keys(manifest).sort()};
