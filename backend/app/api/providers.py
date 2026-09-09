from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.database import ApiKey
from app.schemas.provider import ProviderInfo, SaveKeyRequest, TestConnectionResponse
from app.services.ai.factory import (
    PROVIDER_METADATA,
    get_ai_provider,
    get_stored_api_key,
    list_providers_info,
)
from app.utils.crypto import encrypt_secret, mask_secret

router = APIRouter(prefix="/providers", tags=["AI Providers"])


@router.get("", response_model=list[ProviderInfo])
async def get_providers(
    db: AsyncSession = Depends(get_db_session),
) -> list[ProviderInfo]:
    """
    Returns all supported AI providers, masked keys, and model options.
    Never exposes plain-text secrets.
    """
    return await list_providers_info(db)


@router.post("/{provider}/key", response_model=ProviderInfo)
async def save_provider_key(
    provider: str,
    request: SaveKeyRequest,
    db: AsyncSession = Depends(get_db_session),
) -> ProviderInfo:
    """
    Encrypts and saves BYOK API key and selected model.
    """
    prov = provider.lower()
    if prov not in PROVIDER_METADATA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}",
        )

    stmt = select(ApiKey).where(ApiKey.provider == prov)
    res = await db.execute(stmt)
    key_record = res.scalars().first()

    clean_key = request.api_key.strip() if request.api_key else ""
    selected_model = request.selected_model or PROVIDER_METADATA[prov]["default_model"]

    if clean_key:
        encrypted = encrypt_secret(clean_key)
        masked = mask_secret(clean_key)

        if key_record:
            key_record.encrypted_key = encrypted
            key_record.masked_key = masked
            key_record.selected_model = selected_model
            key_record.is_active = True
        else:
            new_key = ApiKey(
                provider=prov,
                encrypted_key=encrypted,
                masked_key=masked,
                selected_model=selected_model,
                is_active=True,
            )
            db.add(new_key)
    else:
        # Key was omitted, only update model if record exists
        if key_record and selected_model:
            key_record.selected_model = selected_model

    await db.commit()

    # Return refreshed info
    providers = await list_providers_info(db)
    return next(p for p in providers if p.provider == prov)


@router.delete("/{provider}/key", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider_key(
    provider: str,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """
    Removes saved API key for provider.
    """
    prov = provider.lower()
    await db.execute(delete(ApiKey).where(ApiKey.provider == prov))
    await db.commit()


@router.post("/{provider}/test", response_model=TestConnectionResponse)
async def test_provider_connection(
    provider: str,
    request: Optional[SaveKeyRequest] = None,
    db: AsyncSession = Depends(get_db_session),
) -> TestConnectionResponse:
    """
    Tests connection to AI provider using either a temporarily supplied key
    or the saved encrypted key.
    """
    prov = provider.lower()
    if prov not in PROVIDER_METADATA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}",
        )

    test_key = request.api_key.strip() if request and request.api_key else None
    model_choice = request.selected_model if request and request.selected_model else None

    meta = PROVIDER_METADATA[prov]
    model_name = model_choice or meta["default_model"]

    if test_key:
        provider_cls = meta["cls"]
        ai_instance = provider_cls(api_key=test_key, model_name=model_name)
    else:
        ai_instance = await get_ai_provider(prov, db, model_override=model_name)

    success, message = await ai_instance.test_connection()

    return TestConnectionResponse(
        success=success,
        provider=prov,
        model=model_name,
        message=message,
    )
