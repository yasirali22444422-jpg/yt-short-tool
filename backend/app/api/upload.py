from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.database import Project, Video
from app.schemas.project import UploadResponse
from app.storage.local_storage import storage_manager

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    analysis_mode: str = Form("detailed"),
    provider: str = Form("gemini"),
    model: str = Form("gemini-2.5-flash"),
    db: AsyncSession = Depends(get_db_session),
) -> UploadResponse:
    """
    Accepts video upload (MP4, MOV, WebM).
    Validates file format and size, stores file safely, and creates a Project record.
    """
    original_filename = file.filename or "video.mp4"
    display_name = name.strip() if name and name.strip() else Path(original_filename).stem

    # Save file to storage
    dest_path, file_size, unique_filename = await storage_manager.save_uploaded_video(file)

    # Create DB records
    new_project = Project(
        name=display_name,
        status="uploaded",
        analysis_mode=analysis_mode,
        provider=provider,
        model=model,
    )
    db.add(new_project)
    await db.flush()  # Populates new_project.id

    new_video = Video(
        project_id=new_project.id,
        filename=unique_filename,
        original_filename=original_filename,
        file_path=str(dest_path),
        file_size_bytes=file_size,
        source_deleted=False,
    )
    db.add(new_video)
    await db.commit()
    await db.refresh(new_project)

    return UploadResponse(
        project_id=new_project.id,
        project_name=new_project.name,
        video_id=new_video.id,
        filename=new_video.filename,
        original_filename=new_video.original_filename,
        file_size_bytes=new_video.file_size_bytes,
        status=new_project.status,
        message="Video uploaded successfully. Project created.",
    )
