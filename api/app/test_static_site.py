import json
import pytest
from app.static_site import static_languages, static_root

def test_production_requires_publish_tree(tmp_path):
    (tmp_path/'index.html').write_text('authoring site')
    with pytest.raises(RuntimeError):static_root(tmp_path, True)
    public=tmp_path/'deployment';public.mkdir();(public/'index.html').write_text('public site')
    assert static_root(tmp_path, True)==public
    assert static_root(tmp_path, False)==tmp_path

def test_languages_include_german_and_exclude_disabled(tmp_path):
    (tmp_path/'languages.json').write_text(json.dumps({'languages':[{'code':'en'},{'code':'de'},{'code':'fr','enabled':False},{'code':'../secret'}]}))
    assert static_languages(tmp_path)==('en','de')
