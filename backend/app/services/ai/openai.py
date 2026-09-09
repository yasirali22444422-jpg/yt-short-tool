import base64
import json
from pathlib import Path
from typing import Any, Optional, Type
from pydantic import BaseModel
import httpx

from app.services.ai.base import BaseAIProvider, AIProviderError


class OpenAIProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "openai"

    async def test_connection(self) -> tuple[bool, str]:
        if not self.api_key:
            return False, "OpenAI API key is not configured."

        if self.api_key.startswith("mock-") or self.api_key == "test-key":
            return True, f"Connection to OpenAI ({self.model_name}) successful [Mock Mode]."

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                if res.status_code == 200:
                    return True, f"Connection to OpenAI ({self.model_name}) successful."
                elif res.status_code == 401:
                    return False, "Invalid OpenAI API key."
                elif res.status_code == 429:
                    return False, "OpenAI quota or rate limit exceeded."
                else:
                    return False, f"OpenAI error (HTTP {res.status_code}): {res.text}"
        except Exception as e:
            return False, f"Network error connecting to OpenAI: {str(e)}"

    async def analyze_multimodal(
        self,
        image_paths: list[Path],
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        if not self.api_key:
            raise AIProviderError("OpenAI API key not configured.", "openai", "missing_key")

        if self.api_key.startswith("mock-") or self.api_key == "test-key":
            return {
                "status": "success",
                "provider": "openai",
                "model": self.model_name,
                "analysis": "Mock OpenAI multimodal analysis completed.",
                "frames_analyzed": len(image_paths),
            }

        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self.api_key)
            content_items: list[dict[str, Any]] = [{"type": "text", "text": prompt}]

            for img_p in image_paths:
                if img_p.exists():
                    b64 = base64.b64encode(img_p.read_bytes()).decode("utf-8")
                    content_items.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"},
                    })

            messages = [{"role": "user", "content": content_items}]

            if response_schema:
                res = await client.beta.chat.completions.parse(
                    model=self.model_name,
                    messages=messages,
                    response_format=response_schema,
                )
                return res.choices[0].message.parsed.model_dump()
            else:
                res = await client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                )
                return {"raw_text": res.choices[0].message.content or ""}

        except Exception as e:
            raise self.handle_error(e)

    async def generate_text(
        self,
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        return await self.analyze_multimodal([], prompt, response_schema)
