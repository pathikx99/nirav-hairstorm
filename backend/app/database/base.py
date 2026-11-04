"""SQLAlchemy declarative base and reusable column mixins."""

from __future__ import annotations

import datetime
import uuid
from uuid import UUID

from sqlalchemy import DateTime, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass


class UUIDPrimaryKeyMixin:
    """Mixin that provides a UUID primary key."""

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        sort_order=-10,
    )


class TimestampMixin:
    """Mixin that provides created_at / updated_at columns with TIMESTAMPTZ."""

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        server_default=text("now()"),
        nullable=False,
        sort_order=900,
    )

    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        server_default=text("now()"),
        onupdate=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
        sort_order=901,
    )
