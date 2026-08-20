from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = API_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=API_DIR / ".env", extra="ignore")

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
