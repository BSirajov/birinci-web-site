from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from app.config import API_DIR, get_settings


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferred_locale: Mapped[str] = mapped_column(String(8), default="az")
    avatar_filename: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    sessions: Mapped[list[Session]] = relationship(back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="sessions")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    # JSON works on MySQL 5.7+ / MariaDB 10.2+ and SQLite.
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


def resolve_database_url(url: str) -> str:
    """Normalize DATABASE_URL for SQLAlchemy (drivers + absolute SQLite paths)."""
    raw = (url or "").strip()
    if raw.startswith("mysql://"):
        raw = "mysql+pymysql://" + raw.removeprefix("mysql://")
    elif raw.startswith("mariadb://"):
        raw = "mysql+pymysql://" + raw.removeprefix("mariadb://")
    if raw.startswith("sqlite:///./"):
        rel = raw.removeprefix("sqlite:///./")
        path = (API_DIR / rel).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{path.as_posix()}"
    if raw.startswith("sqlite:///"):
        raw_path = raw.removeprefix("sqlite:///")
        path = Path(raw_path)
        if not path.is_absolute():
            path = (API_DIR / path).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{path.as_posix()}"
    return raw


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite:")


settings = get_settings()
DATABASE_URL = resolve_database_url(settings.database_url)

_engine_kwargs: dict[str, Any] = {}
if _is_sqlite(DATABASE_URL):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    """Apply Alembic migrations to head.

    If an older database already has tables but no alembic_version row
    (pre-migration SQLite), stamp the baseline instead of recreating tables.
    """
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import inspect

    cfg = Config(str(API_DIR / "alembic.ini"))
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "users" in tables and "alembic_version" not in tables:
        command.stamp(cfg, "head")
        return
    command.upgrade(cfg, "head")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
