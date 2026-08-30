"""Publish policy helpers used by SEO + deployment."""
from publish_policy import publish_discoveries_enabled


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
