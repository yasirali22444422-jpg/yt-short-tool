from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import ApiKey
from app.schemas.provider import ProviderInfo
from app.services.ai.base import BaseAIProvider
from app.services.ai.claude import ClaudeProvider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.openai import OpenAIProvider
from app.utils.crypto import decrypt_secret

PROVIDER_METADATA = {
    "gemini": {
        "name": "Google Gemini",
        "description": "Fast native multimodal analysis with large context window.",
        "default_model": "gemini-2.5-flash",
        "models": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"],
        "env_key": "GEMINI_API_KEY",
        "cls": GeminiProvider,
    },
    "openai": {
        "name": "OpenAI",
        "description": "State-of-the-art vision reasoning and prompt synthesis.",
        "default_model": "gpt-4o",
        "models": ["gpt-4o", "gpt-4o-mini"],
        "env_key": "OPENAI_API_KEY",
        "cls": OpenAIProvider,
    },
    "claude": {
        "name": "Anthropic Claude",
        "description": "Exceptional nuance in cinematography, style, and shot breakdowns.",
        "default_model": "claude-3-5-sonnet-20241022",
        "models": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
        "env_key": "ANTHROPIC_API_KEY",
        "cls": ClaudeProvider,
    },
}


async def get_stored_api_key(provider_name: str, db: AsyncSession) -> tuple[str, str, Optional[str]]:
    """
    Retrieves decrypted API key and selected model from database or fallback environment.
    Returns (plain_api_key, masked_key, selected_model).
    """
    prov = provider_name.lower()
    meta = PROVIDER_METADATA.get(prov, {})

    # 1. Check database for user-saved BYOK key
    stmt = select(ApiKey).where(ApiKey.provider == prov)
    res = await db.execute(stmt)
    key_record = res.scalars().first()

    if key_record and key_record.encrypted_key:
        try:
            decrypted = decrypt_secret(key_record.encrypted_key)
            model = key_record.selected_model or meta.get("default_model", "")
            return decrypted, key_record.masked_key, model
        except Exception as e:
            print(f"Error decrypting API key for {prov}: {e}")

    # 2. Check environment variables
    env_var = meta.get("env_key", "")
    env_val = getattr(settings, env_var, "") or ""
    if env_val:
        from app.utils.crypto import mask_secret
        return env_val, mask_secret(env_val), meta.get("default_model", "")

    return "", "", meta.get("default_model", "")


async def get_ai_provider(
    provider_name: str,
    db: AsyncSession,
    model_override: Optional[str] = None,
) -> BaseAIProvider:
    """
    Common AI provider factory.
    Initializes the provider with server-side decrypted key and chosen model.
    """
    prov = provider_name.lower()
    meta = PROVIDER_METADATA.get(prov)
    if not meta:
        raise ValueError(f"Unsupported AI provider: {provider_name}. Choose from: {list(PROVIDER_METADATA.keys())}")

    api_key, _, stored_model = await get_stored_api_key(prov, db)
    model = model_override or stored_model or meta["default_model"]
    provider_cls = meta["cls"]

    return provider_cls(api_key=api_key, model_name=model)


async def list_providers_info(db: AsyncSession) -> list[ProviderInfo]:
    """
    Returns public provider configuration for settings UI with masked keys only.
    Never exposes raw decrypted keys.
    """
    results: list[ProviderInfo] = []

    for prov_id, meta in PROVIDER_METADATA.items():
        api_key, masked_key, selected_model = await get_stored_api_key(prov_id, db)
        results.append(
            ProviderInfo(
                provider=prov_id,
                name=meta["name"],
                description=meta["description"],
                has_key=bool(api_key),
                masked_key=masked_key if api_key else None,
                selected_model=selected_model or meta["default_model"],
                available_models=meta["models"],
            )
        )

    return results
