import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session
from app.models.database import Project, Scene
from app.services.video.coordinator import process_project_video
from app.storage.local_storage import storage_manager

router = APIRouter(prefix="/projects", tags=["Scenes"])


@router.post("/{project_id}/process")
async def process_video_endpoint(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Triggers Phase 2 video processing:
    FFprobe metadata, PySceneDetect segmentation, smart keyframe extraction, pHash deduplication.
    """
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    proj = res.scalars().first()

    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    try:
        result = await process_project_video(project_id, db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video processing error: {str(e)}",
        )


@router.get("/{project_id}/scenes")
async def get_project_scenes(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Returns timeline scenes for the project.
    """
    stmt = (
        select(Scene)
        .where(Scene.project_id == project_id)
        .order_by(Scene.scene_number.asc())
    )
    res = await db.execute(stmt)
    scenes = res.scalars().all()

    data = []
    for s in scenes:
        parsed = json.loads(s.analysis_json) if s.analysis_json else {}
        data.append(parsed)

    return {"project_id": project_id, "scene_count": len(data), "scenes": data}


@router.get("/{project_id}/frames/{filename}")
async def get_project_frame(
    project_id: str,
    filename: str,
):
    """
    Serves extracted keyframe image for visual timeline cards.
    """
    proj_dir = storage_manager.get_project_dir(project_id)
    frame_path = proj_dir / "frames" / filename

    if not frame_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Frame '{filename}' not found.",
        )

    return FileResponse(frame_path, media_type="image/jpeg")
