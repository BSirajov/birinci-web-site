from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = API_DIR.parent

WEAK_SECRET_KEYS = frozenset(
    {
        "dev-only-change-me",
        "change-me-in-production-use-a-long-random-string",
        "test-secret-key-not-for-prod",
        "secret",
        "changeme",
    }
)

PRODUCTION_ENV_ALIASES = frozenset({"production", "prod"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=API_DIR / ".env", extra="ignore")

    # development | production (also accepts APP_ENV=prod)
    app_env: str = "development"
    secret_key: str = "dev-only-change-me"
    debug: bool = True
    public_base_url: str = "http://127.0.0.1:8088"
    database_url: str = "sqlite:///./var/birinci.db"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    session_days: int = 30
    session_cookie: str = "birinci_session"
    csrf_cookie: str = "birinci_csrf"
    admin_email: str = ""
    password_min_length: int = 10

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in PRODUCTION_ENV_ALIASES


def production_config_errors(settings: Settings) -> list[str]:
    """Return human-readable problems that must block a production boot."""
    if not settings.is_production:
        return []

    errors: list[str] = []
    secret = (settings.secret_key or "").strip()
    if not secret or secret.lower() in WEAK_SECRET_KEYS or len(secret) < 32:
        errors.append(
            "SECRET_KEY must be a unique random string of at least 32 characters "
            "(not a documented example / default)"
        )
    if settings.debug:
        errors.append("DEBUG must be false in production")
    if not settings.cookie_secure:
        errors.append("COOKIE_SECURE must be true in production (HTTPS)")
    base = (settings.public_base_url or "").strip().rstrip("/")
    if not base.startswith("https://"):
        errors.append("PUBLIC_BASE_URL must be an https:// public origin")
    if "127.0.0.1" in base or "localhost" in base.lower():
        errors.append("PUBLIC_BASE_URL must not point at localhost")
    db = (settings.database_url or "").strip().lower()
    if db.startswith("sqlite:"):
        errors.append("DATABASE_URL must not use SQLite in production (use MySQL/MariaDB)")
    return errors


def assert_runtime_safe(settings: Settings | None = None) -> Settings:
    """Refuse to start when APP_ENV is production and config is unsafe."""
    cfg = settings if settings is not None else get_settings()
    errors = production_config_errors(cfg)
    if errors:
        joined = "; ".join(errors)
        raise SystemExit(f"Refusing to start (APP_ENV={cfg.app_env!r}): {joined}")
    return cfg


@lru_cache
def get_settings() -> Settings:
    return Settings()
