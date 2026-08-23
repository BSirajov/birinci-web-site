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


TARGET_TYPES = ("story", "discovery")
COMMENT_STATUSES = ("pending", "approved", "rejected", "deleted")
REACTION_VALUES = ("like", "dislike")
FEEDBACK_CATEGORIES = ("improvement", "missing_feature", "technical_issue", "other")
MODERATE_ACTIONS = ("approve", "reject")


class ContentTargetIn(BaseModel):
    locale: str
    target_type: str
    target_slug: str


class CommentCreateIn(ContentTargetIn):
    body: str = Field(min_length=1, max_length=2000)
    parent_comment_id: str | None = Field(default=None, max_length=36)


class CommentPatchIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommentModerateIn(BaseModel):
    action: str


class ReactionPutIn(ContentTargetIn):
    value: str


class ReactionClearIn(ContentTargetIn):
    pass


class FeedbackIn(BaseModel):
    category: str
    body: str = Field(min_length=1, max_length=4000)
    contact_email: EmailStr | None = None
    name: str | None = Field(default=None, max_length=80)
    locale: str = "en"
    page_url: str | None = Field(default=None, max_length=500)
    website: str | None = Field(default=None, max_length=120)  # honeypot
