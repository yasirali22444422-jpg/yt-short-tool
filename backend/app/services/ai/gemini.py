import json
from pathlib import Path
from typing import Any, Optional, Type
from pydantic import BaseModel
import httpx

from app.services.ai.base import BaseAIProvider, AIProviderError


class GeminiProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "gemini"

    async def test_connection(self) -> tuple[bool, str]:
        if not self.api_key:
            return False, "Gemini API key is not configured."

        # Handle safe mock testing
        if self.api_key.startswith("mock-") or self.api_key == "test-key":
            return True, f"Connection to Gemini ({self.model_name}) successful [Mock Mode]."

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": "Hello, respond with 'OK'."}]}]
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    return True, f"Connection to Gemini ({self.model_name}) successful."
                elif res.status_code in (400, 403):
                    return False, f"Invalid Gemini API key or unauthorized model: {res.text}"
                elif res.status_code == 429:
                    return False, "Gemini quota or rate limit exceeded."
                else:
                    return False, f"Gemini error (HTTP {res.status_code}): {res.text}"
        except Exception as e:
            return False, f"Network error connecting to Gemini: {str(e)}"

    async def analyze_multimodal(
        self,
        image_paths: list[Path],
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        if not self.api_key:
            raise AIProviderError("Gemini API key not configured.", "gemini", "missing_key")

        # Mock fallback for development testing without live keys
        if self.api_key.startswith("mock-") or self.api_key == "test-key":
            return {
                "status": "success",
                "provider": "gemini",
                "model": self.model_name,
                "analysis": "Mock multimodal analysis completed successfully.",
                "frames_analyzed": len(image_paths),
            }

        # Real Gemini Multimodal Call via google-genai or REST
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.api_key)
            contents: list[Any] = [prompt]

            for img_p in image_paths:
                if img_p.exists():
                    contents.append(types.Part.from_bytes(data=img_p.read_bytes(), mime_type="image/jpeg"))

            config = types.GenerateContentConfig(
                response_mime_type="application/json" if response_schema else None,
                response_schema=response_schema if response_schema else None,
            )

            res = client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config,
            )

            if response_schema and res.text:
                return json.loads(res.text)
            return {"raw_text": res.text or ""}

        except Exception as e:
            raise self.handle_error(e)

    async def generate_text(
        self,
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        return await self.analyze_multimodal([], prompt, response_schema)
