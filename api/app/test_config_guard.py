"""Production config fail-closed checks (H1)."""

from app.config import Settings, assert_runtime_safe, production_config_errors


def _prod(**overrides) -> Settings:
    base = dict(
        app_env="production",
        secret_key="a" * 32,
        debug=False,
        public_base_url="https://birinci.cloud",
        database_url="mysql+pymysql://u:p@host:3306/db?charset=utf8mb4",
        cookie_secure=True,
    )
    base.update(overrides)
    return Settings(**base)


def test_development_defaults_are_allowed():
    s = Settings(
        app_env="development",
        secret_key="dev-only-change-me",
        debug=True,
        cookie_secure=False,
        public_base_url="http://127.0.0.1:8088",
        database_url="sqlite:///./var/birinci.db",
    )
    assert production_config_errors(s) == []
    assert_runtime_safe(s)


def test_production_accepts_strong_config():
    s = _prod()
    assert production_config_errors(s) == []
    assert_runtime_safe(s)


def test_production_rejects_weak_secret_and_debug():
    errs = production_config_errors(
        _prod(secret_key="dev-only-change-me", debug=True, cookie_secure=False)
    )
    assert any("SECRET_KEY" in e for e in errs)
    assert any("DEBUG" in e for e in errs)
    assert any("COOKIE_SECURE" in e for e in errs)


def test_production_rejects_localhost_and_sqlite():
    errs = production_config_errors(
        _prod(
            public_base_url="http://127.0.0.1:8088",
            database_url="sqlite:///./var/birinci.db",
        )
    )
    assert any("PUBLIC_BASE_URL" in e for e in errs)
    assert any("SQLite" in e for e in errs)


def test_assert_runtime_safe_exits_on_bad_prod():
    try:
        assert_runtime_safe(_prod(secret_key="short"))
        assert False, "expected SystemExit"
    except SystemExit as exc:
        assert "Refusing to start" in str(exc)
        assert "SECRET_KEY" in str(exc)


def test_prod_alias_triggers_checks():
    errs = production_config_errors(_prod(app_env="prod", secret_key="changeme"))
    assert errs
