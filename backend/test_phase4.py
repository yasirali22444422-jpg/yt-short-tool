import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database.session import async_session_maker, init_db
from app.models.database import ApiKey
from app.services.ai.base import AIProviderError, BaseAIProvider
from app.services.ai.factory import (
    PROVIDER_METADATA,
    get_ai_provider,
    get_stored_api_key,
    list_providers_info,
)
from app.utils.crypto import decrypt_secret, encrypt_secret, mask_secret
import httpx


async def test_crypto_helpers():
    print("--- 1. Testing Crypto & Masking ---")
    secret = "sk-proj-test1234567890abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_secret(secret)
    decrypted = decrypt_secret(encrypted)
    masked = mask_secret(secret)

    assert decrypted == secret, "Decrypted text must match original secret"
    assert encrypted != secret, "Encrypted text must be different from original secret"
    assert masked.startswith("sk-"), "Masked key should preserve prefix"
    assert masked.endswith("wxyz"), "Masked key should preserve last 4 chars"
    assert "••••" in masked, "Masked key should contain bullets"
    print(f"  [OK] Encryption/Decryption verified: original ({len(secret)} chars) -> encrypted -> decrypted.")
    print(f"  [OK] Masked key format verified: {masked}")


async def test_providers_factory_and_mock_calls():
    print("\n--- 2. Testing Provider Factory & Unified AI Calls ---")
    await init_db()

    async with async_session_maker() as db:
        # Test Gemini
        gemini = await get_ai_provider("gemini", db, model_override="gemini-2.5-flash")
        gemini.api_key = "mock-gemini-key"
        res_gemini = await gemini.analyze_multimodal([], "Analyze this scene")
        assert res_gemini["status"] == "success"
        assert res_gemini["provider"] == "gemini"
        print("  [OK] Gemini provider instantiated & analyzed multimodal prompt (Mock mode).")

        # Test OpenAI
        openai_p = await get_ai_provider("openai", db, model_override="gpt-4o")
        openai_p.api_key = "mock-openai-key"
        res_openai = await openai_p.analyze_multimodal([], "Describe this scene")
        assert res_openai["status"] == "success"
        assert res_openai["provider"] == "openai"
        print("  [OK] OpenAI provider instantiated & analyzed multimodal prompt (Mock mode).")

        # Test Claude
        claude = await get_ai_provider("claude", db, model_override="claude-3-5-sonnet-20241022")
        claude.api_key = "mock-claude-key"
        res_claude = await claude.analyze_multimodal([], "Describe visual dynamics")
        assert res_claude["status"] == "success"
        assert res_claude["provider"] == "claude"
        print("  [OK] Claude provider instantiated & analyzed multimodal prompt (Mock mode).")

        # Test Missing Key Error handling
        gemini_empty = await get_ai_provider("gemini", db)
        gemini_empty.api_key = ""
        try:
            await gemini_empty.analyze_multimodal([], "test")
            assert False, "Should have raised AIProviderError for missing key"
        except AIProviderError as e:
            assert e.error_type == "missing_key"
            print(f"  [OK] Standardized missing key error caught: {e.message}")


async def test_rest_endpoints():
    print("\n--- 3. Testing REST Endpoints via HTTP ---")
    base_url = "http://127.0.0.1:8000/api/providers"

    async with httpx.AsyncClient(timeout=10.0) as client:
        # GET /api/providers
        res = await client.get(base_url)
        assert res.status_code == 200, f"GET failed: {res.text}"
        providers = res.json()
        assert len(providers) >= 3, "Expected at least Gemini, OpenAI, Claude"
        provider_ids = [p["provider"] for p in providers]
        assert "gemini" in provider_ids and "openai" in provider_ids and "claude" in provider_ids
        print(f"  [OK] GET /api/providers returned {len(providers)} providers: {provider_ids}")

        # POST /api/providers/gemini/key
        save_res = await client.post(
            f"{base_url}/gemini/key",
            json={"api_key": "mock-gemini-secret-test-key-1234", "selected_model": "gemini-2.5-flash"},
        )
        assert save_res.status_code == 200, f"Save failed: {save_res.text}"
        saved_info = save_res.json()
        assert saved_info["has_key"] is True
        assert "1234" in saved_info["masked_key"]
        assert "secret" not in saved_info["masked_key"]  # Raw secret must never be exposed
        print(f"  [OK] POST /api/providers/gemini/key successfully saved & returned masked key: {saved_info['masked_key']}")

        # POST /api/providers/gemini/test (using saved key)
        test_saved_res = await client.post(f"{base_url}/gemini/test")
        assert test_saved_res.status_code == 200
        test_saved_data = test_saved_res.json()
        assert test_saved_data["success"] is True
        print(f"  [OK] POST /api/providers/gemini/test (saved key): {test_saved_data['message']}")

        # POST /api/providers/openai/test (with explicit mock key payload)
        test_openai_res = await client.post(
            f"{base_url}/openai/test",
            json={"api_key": "mock-openai-key-9999", "selected_model": "gpt-4o"},
        )
        assert test_openai_res.status_code == 200
        test_openai_data = test_openai_res.json()
        assert test_openai_data["success"] is True
        print(f"  [OK] POST /api/providers/openai/test (live mock key): {test_openai_data['message']}")

        # POST /api/providers/claude/test (with explicit mock key payload)
        test_claude_res = await client.post(
            f"{base_url}/claude/test",
            json={"api_key": "mock-claude-key-8888", "selected_model": "claude-3-5-sonnet-20241022"},
        )
        assert test_claude_res.status_code == 200
        test_claude_data = test_claude_res.json()
        assert test_claude_data["success"] is True
        print(f"  [OK] POST /api/providers/claude/test (live mock key): {test_claude_data['message']}")

        # DELETE /api/providers/gemini/key
        del_res = await client.delete(f"{base_url}/gemini/key")
        assert del_res.status_code == 204
        print("  [OK] DELETE /api/providers/gemini/key cleared saved key.")

        # Re-verify GET /api/providers
        res_after = await client.get(base_url)
        gemini_after = next(p for p in res_after.json() if p["provider"] == "gemini")
        assert gemini_after["has_key"] is False
        assert gemini_after["masked_key"] is None
        print("  [OK] GET /api/providers confirms Gemini key was cleanly wiped.")


async def main():
    print("========================================")
    print("Running Phase 4 Provider Test Suite")
    print("========================================")
    await test_crypto_helpers()
    await test_providers_factory_and_mock_calls()
    await test_rest_endpoints()
    print("\n========================================")
    print("ALL PHASE 4 TESTS PASSED SUCCESSFULLY!")
    print("========================================")


if __name__ == "__main__":
    asyncio.run(main())
