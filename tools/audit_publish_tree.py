"""Read-only link, metadata, and exposure audit of the generated publish tree."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from collections import Counter
import argparse, json, re
import xml.etree.ElementTree as ET
from lxml import html

def audit(root):
    root=root.resolve(); errors=[]; warnings=[]; pages={}; refs=0
    for p in root.rglob('*.html'):
        tree=html.fromstring(p.read_text(encoding='utf-8'));pages[p]=tree
    names={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    anchors={p:set(t.xpath('//@id | //a/@name')) for p,t in pages.items()}
    for p,t in pages.items():
        rel=p.relative_to(root).as_posix()
        def fail(kind,detail):errors.append({'file':rel,'kind':kind,'detail':detail})
        for value,n in Counter(t.xpath('//@id')).items():
            if n>1:fail('duplicate-id',value)
        for tag,xp in [('title','//title'),('language','/html/@lang'),('h1','//h1'),('main','//main')]:
            if len(t.xpath(xp))!=1:fail(tag,str(len(t.xpath(xp))))
        for img in t.xpath('//img[not(@alt)]'):fail('missing-alt',img.get('src',''))
        noindex=any('noindex' in v.lower() for v in t.xpath('//meta[@name="robots"]/@content'))
        if not noindex and rel!='404.html':
            canonical=t.xpath('//link[@rel="canonical"]/@href')
            if len(canonical)!=1 or (unquote(urlsplit(canonical[0]).path).lstrip('/') or 'index.html')!=rel:fail('canonical',str(canonical))
            if not t.xpath('//meta[@name="description" and string-length(@content)>0]'):fail('description','missing')
        for script in t.xpath('//script[@type="application/ld+json"]'):
            try:json.loads(script.text or '')
            except ValueError:fail('structured-data','invalid JSON')
        for alt in t.xpath('//link[@rel="alternate" and @hreflang]'):
            lang=alt.get('hreflang');u=urlsplit(alt.get('href',''));target=(root/unquote(u.path).lstrip('/')).resolve()
            if target in pages and lang!='x-default' and pages[target].get('lang')!=lang:fail('hreflang-language',alt.get('href'))
        for node in t.xpath('//*[@href or @src or @data-src or @action]'):
            for attr in ('href','src','data-src','action'):
                raw=node.get(attr)
                if not raw:continue
                u=urlsplit(raw)
                if u.scheme and u.scheme not in {'http','https'}:continue
                if u.netloc and u.netloc not in {'birinci.cloud','www.birinci.cloud'}:continue
                refs+=1
                target=(root/unquote(u.path).lstrip('/') if u.path.startswith('/') or u.netloc else p.parent/unquote(u.path)) if u.path else p
                target=target.resolve()
                if target.is_dir():target=target/'index.html'
                if not target.is_relative_to(root):fail('outside-root',raw);continue
                if target.relative_to(root).as_posix() not in names:fail('missing-target',raw);continue
                if u.fragment and target in anchors and unquote(u.fragment) not in anchors[target]:
                    fail('missing-fragment',raw)
        for a in t.xpath('//a[@target="_blank"]'):
            if 'noopener' not in a.get('rel','').split():warnings.append({'file':rel,'kind':'external-tab-rel','detail':a.get('href')})
    for name in names:
        parts=Path(name).parts
        if any(v.lower() in {'.git','.env','backup','_backups','_reviews','tmp','tools','api'} for v in parts) or Path(name).suffix.lower() in {'.docx','.pdf','.zip','.py','.db'}:
            errors.append({'file':name,'kind':'authoring-exposure','detail':''})
        if Path(name).suffix.lower() in {'.html','.js','.json','.php','.css','.txt'}:
            content=(root/name).read_text(encoding='utf-8',errors='replace')
            if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[A-Z0-9]{16}\b|\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b',content):
                errors.append({'file':name,'kind':'possible-secret','detail':'credential signature; value withheld'})
    sitemap=root/'sitemap.xml'
    if sitemap.exists():
        for loc in ET.parse(sitemap).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
            target=unquote(urlsplit(loc.text or '').path).lstrip('/') or 'index.html'
            if target not in names:errors.append({'file':'sitemap.xml','kind':'sitemap-target','detail':target})
    return {'pages':len(pages),'references':refs,'errors':errors,'warnings':warnings,'error_counts':dict(Counter(e['kind'] for e in errors))}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]/'deployment');ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    result=audit(args.root);args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k not in {'errors','warnings'}}));raise SystemExit(bool(result['errors']))
