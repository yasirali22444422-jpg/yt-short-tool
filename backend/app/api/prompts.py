from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.database import PromptTemplate
from app.schemas.prompt_template import (
    CreatePromptTemplateRequest,
    PromptTemplateResponse,
    UpdatePromptTemplateRequest,
)
from app.services.prompt_library import seed_prompt_library

router = APIRouter(prefix="/prompts", tags=["Master Prompt Library"])


@router.get("/templates", response_model=list[PromptTemplateResponse])
async def list_prompt_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db_session),
) -> list[PromptTemplateResponse]:
    """
    Returns all editable master prompt templates stored permanently in the database.
    """
    stmt = select(PromptTemplate).order_by(PromptTemplate.created_at.asc())
    if category:
        stmt = stmt.where(PromptTemplate.category == category)

    res = await db.execute(stmt)
    rows = res.scalars().all()

    # If database is empty, auto-seed from library file
    if not rows:
        await seed_prompt_library(db)
        res = await db.execute(stmt)
        rows = res.scalars().all()

    return [
        PromptTemplateResponse(
            id=r.id,
            title=r.title,
            category=r.category,
            description=r.description,
            source_file=r.source_file,
            content=r.content,
            is_default=r.is_default,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in rows
    ]


@router.get("/templates/{template_id}", response_model=PromptTemplateResponse)
async def get_prompt_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> PromptTemplateResponse:
    """
    Retrieves a single master prompt template with full original text.
    """
    stmt = select(PromptTemplate).where(PromptTemplate.id == template_id)
    res = await db.execute(stmt)
    tmpl = res.scalars().first()
    if not tmpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt template not found")

    return PromptTemplateResponse(
        id=tmpl.id,
        title=tmpl.title,
        category=tmpl.category,
        description=tmpl.description,
        source_file=tmpl.source_file,
        content=tmpl.content,
        is_default=tmpl.is_default,
        created_at=tmpl.created_at,
        updated_at=tmpl.updated_at,
    )


@router.post("/templates", response_model=PromptTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt_template(
    request: CreatePromptTemplateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> PromptTemplateResponse:
    """
    Creates a new custom master prompt template.
    """
    new_tmpl = PromptTemplate(
        title=request.title.strip(),
        category=request.category.strip(),
        description=request.description.strip() if request.description else None,
        content=request.content,
        is_default=request.is_default,
    )
    db.add(new_tmpl)
    await db.commit()
    await db.refresh(new_tmpl)

    return PromptTemplateResponse(
        id=new_tmpl.id,
        title=new_tmpl.title,
        category=new_tmpl.category,
        description=new_tmpl.description,
        source_file=new_tmpl.source_file,
        content=new_tmpl.content,
        is_default=new_tmpl.is_default,
        created_at=new_tmpl.created_at,
        updated_at=new_tmpl.updated_at,
    )


@router.put("/templates/{template_id}", response_model=PromptTemplateResponse)
async def update_prompt_template(
    template_id: str,
    request: UpdatePromptTemplateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> PromptTemplateResponse:
    """
    Updates an existing prompt template while preserving database permanence.
    """
    stmt = select(PromptTemplate).where(PromptTemplate.id == template_id)
    res = await db.execute(stmt)
    tmpl = res.scalars().first()
    if not tmpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt template not found")

    if request.title is not None:
        tmpl.title = request.title.strip()
    if request.category is not None:
        tmpl.category = request.category.strip()
    if request.description is not None:
        tmpl.description = request.description.strip()
    if request.content is not None:
        tmpl.content = request.content
    if request.is_default is not None:
        tmpl.is_default = request.is_default

    await db.commit()
    await db.refresh(tmpl)

    return PromptTemplateResponse(
        id=tmpl.id,
        title=tmpl.title,
        category=tmpl.category,
        description=tmpl.description,
        source_file=tmpl.source_file,
        content=tmpl.content,
        is_default=tmpl.is_default,
        created_at=tmpl.created_at,
        updated_at=tmpl.updated_at,
    )


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """
    Deletes a prompt template.
    """
    stmt = delete(PromptTemplate).where(PromptTemplate.id == template_id)
    await db.execute(stmt)
    await db.commit()


@router.post("/import-library")
async def import_prompt_library_endpoint(
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    Forces an import/refresh of all templates from Yasir_Master_Prompt_Library.txt into the database.
    """
    count = await seed_prompt_library(db, force_reload=True)
    return {"status": "success", "imported_count": count, "message": f"Successfully imported {count} master prompt templates."}
