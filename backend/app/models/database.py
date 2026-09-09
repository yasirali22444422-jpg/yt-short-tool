import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


def generate_id(prefix: str = "item") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("proj"))
    name = Column(String(255), nullable=False)
    status = Column(String(64), default="uploaded", nullable=False)
    analysis_mode = Column(String(32), default="detailed", nullable=False)
    provider = Column(String(64), default="gemini", nullable=False)
    model = Column(String(64), default="gemini-2.5-flash", nullable=False)
    error_message = Column(Text, nullable=True)
    audio_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    video = relationship("Video", back_populates="project", uselist=False, cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    characters = relationship("Character", back_populates="project", cascade="all, delete-orphan")


class Video(Base):
    __tablename__ = "videos"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("vid"))
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    metadata_json = Column(Text, nullable=True)
    source_deleted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationship
    project = relationship("Project", back_populates="video")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("key"))
    provider = Column(String(64), nullable=False, unique=True)
    encrypted_key = Column(Text, nullable=False)
    masked_key = Column(String(64), nullable=False)
    selected_model = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class Scene(Base):
    __tablename__ = "scenes"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("scn"))
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    scene_number = Column(Integer, nullable=False)
    start_time = Column(String(32), default="0.0", nullable=False)
    end_time = Column(String(32), default="0.0", nullable=False)
    analysis_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="scenes")


class Character(Base):
    __tablename__ = "characters"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("char"))
    project_id = Column(String(64), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    character_id = Column(String(64), nullable=False)  # e.g. CHAR_001
    display_name = Column(String(128), nullable=False)
    data_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="characters")
