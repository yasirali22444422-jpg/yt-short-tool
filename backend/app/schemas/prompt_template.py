from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PromptTemplateResponse(BaseModel):
    id: str
    title: str
    category: str
    description: Optional[str] = None
    source_file: Optional[str] = None
    content: str
    is_default: bool = False
    created_at: datetime
    updated_at: datetime


class CreatePromptTemplateRequest(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    content: str
    is_default: bool = False


class UpdatePromptTemplateRequest(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    is_default: Optional[bool] = None
