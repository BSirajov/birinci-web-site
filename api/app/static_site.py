"""Keep authoring files out of the API's production static mounts."""
import json
from pathlib import Path

def static_root(repo: Path, production: bool) -> Path:
    root = repo / 'deployment' if production else repo
    if production and not (root / 'index.html').is_file():
        raise RuntimeError('Build deployment/ before starting the production API')
    return root

def static_languages(root: Path) -> tuple[str, ...]:
    data = json.loads((root / 'languages.json').read_text(encoding='utf-8'))
    return tuple(item['code'] for item in data['languages']
                 if item.get('enabled', True) and item.get('implemented', True)
                 and isinstance(item.get('code'), str) and item['code'].isalpha())
