import asyncio
import sys
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).parent))


async def test_phase6_export_and_studio():
    print("==================================================")
    print("Running Phase 6 Export & Recreation Studio Tests")
    print("==================================================")

    base_url = "http://127.0.0.1:8000/api"

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Fetch existing project
        res = await client.get(f"{base_url}/projects")
        assert res.status_code == 200
        projects = res.json()
        assert len(projects) > 0
        project_id = projects[0]["id"]
        project_name = projects[0]["name"]
        print(f"  [OK] Selected project: {project_id} ({project_name})")

        # Ensure analysis has been run
        try:
            a_res = await client.get(f"{base_url}/projects/{project_id}/analysis")
            if a_res.status_code != 200:
                print("  --> Triggering initial analysis...")
                await client.post(f"{base_url}/projects/{project_id}/analyze")
        except Exception:
            await client.post(f"{base_url}/projects/{project_id}/analyze")

        # 2. Test Export JSON
        json_res = await client.get(f"{base_url}/projects/{project_id}/export?format=json")
        assert json_res.status_code == 200
        assert "application/json" in json_res.headers.get("content-type", "")
        assert "attachment" in json_res.headers.get("content-disposition", "")
        json_data = json_res.json()
        assert json_data["project_id"] == project_id
        assert len(json_data["scenes"]) > 0
        print(f"  [OK] Export JSON verified (Size: {len(json_res.content)} bytes, Content-Disposition: {json_res.headers.get('content-disposition')})")

        # 3. Test Export Markdown
        md_res = await client.get(f"{base_url}/projects/{project_id}/export?format=markdown")
        assert md_res.status_code == 200
        assert "text/markdown" in md_res.headers.get("content-type", "")
        assert "attachment" in md_res.headers.get("content-disposition", "")
        assert "# Master Recreation Blueprint" in md_res.text
        print(f"  [OK] Export Markdown verified (Size: {len(md_res.content)} bytes)")

        # 4. Test Export Plaintext TXT
        txt_res = await client.get(f"{base_url}/projects/{project_id}/export?format=txt")
        assert txt_res.status_code == 200
        assert "text/plain" in txt_res.headers.get("content-type", "")
        assert "attachment" in txt_res.headers.get("content-disposition", "")
        assert "AI RECREATION PROMPT BOOK" in txt_res.text
        assert "[IMAGE GENERATION PROMPT (KEYFRAME)]:" in txt_res.text
        assert "[IMAGE-TO-VIDEO ANIMATION PROMPT (I2V)]:" in txt_res.text
        print(f"  [OK] Export TXT prompt book verified (Size: {len(txt_res.content)} bytes)")

        # 5. Test Frontend Project Page Render
        fe_res = await client.get(f"http://localhost:3000/projects/{project_id}")
        assert fe_res.status_code == 200
        assert "<html" in fe_res.text.lower()
        print(f"  [OK] Frontend Studio Dashboard rendered HTTP 200 OK.")

    print("\n==================================================")
    print("ALL PHASE 6 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(test_phase6_export_and_studio())
