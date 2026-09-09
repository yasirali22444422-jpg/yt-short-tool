import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session
from app.models.database import Project, Video
from app.schemas.project import ProjectListItem, ProjectResponse, VideoInfo, VideoMetadata
from app.storage.local_storage import storage_manager

router = APIRouter(prefix="/projects", tags=["Projects"])


def build_video_info(video: Optional[Video]) -> Optional[VideoInfo]:
    if not video:
        return None

    meta = None
    if video.metadata_json:
        try:
            parsed = json.loads(video.metadata_json)
            meta = VideoMetadata(**parsed)
        except Exception:
            pass

    return VideoInfo(
        id=video.id,
        filename=video.filename,
        original_filename=video.original_filename,
        file_size_bytes=video.file_size_bytes,
        source_deleted=video.source_deleted,
        metadata=meta,
    )


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    db: AsyncSession = Depends(get_db_session),
) -> list[ProjectListItem]:
    stmt = (
        select(Project)
        .options(selectinload(Project.video))
        .order_by(Project.created_at.desc())
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()

    items = []
    for p in projects:
        size_mb = (
            round(p.video.file_size_bytes / (1024 * 1024), 2)
            if p.video and p.video.file_size_bytes
            else None
        )
        items.append(
            ProjectListItem(
                id=p.id,
                name=p.name,
                status=p.status,
                analysis_mode=p.analysis_mode,
                provider=p.provider,
                model=p.model,
                created_at=p.created_at,
                video_filename=p.video.original_filename if p.video else None,
                video_size_mb=size_mb,
            )
        )
    return items


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> ProjectResponse:
    stmt = (
        select(Project)
        .options(selectinload(Project.video))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalars().first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        status=project.status,
        analysis_mode=project.analysis_mode,
        provider=project.provider,
        model=project.model,
        error_message=project.error_message,
        created_at=project.created_at,
        updated_at=project.updated_at,
        video=build_video_info(project.video),
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    stmt = (
        select(Project)
        .options(selectinload(Project.video))
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalars().first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    # Clean up uploaded video file
    if project.video and project.video.file_path:
        storage_manager.delete_file(project.video.file_path)

    # Clean up project workspace directory
    storage_manager.delete_project_dir(project_id)

    # Delete DB records (cascade will clean up associated Video/Scene/Character rows)
    await db.delete(project)
    await db.commit()
