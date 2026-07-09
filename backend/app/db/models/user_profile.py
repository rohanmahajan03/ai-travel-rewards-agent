import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        # user_profiles.user_id is the foreign key for accessing the profile field in users table
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    home_city: Mapped[str] = mapped_column(String(64), nullable=False)
    home_airports: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    cards: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    destination_interests: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    cabin_preference: Mapped[str | None] = mapped_column(String(32), nullable=True)
    date_flexibility: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
