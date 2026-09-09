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
        parsed = {}
        if s.analysis_json:
            try:
                parsed = json.loads(s.analysis_json)
            except Exception:
                parsed = {}

        s_num = parsed.get("scene_number", s.scene_number)
        start_t = float(parsed.get("start_time", s.start_time or 0.0))
        end_t = float(parsed.get("end_time", s.end_time or 0.0))
        dur = round(float(parsed.get("duration", max(0.0, end_t - start_t))), 2)

        # Guarantee frames is ALWAYS a list (never None or undefined)
        raw_frames = parsed.get("frames")
        if not isinstance(raw_frames, list):
            kf_urls = parsed.get("keyframe_urls") or []
            if isinstance(kf_urls, list) and kf_urls:
                raw_frames = [
                    {
                        "frame_type": "keyframe",
                        "timestamp": start_t,
                        "file_path": "",
                        "relative_url": url,
                    }
                    for url in kf_urls
                ]
            else:
                raw_frames = []

        normalized_scene = {
            **parsed,
            "scene_number": s_num,
            "start_time": start_t,
            "end_time": end_t,
            "duration": dur,
            "frames": raw_frames,
            "frame_count": len(raw_frames),
            "thumbnail_url": raw_frames[0]["relative_url"] if raw_frames else parsed.get("thumbnail_url"),
        }
        data.append(normalized_scene)

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
