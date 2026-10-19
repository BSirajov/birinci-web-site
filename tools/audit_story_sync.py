"""Verify all five languages' active DOCX sources, catalogs, HTML and search."""
from pathlib import Path
from copy import deepcopy
import argparse, importlib, json, re
from lxml import html
import rebuild_stories_from_docx as rebuild
from dev_story_edit_server import _load_json_assignment
from i18n_config import SUPPORTED_LANGS

ROOT=Path(__file__).resolve().parents[1]
PATTERNS={'az':r'(?:ibrət|nəticə)','en':r'(?:moral|lesson)','ru':r'(?:мораль|урок)','ky':'сабак','de':r'(?:moral|(?:die )?lehre)'}
POEMS={'flowers','my-lifes-journey','pandemic-and-quarantine','reflections','time-has-passed'}
def norm(s):return ' '.join(s.split())
def text(n):
    n=deepcopy(n)
    for b in n.xpath('.//br'):b.text='\n'
    return norm(n.text_content())
def active(p):return not any(v.lower() in {'backup','_backups','_reviews','archive'} for v in p.parts) and not p.name.startswith('~$') and 'combined' not in p.stem.lower()
def parse(path,lang):
    paras=rebuild.read_docx_paragraphs(path)
    if lang=='en' and path.stem=='not-my-concern':paras=paras[paras.index('English')+1:]
    combined=[]
    for p in paras:
        if combined and re.fullmatch('^'+PATTERNS[lang]+r'\s*:',combined[-1],re.I):combined[-1]+=' '+p
        else:combined.append(p)
    paras=combined;title=norm(paras.pop(0));moral=''
    mi=next((i for i in range(len(paras)-1,-1,-1) if rebuild.MORAL_RE.match(paras[i])),None)
    if mi is not None:
        moral=paras[mi];body=paras[:mi]
        if lang=='de':moral=re.sub('^'+PATTERNS[lang]+r'\s*:', 'Lehre:',moral,flags=re.I)
    else:
        assert lang=='az' and path.stem in POEMS,'Missing moral '+str(path)
        body=paras[:-1]
    return title,[norm(p) for p in body]+([norm(moral)] if moral else [])

def audit(root=ROOT):
    result={};errors=[]
    for lang in SUPPORTED_LANGS:
        importlib.reload(rebuild);rebuild.MORAL_RE=re.compile('^'+PATTERNS[lang]+r'\s*:',re.I)
        _,catalog,_=_load_json_assignment(root/lang/'assets/stories-data.js','window.__BIRINCI_STORIES__')
        entries=[s for c in catalog['categories'] for s in c['stories']];stories={s['stem']:s for s in entries}
        docs=[p for p in (root/lang/'wisdom-stories').rglob('*.docx') if active(p)];sources={p.stem:p for p in docs}
        expected_count=261 if lang=='az' else 256
        def check(ok,detail):
            if not ok:errors.append({'language':lang,'detail':detail})
        check(len(docs)==len(sources)==len(entries)==len(stories)==expected_count,'Inventory count or duplicate mismatch')
        check(set(sources)==set(stories),'Source/catalog identifiers differ')
        _,search,_=_load_json_assignment(root/lang/'assets/search-index.js','window.__BIRINCI_SEARCH__');search={s['stem']:s for s in search if s.get('stem') in stories}
        titles={};texts={};exceptions=[]
        for stem,s in stories.items():
            if stem not in sources:continue
            title,body=parse(sources[stem],lang);titles[stem]=title;texts[stem]=body
            if lang=='az' and title!=s['title'] and title.replace('İ','i').replace('I','ı').lower()==s['title'].replace('İ','i').replace('I','ı').lower():
                exceptions.append({'stem':stem,'word':title,'website':s['title']});title=s['title']
            check(title==s['title'],'Catalog title '+stem)
            check(body==[norm(p) for p in s['paragraphs'][:len(body)]],'Catalog text '+stem)
            e=search.get(stem,{})
            check(e.get('title')==s['title'],'Search title '+stem)
            check(all(p.lower() in norm(e.get('hay','')) for p in [title,*body]),'Search text '+stem)
        copies=0;seen=set()
        for p in (root/lang).rglob('*.html'):
            if not active(p) or any(v in {'wisdom-stories','discovery-articles','assets'} for v in p.parts):continue
            tree=html.fromstring(p.read_text(encoding='utf-8'))
            for a in tree.xpath('//article[@id]'):
                stem=a.get('id')
                if stem not in texts:continue
                copies+=1;seen.add(stem);hs=a.xpath('.//*[contains(@class,"story__title")]');ps=a.xpath('.//div[contains(@class,"story__text")]/p')
                check(bool(hs) and text(hs[0])==stories[stem]['title'],str(p.relative_to(root))+' title '+stem)
                check([text(v) for v in ps[:len(texts[stem])]]==texts[stem],str(p.relative_to(root))+' text '+stem)
        check(seen==set(stories),'Stories missing from HTML')
        result[lang]={'sources':len(sources),'stories':len(stories),'article_copies':copies,'title_presentation_exceptions':exceptions}
    return {'languages':result,'errors':errors}
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);args=ap.parse_args();result=audit();args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'counts':{l:v['sources'] for l,v in result['languages'].items()},'errors':result['errors']},ensure_ascii=False));raise SystemExit(bool(result['errors']))
