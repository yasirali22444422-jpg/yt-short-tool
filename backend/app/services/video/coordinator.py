import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.database import Project, Scene, Video
from app.services.video.frame_extraction import extract_scene_keyframes
from app.services.video.metadata import extract_video_metadata
from app.services.video.scene_detection import detect_scenes
from app.services.video.similarity import deduplicate_scene_frames
from app.storage.local_storage import storage_manager


async def process_project_video(project_id: str, db: AsyncSession) -> dict:
    """
    Orchestrates Phase 2 video processing:
    1. Technical metadata extraction (FFprobe / facts)
    2. Scene detection (PySceneDetect + OpenCV)
    3. Smart keyframe extraction
    4. Perceptual hash deduplication
    5. Database persistence of scenes & timeline
    """
    stmt = (
        select(Project)
        .options(selectinload(Project.video))
        .where(Project.id == project_id)
    )
    res = await db.execute(stmt)
    project = res.scalars().first()

    if not project or not project.video:
        raise ValueError(f"Project '{project_id}' or associated video not found.")

    video_path = Path(project.video.file_path)
    if not video_path.exists():
        project.status = "failed"
        project.error_message = f"Video file not found at: {video_path}"
        await db.commit()
        raise FileNotFoundError(f"Video file missing: {video_path}")

    try:
        # Step 1: Technical Metadata Extraction
        metadata = extract_video_metadata(video_path)
        project.video.metadata_json = json.dumps(metadata.model_dump())
        project.status = "metadata_extracted"
        await db.commit()

        # Enforce V1 duration rule (1 - 90s)
        if metadata.duration_seconds > settings.MAX_VIDEO_DURATION_SECONDS:
            project.status = "failed"
            project.error_message = (
                f"Video duration ({metadata.duration_seconds}s) exceeds V1 limit of "
                f"{settings.MAX_VIDEO_DURATION_SECONDS}s."
            )
            await db.commit()
            raise ValueError(project.error_message)

        # Step 2: Scene Detection
        scenes = detect_scenes(video_path, metadata.duration_seconds)
        project.status = "scenes_detected"
        await db.commit()

        # Step 3 & 4: Keyframe Extraction & Deduplication
        project_dir = storage_manager.get_project_dir(project_id)
        raw_frames_by_scene = extract_scene_keyframes(
            video_path=video_path,
            scenes=scenes,
            project_dir=project_dir,
            project_id=project_id,
            mode=project.analysis_mode,
        )

        # Remove existing scenes if re-processing
        await db.execute(delete(Scene).where(Scene.project_id == project_id))

        # Save scenes & deduplicated frames
        created_scenes = []
        for s in scenes:
            s_num = s["scene_number"]
            raw_frames = raw_frames_by_scene.get(s_num, [])
            filtered_frames = deduplicate_scene_frames(raw_frames)

            scene_info = {
                "scene_number": s_num,
                "start_time": s["start_time"],
                "end_time": s["end_time"],
                "duration": s["duration"],
                "frames": filtered_frames,
                "frame_count": len(filtered_frames),
                "thumbnail_url": filtered_frames[0]["relative_url"] if filtered_frames else None,
            }

            db_scene = Scene(
                project_id=project_id,
                scene_number=s_num,
                start_time=str(s["start_time"]),
                end_time=str(s["end_time"]),
                analysis_json=json.dumps(scene_info),
            )
            db.add(db_scene)
            created_scenes.append(scene_info)

        project.status = "frames_extracted"
        project.error_message = None
        await db.commit()

        # Step 5: Audio Extraction & Whisper Analysis (Phase 3)
        audio_result = None
        try:
            from app.services.audio.extractor import extract_audio_from_video
            from app.services.audio.transcription import analyze_audio

            wav_path, mp3_path = extract_audio_from_video(video_path, project_dir)
            preview_url = f"/api/projects/{project_id}/audio/preview" if mp3_path or wav_path else None
            audio_analysis = analyze_audio(wav_path, audio_url=preview_url)
            project.audio_json = json.dumps(audio_analysis.model_dump())
            project.status = "audio_processed"
            await db.commit()
            audio_result = audio_analysis.model_dump()
        except Exception as audio_err:
            # Partial Failure Support (Section 59): audio failure does not break project visual analysis
            print(f"Warning: Audio pipeline partial failure for {project_id}: {audio_err}")

        return {
            "project_id": project_id,
            "status": project.status,
            "metadata": metadata.model_dump(),
            "scene_count": len(created_scenes),
            "scenes": created_scenes,
            "audio": audio_result,
        }

    except Exception as e:
        project.status = "failed"
        project.error_message = str(e)
        await db.commit()
        raise
