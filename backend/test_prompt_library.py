import sys
import requests
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api/prompts"

def test_prompt_library():
    print("Testing Prompt Library Endpoints...")

    # 1. Fetch all templates
    resp = requests.get(f"{BASE_URL}/templates")
    assert resp.status_code == 200, f"Failed to get templates: {resp.status_code} {resp.text}"
    templates = resp.json()
    print(f"Total templates found: {len(templates)}")
    assert len(templates) >= 4, f"Expected at least 4 templates, got {len(templates)}"

    # Check categories and content sizes
    categories_found = set()
    for t in templates:
        print(f" - [{t['category']}] '{t['title'][:40]}...' ({len(t['content'])} chars, ID: {t['id']})")
        categories_found.add(t["category"])
        assert len(t["content"]) > 10000, f"Template {t['id']} content suspiciously short: {len(t['content'])} chars"
        assert t["category"] in [
            "ASMR & Kids Content",
            "Interactive Form Generators & HTML Tools",
            "Industrial & Manufacturing Video Scripts"
        ], f"Unexpected category: {t['category']}"

    assert "ASMR & Kids Content" in categories_found
    assert "Interactive Form Generators & HTML Tools" in categories_found
    assert "Industrial & Manufacturing Video Scripts" in categories_found
    print("All required categories verified.")

    # 2. Test Category filter
    resp_filter = requests.get(f"{BASE_URL}/templates", params={"category": "Industrial & Manufacturing Video Scripts"})
    assert resp_filter.status_code == 200
    industrial = resp_filter.json()
    print(f"Filtered 'Industrial & Manufacturing Video Scripts': {len(industrial)} templates")
    assert len(industrial) == 2, f"Expected 2 industrial templates, got {len(industrial)}"

    # 3. Test Single Template retrieval
    first_id = templates[0]["id"]
    resp_single = requests.get(f"{BASE_URL}/templates/{first_id}")
    assert resp_single.status_code == 200
    single = resp_single.json()
    assert single["id"] == first_id
    assert single["content"] == templates[0]["content"]
    print(f"Single template fetch verified for ID {first_id}")

    # 4. Test Update (Edit) Template
    original_title = single["title"]
    updated_title = original_title + " [EDITED TEST]"
    resp_put = requests.put(
        f"{BASE_URL}/templates/{first_id}",
        json={"title": updated_title, "description": "Updated description for verification"}
    )
    assert resp_put.status_code == 200
    put_data = resp_put.json()
    assert put_data["title"] == updated_title
    assert put_data["description"] == "Updated description for verification"

    # Verify persistence by refetching
    resp_refetch = requests.get(f"{BASE_URL}/templates/{first_id}")
    assert resp_refetch.status_code == 200
    refetched = resp_refetch.json()
    assert refetched["title"] == updated_title
    print(f"Update and persistence verified.")

    # Revert update
    resp_revert = requests.put(
        f"{BASE_URL}/templates/{first_id}",
        json={"title": original_title, "description": single["description"]}
    )
    assert resp_revert.status_code == 200
    print("Reverted edit test successfully.")

    # 5. Test Re-import without creating duplicates
    resp_import = requests.post(f"{BASE_URL}/import-library")
    assert resp_import.status_code == 200
    import_result = resp_import.json()
    print(f"Re-import library result: {import_result['message']}")
    
    resp_after_import = requests.get(f"{BASE_URL}/templates")
    assert len(resp_after_import.json()) == len(templates), "Re-import should not create duplicate entries!"

    print("\nALL PROMPT LIBRARY TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_prompt_library()
