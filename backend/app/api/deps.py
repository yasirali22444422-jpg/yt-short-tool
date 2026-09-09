from collections.abc import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db


async def get_db_session(db: AsyncSession = Depends(get_db)) -> AsyncGenerator[AsyncSession, None]:
    yield db
