"""Publish policy helpers used by SEO + deployment."""
from publish_policy import publish_discoveries_enabled


def test_retired_story_assets_are_excluded_from_publication():
    from build_deployment import IGNORE_PUBLISH
    from unpublished_stories import UNPUBLISHED_STEMS
    names = [stem + '.webp' for stem in UNPUBLISHED_STEMS] + ['active-story.webp']
    ignored = IGNORE_PUBLISH('wisdom-stories/illustrations', names)
    assert ignored == set(names[:-1])


def test_default_hides_discoveries(monkeypatch):
    monkeypatch.delenv("BIRINCI_PUBLISH_DISCOVERIES", raising=False)
    assert publish_discoveries_enabled() is False


def test_env_enables_discoveries(monkeypatch):
    monkeypatch.setenv("BIRINCI_PUBLISH_DISCOVERIES", "1")
    assert publish_discoveries_enabled() is True


def test_flag_overrides_env(monkeypatch):
    monkeypatch.setenv("BIRINCI_PUBLISH_DISCOVERIES", "1")
    assert publish_discoveries_enabled(flag=False) is False
    monkeypatch.delenv("BIRINCI_PUBLISH_DISCOVERIES", raising=False)
    assert publish_discoveries_enabled(flag=True) is True
