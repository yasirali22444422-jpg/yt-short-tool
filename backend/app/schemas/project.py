from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VideoMetadata(BaseModel):
    filename: str = ""
    duration_seconds: float = 0.0
    width: int = 0
    height: int = 0
    aspect_ratio: str = ""
    fps: float = 0.0
    codec: str = ""
    audio_codec: str = ""
    file_size_bytes: int = 0


class VideoInfo(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size_bytes: int
    source_deleted: bool
    metadata: Optional[VideoMetadata] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectCreate(BaseModel):
    name: Optional[str] = None
    analysis_mode: str = Field(default="detailed", description="fast, detailed, deep")
    provider: str = Field(default="gemini", description="gemini, openai, claude")
    model: str = Field(default="gemini-2.5-flash")


class ProjectResponse(BaseModel):
    id: str
    name: str
    status: str
    analysis_mode: str
    provider: str
    model: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_internal_test: bool = False
    video: Optional[VideoInfo] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectListItem(BaseModel):
    id: str
    name: str
    status: str
    analysis_mode: str
    provider: str
    model: str
    created_at: datetime
    video_filename: Optional[str] = None
    video_size_mb: Optional[float] = None
    video_duration_seconds: Optional[float] = None
    formatted_duration: Optional[str] = None
    is_internal_test: bool = False

    model_config = ConfigDict(from_attributes=True)



class UploadResponse(BaseModel):
    project_id: str
    project_name: str
    video_id: str
    filename: str
    original_filename: str
    file_size_bytes: int
    status: str
    message: str
