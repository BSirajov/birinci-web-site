"""Comments, reactions, and feedback inbox.

Revision ID: 0002_engagement
Revises: 0001_baseline
Create Date: 2026-08-23
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_engagement"
down_revision: str | None = "0001_baseline"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("parent_comment_id", sa.String(length=36), nullable=True),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column("target_type", sa.String(length=20), nullable=False),
        sa.Column("target_slug", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("edited_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["parent_comment_id"], ["comments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_target", "comments", ["locale", "target_type", "target_slug", "status"])
    op.create_index("ix_comments_user_id", "comments", ["user_id"])
    op.create_index("ix_comments_parent", "comments", ["parent_comment_id"])

    op.create_table(
        "reactions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column("target_type", sa.String(length=20), nullable=False),
        sa.Column("target_slug", sa.String(length=160), nullable=False),
        sa.Column("value", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "locale", "target_type", "target_slug", name="uq_reaction_target"),
    )
    op.create_index("ix_reactions_target", "reactions", ["locale", "target_type", "target_slug"])
    op.create_index("ix_reactions_user_id", "reactions", ["user_id"])

    op.create_table(
        "feedback_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("contact_email", sa.String(length=320), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column("page_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feedback_created_at", "feedback_messages", ["created_at"])
    op.create_index("ix_feedback_user_id", "feedback_messages", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_feedback_user_id", table_name="feedback_messages")
    op.drop_index("ix_feedback_created_at", table_name="feedback_messages")
    op.drop_table("feedback_messages")
    op.drop_index("ix_reactions_user_id", table_name="reactions")
    op.drop_index("ix_reactions_target", table_name="reactions")
    op.drop_table("reactions")
    op.drop_index("ix_comments_parent", table_name="comments")
    op.drop_index("ix_comments_user_id", table_name="comments")
    op.drop_index("ix_comments_target", table_name="comments")
    op.drop_table("comments")
