from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Optional, Type
from pydantic import BaseModel


class AIProviderError(Exception):
    def __init__(self, message: str, provider: str, error_type: str = "general"):
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.error_type = error_type  # 'missing_key', 'invalid_key', 'quota_exceeded', 'network', 'schema_validation'


class BaseAIProvider(ABC):
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def test_connection(self) -> tuple[bool, str]:
        """
        Validates API key and model availability.
        Returns (success: bool, message: str).
        """
        pass

    @abstractmethod
    async def analyze_multimodal(
        self,
        image_paths: list[Path],
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        """
        Sends keyframes and prompt to multimodal LLM and returns validated structured JSON.
        """
        pass

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        """
        Sends text prompt (e.g. blueprint compilation or character consistency merge) to LLM.
        """
        pass

    def handle_error(self, e: Exception) -> AIProviderError:
        """
        Standardizes provider-specific API exceptions into user-friendly error types.
        """
        err_str = str(e).lower()
        if "401" in err_str or "unauthorized" in err_str or "invalid api key" in err_str or "authentication" in err_str:
            return AIProviderError(
                message=f"Invalid {self.provider_name.capitalize()} API key. Please check your credentials in Settings.",
                provider=self.provider_name,
                error_type="invalid_key",
            )
        elif "429" in err_str or "quota" in err_str or "rate limit" in err_str or "resource_exhausted" in err_str:
            return AIProviderError(
                message=f"{self.provider_name.capitalize()} quota exceeded or rate limit reached. Please check your plan.",
                provider=self.provider_name,
                error_type="quota_exceeded",
            )
        elif not self.api_key:
            return AIProviderError(
                message=f"{self.provider_name.capitalize()} API key not configured. Please add your key in Settings.",
                provider=self.provider_name,
                error_type="missing_key",
            )
        else:
            return AIProviderError(
                message=f"{self.provider_name.capitalize()} API error: {str(e)}",
                provider=self.provider_name,
                error_type="general",
            )
