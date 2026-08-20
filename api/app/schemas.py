from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


LOCALES = ("az", "en", "ru", "ky")


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    display_name: str | None = Field(default=None, max_length=80)
    preferred_locale: str = "az"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class EmailIn(BaseModel):
    email: EmailStr


class TokenIn(BaseModel):
    token: str


class PasswordResetConfirmIn(BaseModel):
    token: str
    password: str


class MeOut(BaseModel):
    email: str
    first_name: str | None
    last_name: str | None
    display_name: str | None
    preferred_locale: str
    is_verified: bool
    role: str
    avatar_url: str | None = None


class MePatchIn(BaseModel):
    display_name: str | None = Field(default=None, max_length=80)
    first_name: str | None = Field(default=None, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)
    preferred_locale: str | None = None


class DeleteAccountIn(BaseModel):
    confirm: bool = False


class PreferencesIn(BaseModel):
    data: dict = Field(default_factory=dict)
