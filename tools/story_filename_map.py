"""English-title filename mapping shared by the editor and recovered builder."""
import json,re,types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'tools/story-filenames.json').read_text(encoding='utf-8'))
def source_path(lang,stem):
    rel=DATA['sources'].get(lang,{}).get(stem)
    if rel is None: raise ValueError(f'Unknown story: {lang}/{stem}')
    return ROOT/rel
def remap_code(code):
    def convert(x):
        if isinstance(x,types.CodeType):return remap_code(x)
        if isinstance(x,str):
            if x in DATA['aliases']:return DATA['aliases'][x]
            return re.sub(r'([a-z0-9_’-]+)(?=\.(?:docx|mp3|webp|png)\b)',lambda m:DATA['aliases'].get(m[0],m[0]),x)
        if isinstance(x,tuple):return tuple(convert(v) for v in x)
        if isinstance(x,frozenset):return frozenset(convert(v) for v in x)
        return x
    return code.replace(co_consts=tuple(convert(x) for x in code.co_consts))
