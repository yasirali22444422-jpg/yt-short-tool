import base64
import json
from pathlib import Path
from typing import Any, Optional, Type
from pydantic import BaseModel
import httpx

from app.services.ai.base import BaseAIProvider, AIProviderError


class ClaudeProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "claude"

    async def test_connection(self) -> tuple[bool, str]:
        if not self.api_key:
            return False, "Claude API key is not configured."

        if self.api_key.startswith("mock-") or self.api_key == "test-key":
            return True, f"Connection to Claude ({self.model_name}) successful [Mock Mode]."

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": self.model_name,
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "ping"}],
                    },
                )
                if res.status_code == 200:
                    return True, f"Connection to Claude ({self.model_name}) successful."
                elif res.status_code == 401:
                    return False, "Invalid Claude API key."
                elif res.status_code == 429:
                    return False, "Claude quota or rate limit exceeded."
                else:
                    return False, f"Claude error (HTTP {res.status_code}): {res.text}"
        except Exception as e:
            return False, f"Network error connecting to Claude: {str(e)}"

    async def analyze_multimodal(
        self,
        image_paths: list[Path],
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        if not self.api_key:
            raise AIProviderError("Claude API key not configured.", "claude", "missing_key")

        if self.api_key.startswith("mock-") or self.api_key == "test-key":
            return {
                "status": "success",
                "provider": "claude",
                "model": self.model_name,
                "analysis": "Mock Claude multimodal analysis completed.",
                "frames_analyzed": len(image_paths),
            }

        try:
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=self.api_key)
            content_items: list[dict[str, Any]] = []

            for img_p in image_paths:
                if img_p.exists():
                    b64 = base64.b64encode(img_p.read_bytes()).decode("utf-8")
                    content_items.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": b64,
                        },
                    })

            # Append structured instructions if schema provided
            schema_instr = (
                f"\nRespond ONLY with valid JSON matching this schema:\n{json.dumps(response_schema.model_json_schema())}"
                if response_schema
                else ""
            )
            content_items.append({"type": "text", "text": f"{prompt}{schema_instr}"})

            res = await client.messages.create(
                model=self.model_name,
                max_tokens=4096,
                messages=[{"role": "user", "content": content_items}],
            )

            raw_text = res.content[0].text if res.content else ""
            if response_schema:
                # Clean JSON wrappers if any
                clean_json = raw_text.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                return json.loads(clean_json.strip())

            return {"raw_text": raw_text}

        except Exception as e:
            raise self.handle_error(e)

    async def generate_text(
        self,
        prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
    ) -> dict[str, Any]:
        return await self.analyze_multimodal([], prompt, response_schema)
