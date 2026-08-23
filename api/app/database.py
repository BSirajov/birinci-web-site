from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker
from sqlalchemy.types import JSON

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

    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    comments: Mapped[list["Comment"]] = relationship(back_populates="user")
    reactions: Mapped[list["Reaction"]] = relationship(back_populates="user")


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


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_target", "locale", "target_type", "target_slug", "status"),
        Index("ix_comments_user_id", "user_id"),
        Index("ix_comments_parent", "parent_comment_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    parent_comment_id: Mapped[str | None] = mapped_column(ForeignKey("comments.id"), nullable=True)
    locale: Mapped[str] = mapped_column(String(8))
    target_type: Mapped[str] = mapped_column(String(20))
    target_slug: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="comments")


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (
        UniqueConstraint("user_id", "locale", "target_type", "target_slug", name="uq_reaction_target"),
        Index("ix_reactions_target", "locale", "target_type", "target_slug"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    locale: Mapped[str] = mapped_column(String(8))
    target_type: Mapped[str] = mapped_column(String(20))
    target_slug: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="reactions")


class FeedbackMessage(Base):
    __tablename__ = "feedback_messages"
    __table_args__ = (Index("ix_feedback_created_at", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    category: Mapped[str] = mapped_column(String(32))
    body: Mapped[str] = mapped_column(Text)
    contact_email: Mapped[str] = mapped_column(String(320))
    locale: Mapped[str] = mapped_column(String(8))
    page_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="new")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


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
