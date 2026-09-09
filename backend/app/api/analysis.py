import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.database import Project, Scene
from app.schemas.analysis import (
    FullAnalysisPackage,
    SceneAnalysisData,
    StartAnalysisRequest,
    UpdateSceneRequest,
)
from app.services.ai.analyzer import regenerate_single_scene, run_full_video_analysis
from app.services.ai.prompt_compiler import (
    compile_animation_prompt,
    compile_image_prompt,
    compile_text_to_video_prompt,
    generate_master_blueprint_markdown,
)

router = APIRouter(prefix="/projects", tags=["AI Analysis & Blueprints"])


@router.post("/{project_id}/analyze", response_model=FullAnalysisPackage)
async def analyze_project_video(
    project_id: str,
    request: Optional[StartAnalysisRequest] = None,
    db: AsyncSession = Depends(get_db_session),
) -> FullAnalysisPackage:
    """
    Executes the multimodal AI reverse-engineering analysis across all detected scenes.
    Generates Style DNA, Character Bibles, Prompts (Image, I2V, T2V, Negative), and Master Blueprint.
    """
    prov = request.provider if request else None
    mod = request.model if request else None
    mode = request.mode if request else "recreate"

    try:
        package = await run_full_video_analysis(
            project_id=project_id,
            db=db,
            provider_name=prov,
            model_name=mod,
            mode=mode,
        )
        return package
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Analysis failed: {str(e)}")


@router.get("/{project_id}/analysis", response_model=FullAnalysisPackage)
async def get_project_analysis(
    project_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> FullAnalysisPackage:
    """
    Retrieves the structured JSON analysis package for the given project.
    """
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if not project.analysis_json:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis has not been run for this project yet. Call POST /analyze first.",
        )

    try:
        package_dict = json.loads(project.analysis_json)
        return FullAnalysisPackage(**package_dict)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to parse analysis: {str(e)}")


@router.post("/{project_id}/scenes/{scene_num}/regenerate", response_model=SceneAnalysisData)
async def regenerate_scene_prompts(
    project_id: str,
    scene_num: int,
    db: AsyncSession = Depends(get_db_session),
) -> SceneAnalysisData:
    """
    Regenerates analysis and prompts for a single scene and re-synchronizes the Master Blueprint.
    """
    try:
        return await regenerate_single_scene(project_id, scene_num, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Regeneration failed: {str(e)}")


@router.put("/{project_id}/scenes/{scene_num}", response_model=SceneAnalysisData)
async def update_scene_analysis(
    project_id: str,
    scene_num: int,
    updates: UpdateSceneRequest,
    db: AsyncSession = Depends(get_db_session),
) -> SceneAnalysisData:
    """
    Allows user to edit scene parameters (camera, actions, summary, custom prompts)
    and updates the project's Master Blueprint.
    """
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalars().first()
    if not project or not project.analysis_json:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project or analysis not found")

    package = FullAnalysisPackage(**json.loads(project.analysis_json))
    target_idx = next((i for i, s in enumerate(package.scenes) if s.scene_number == scene_num), None)
    if target_idx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_num} not found")

    scene = package.scenes[target_idx]

    # Apply provided edits
    if updates.scene_summary is not None:
        scene.scene_summary = updates.scene_summary
    if updates.camera_shot is not None:
        scene.camera_shot = updates.camera_shot
    if updates.camera_angle is not None:
        scene.camera_angle = updates.camera_angle
    if updates.camera_movement is not None:
        scene.camera_movement = updates.camera_movement
    if updates.lens_feel is not None:
        scene.lens_feel = updates.lens_feel
    if updates.lighting is not None:
        scene.lighting = updates.lighting
    if updates.character_actions is not None:
        scene.character_actions = updates.character_actions

    # If prompts were not explicitly edited, recompile with updated scene fields
    if updates.image_prompt is not None:
        scene.image_prompt = updates.image_prompt
    else:
        scene.image_prompt = compile_image_prompt(scene, package.global_style, package.characters, package.locations)

    if updates.animation_prompt is not None:
        scene.animation_prompt = updates.animation_prompt
    else:
        scene.animation_prompt = compile_animation_prompt(scene, package.global_style)

    if updates.text_to_video_prompt is not None:
        scene.text_to_video_prompt = updates.text_to_video_prompt
    else:
        scene.text_to_video_prompt = compile_text_to_video_prompt(scene, package.global_style, package.characters, package.locations)

    if updates.negative_prompt is not None:
        scene.negative_prompt = updates.negative_prompt

    # Update master blueprint
    package.blueprint_markdown = generate_master_blueprint_markdown(
        project_name=project.name,
        content_type=package.content_type,
        style=package.global_style,
        editing=package.editing_dna,
        characters=package.characters,
        objects=package.objects,
        locations=package.locations,
        scenes=package.scenes,
    )

    project.analysis_json = json.dumps(package.model_dump(), indent=2)
    project.blueprint_markdown = package.blueprint_markdown

    # Update scene in DB
    scn_stmt = select(Scene).where(Scene.project_id == project_id, Scene.scene_number == scene_num)
    scn_res = await db.execute(scn_stmt)
    scn_row = scn_res.scalars().first()
    if scn_row:
        scn_row.analysis_json = json.dumps(scene.model_dump(), indent=2)

    await db.commit()
    return scene
