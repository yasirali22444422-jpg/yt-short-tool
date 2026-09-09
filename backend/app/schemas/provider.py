from typing import Optional
from pydantic import BaseModel, Field


class ProviderInfo(BaseModel):
    provider: str
    name: str
    description: str
    has_key: bool
    masked_key: Optional[str] = None
    selected_model: str
    available_models: list[str] = Field(default_factory=list)


class SaveKeyRequest(BaseModel):
    api_key: Optional[str] = None
    selected_model: Optional[str] = None


class TestConnectionResponse(BaseModel):
    success: bool
    provider: str
    model: str
    message: str
