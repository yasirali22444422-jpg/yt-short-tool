import re
from pathlib import Path
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import PromptTemplate

DEFAULT_LIBRARY_PATH = Path("d:/yt short tool/Yasir_Master_Prompt_Library.txt")

CATEGORY_MAPPINGS = {
    "upload/Pasted markdown(1).md": {
        "title": "🧠 PROFESSIONAL ASMR MASTERY ENGINE v5.1 — ULTRA EDITION",
        "category": "ASMR & Kids Content",
        "description": "Dynamic, anti-reuse, image-aware, strict-input-locked ASMR script engine with 11 production phases, scene math, continuity laws, official sound cue library, and voiceover system.",
        "is_default": True,
    },
    "upload/Pasted text (2).txt": {
        "title": "ASMR Script Generator — Enhanced Input Form (HTML / Web Engine)",
        "category": "Interactive Form Generators & HTML Tools",
        "description": "Complete standalone interactive ASMR Script Generator web application with direct/competitor script preserve mode, multi-language toggles, structured product rows, and prompt export.",
        "is_default": False,
    },
    "upload/Pasted text (3).txt": {
        "title": "🔥 INDUSTRIAL MANUFACTURING MASTERY PROMPT (ULTIMATE VERSION) — Standard Chapter Breakdown",
        "category": "Industrial & Manufacturing Video Scripts",
        "description": "Cinematic industrial manufacturing video script creator with user-defined chapter size, strict MY_IDEA sequential enforcement, multi-stage calculation formulas, second-by-second action beats, and quality verification tables.",
        "is_default": False,
    },
    "upload/Pasted text (4).txt": {
        "title": "🔥 INDUSTRIAL MANUFACTURING MASTERY PROMPT (ULTIMATE VERSION) — Single-Paragraph Scene Prompts Edition",
        "category": "Industrial & Manufacturing Video Scripts",
        "description": "Industrial manufacturing video script creator with user-defined chapter size and strict MY_IDEA enforcement, tailored with single-paragraph 15-line deep-detail scene prompt formatting.",
        "is_default": False,
    },
}


def parse_prompt_library(file_path: Path = DEFAULT_LIBRARY_PATH) -> list[dict[str, Any]]:
    """
    Parses Yasir_Master_Prompt_Library.txt, splitting each master prompt into an individual template
    while preserving 100% of the original prompt text and structure.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Prompt library file not found at: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Split using the delimiter
    sections = re.split(r"={10,}\s*\n+\s*SOURCE FILE:\s*", text)
    templates = []

    for idx, sec in enumerate(sections[1:], 1):
        lines = sec.splitlines()
        source_name = lines[0].strip()
        rest = "\n".join(lines[1:])
        # Strip leading decorative separator line
        cleaned_content = re.sub(r"^\s*={10,}\s*", "", rest).strip()

        meta = CATEGORY_MAPPINGS.get(source_name, {
            "title": f"Master Prompt Template {idx} ({source_name})",
            "category": "General Video Production",
            "description": f"Master prompt extracted from {source_name}",
            "is_default": False,
        })

        templates.append({
            "title": meta["title"],
            "category": meta["category"],
            "description": meta["description"],
            "source_file": source_name,
            "content": cleaned_content,
            "is_default": meta["is_default"],
        })

    return templates


async def seed_prompt_library(db: AsyncSession, force_reload: bool = False) -> int:
    """
    Saves parsed templates permanently into the database.
    If templates already exist and force_reload is False, skips re-inserting.
    """
    stmt = select(PromptTemplate)
    res = await db.execute(stmt)
    existing = res.scalars().all()

    if existing and not force_reload:
        return len(existing)

    parsed_templates = parse_prompt_library()

    # Map existing by source_file to update in place or insert new
    existing_map = {t.source_file: t for t in existing}

    added_or_updated = 0
    for t_data in parsed_templates:
        src = t_data["source_file"]
        if src in existing_map:
            # Update existing
            row = existing_map[src]
            row.title = t_data["title"]
            row.category = t_data["category"]
            row.description = t_data["description"]
            row.content = t_data["content"]
            row.is_default = t_data["is_default"]
        else:
            # Insert new
            new_row = PromptTemplate(
                title=t_data["title"],
                category=t_data["category"],
                description=t_data["description"],
                source_file=src,
                content=t_data["content"],
                is_default=t_data["is_default"],
            )
            db.add(new_row)
        added_or_updated += 1

    await db.commit()
    return added_or_updated
