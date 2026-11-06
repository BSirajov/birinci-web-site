from pathlib import Path
from chrome_restore import ensure_site_js_stable_story_spy


def test_story_spy_fix_survives_rebuild_and_is_idempotent():
    current = (Path(__file__).resolve().parents[1] / 'assets/site.js').read_text(encoding='utf-8')
    start = current.index('      // A new breadcrumb can wrap')
    end = current.index('      return candidate;', start) + len('      return candidate;')
    rebuilt = current[:start] + '      return active || visible[0].link;' + current[end:]
    assert ensure_site_js_stable_story_spy(rebuilt) == current
    assert ensure_site_js_stable_story_spy(current) == current
