import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.database import Project
from app.schemas.analysis import FullAnalysisPackage

router = APIRouter(prefix="/projects", tags=["Export Studio"])


def compile_plain_text_prompt_book(package: FullAnalysisPackage, project_name: str) -> str:
    """
    Formats all scene prompts into a clean, text-generator ready document.
    """
    lines: list[str] = [
        f"==================================================",
        f"AI RECREATION PROMPT BOOK: {project_name.upper()}",
        f"==================================================",
        f"Style: {package.global_style.visual_style} ({package.global_style.medium})",
        f"Palette: {package.global_style.color_palette}",
        f"Camera Language: {package.global_style.camera_language}",
        f"Total Scenes: {len(package.scenes)}",
        f"==================================================\n",
    ]

    for s in package.scenes:
        lines.extend([
            f"--- SCENE {s.scene_number:02d} ({s.start_time:.2f}s - {s.end_time:.2f}s | Duration: {s.duration:.1f}s) ---",
            f"Action: {s.scene_summary or 'Key scene dynamic action'}",
            f"Camera: {s.camera_shot} | {s.camera_angle} | {s.camera_movement} ({s.lens_feel})",
            "",
            "[IMAGE GENERATION PROMPT (KEYFRAME)]:",
            s.image_prompt,
            "",
            "[IMAGE-TO-VIDEO ANIMATION PROMPT (I2V)]:",
            s.animation_prompt,
            "",
            "[TEXT-TO-VIDEO PROMPT (T2V)]:",
            s.text_to_video_prompt,
            "",
            "[NEGATIVE PROMPT]:",
            s.negative_prompt,
            "\n",
        ])

    lines.extend([
        "==================================================",
        "MASTER NEGATIVE PROMPT:",
        package.scenes[0].negative_prompt if package.scenes else "blurry, low quality, warped limbs",
        "==================================================",
    ])

    return "\n".join(lines)


@router.get("/{project_id}/export")
async def export_project_data(
    project_id: str,
    format: str = Query("json", description="Export format: 'json', 'markdown', or 'txt'"),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    """
    Downloads project recreation blueprint in JSON, Markdown, or Plaintext format.
    """
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalars().first()
    if not project or not project.analysis_json:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project analysis not found. Please run analysis first.",
        )

    clean_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in project.name).strip("_") or "project"
    package = FullAnalysisPackage(**json.loads(project.analysis_json))

    fmt = format.lower()
    if fmt == "json":
        return Response(
            content=json.dumps(package.model_dump(), indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{clean_name}_blueprint.json"'},
        )
    elif fmt in ("markdown", "md"):
        content = package.blueprint_markdown or "No blueprint generated."
        return Response(
            content=content,
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{clean_name}_blueprint.md"'},
        )
    elif fmt in ("txt", "text"):
        content = compile_plain_text_prompt_book(package, project.name)
        return Response(
            content=content,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{clean_name}_prompts.txt"'},
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format: {format}. Use 'json', 'markdown', or 'txt'.",
        )
