import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session
from app.models.database import Project
from app.schemas.audio import AudioAnalysisResult
from app.services.audio.extractor import extract_audio_from_video
from app.services.audio.transcription import analyze_audio
from app.storage.local_storage import storage_manager

router = APIRouter(prefix="/projects", tags=["Audio"])


@router.post("/{project_id}/audio/process", response_model=AudioAnalysisResult)
async def process_project_audio(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> AudioAnalysisResult:
    """
    Phase 3 Audio Engine:
    Extracts audio from video, runs Whisper local speech transcription, and analyzes SFX/music cues.
    """
    stmt = (
        select(Project)
        .options(selectinload(Project.video))
        .where(Project.id == project_id)
    )
    res = await db.execute(stmt)
    project = res.scalars().first()

    if not project or not project.video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' or associated video not found.",
        )

    video_path = Path(project.video.file_path)
    if not video_path.exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Video file missing at: {video_path}",
        )

    project_dir = storage_manager.get_project_dir(project_id)
    wav_path, mp3_path = extract_audio_from_video(video_path, project_dir)

    preview_url = f"/api/projects/{project_id}/audio/preview" if mp3_path or wav_path else None
    analysis = analyze_audio(wav_path, audio_url=preview_url)

    # Save to project
    project.audio_json = json.dumps(analysis.model_dump())
    if project.status == "frames_extracted":
        project.status = "audio_processed"
    await db.commit()

    return analysis


@router.get("/{project_id}/audio", response_model=AudioAnalysisResult)
async def get_project_audio(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> AudioAnalysisResult:
    """
    Returns stored audio analysis for the project.
    """
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalars().first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found.",
        )

    if project.audio_json:
        try:
            parsed = json.loads(project.audio_json)
            return AudioAnalysisResult(**parsed)
        except Exception:
            pass

    return AudioAnalysisResult(
        has_audio=False,
        has_speech=False,
        full_transcript="",
        segments=[],
        sfx_cues=[],
    )


@router.get("/{project_id}/audio/preview")
async def get_audio_preview(
    project_id: str,
):
    """
    Streams the extracted audio for playback in the browser.
    """
    project_dir = storage_manager.get_project_dir(project_id)
    mp3_path = project_dir / "audio" / "preview.mp3"
    wav_path = project_dir / "audio" / "extracted_16k.wav"

    if mp3_path.is_file():
        return FileResponse(mp3_path, media_type="audio/mpeg")
    elif wav_path.is_file():
        return FileResponse(wav_path, media_type="audio/wav")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Audio preview file not found.",
    )
