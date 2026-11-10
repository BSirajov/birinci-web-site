"""Generate bounded reading-size images; full-resolution artwork stays intact."""
import json
from pathlib import Path
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps

def build(root):
    jobs = []
    for lang in ('az','en','de','ru','ky'):
        catalog = json.loads((root/lang/'assets/stories-data.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
        for category in catalog['categories']:
            for story in category['stories']:
                src = root/lang/unquote(story.get('image') or f"wisdom-stories/illustrations/{story.get('imageStem') or story['stem']}.webp")
                dst = root/lang/'assets/story-previews'/(story['stem']+'.webp')
                jobs.append((src,dst))
    def render(job):
        src,dst=job
        dst.parent.mkdir(parents=True,exist_ok=True)
        with Image.open(src) as im:
            preview=ImageOps.contain(im.convert('RGB'),(960,960),Image.Resampling.LANCZOS)
            preview.save(dst,format='WEBP',quality=88,method=4)
        return src.stat().st_size,dst.stat().st_size
    with ThreadPoolExecutor(max_workers=4) as pool:
        sizes=list(pool.map(render,jobs))
    print(f'Story previews: {len(jobs)}; originals {sum(x for x,y in sizes):,} bytes; previews {sum(y for x,y in sizes):,} bytes')
    return sizes

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path('deployment'));args=parser.parse_args();build(args.root)
