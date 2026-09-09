from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


from sqlalchemy import text


async def init_db() -> None:
    # Ensure data directory exists
    settings.init_directories()
    # Import all models to register them on Base
    from app.models import database  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Safe non-destructive migration: preserve all existing data while adding new columns
        res = await conn.execute(text("PRAGMA table_info(projects)"))
        columns = [row[1] for row in res.fetchall()]
        if "audio_json" not in columns:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN audio_json TEXT"))
        if "analysis_json" not in columns:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN analysis_json TEXT"))
        if "blueprint_markdown" not in columns:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN blueprint_markdown TEXT"))
        if "remix_json" not in columns:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN remix_json TEXT"))
        if "is_internal_test" not in columns:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN is_internal_test BOOLEAN DEFAULT 0"))

        # Safely flag all existing internal development & pipeline test records
        await conn.execute(text("""
            UPDATE projects 
            SET is_internal_test = 1 
            WHERE lower(name) LIKE '%phase%'
               OR lower(name) LIKE '%test%'
               OR lower(name) LIKE '%e2e%'
               OR lower(name) LIKE '%sample%'
               OR lower(name) LIKE '%mock%'
        """))


    # Seed Master Prompt Library if not yet populated
    try:
        from app.services.prompt_library import seed_prompt_library
        async with async_session_maker() as db_session:
            await seed_prompt_library(db_session)
    except Exception as e:
        print(f"Notice: Prompt library auto-seed: {e}")
