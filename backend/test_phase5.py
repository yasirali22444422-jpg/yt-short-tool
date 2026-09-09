import asyncio
import sys
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).parent))


async def test_phase5_pipeline():
    print("========================================")
    print("Running Phase 5 Analysis Pipeline Tests")
    print("========================================")

    base_url = "http://127.0.0.1:8000/api"

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Fetch existing projects to test on
        res = await client.get(f"{base_url}/projects")
        assert res.status_code == 200
        projects = res.json()
        assert len(projects) > 0, "Need at least one project from Phase 2/3"
        proj = projects[0]
        project_id = proj["id"]
        print(f"  [OK] Using test project: {project_id} ({proj['name']})")

        # 2. Trigger Full AI Analysis (Recreate mode)
        print("  --> Triggering POST /api/projects/{id}/analyze...")
        analyze_res = await client.post(
            f"{base_url}/projects/{project_id}/analyze",
            json={"provider": "gemini", "model": "gemini-2.5-flash", "mode": "recreate"},
        )
        assert analyze_res.status_code == 200, f"Analysis failed: {analyze_res.text}"
        data = analyze_res.json()

        # Validate Global Style DNA
        assert "global_style" in data
        style = data["global_style"]
        assert "visual_style" in style and "color_palette" in style and "lighting_style" in style
        print(f"  [OK] Global Style DNA verified: {style['visual_style']} | {style['medium']}")

        # Validate Editing DNA
        assert "editing_dna" in data
        editing = data["editing_dna"]
        assert "average_shot_length" in editing
        print(f"  [OK] Editing DNA verified: pacing={editing['editing_pace']}, avg_shot={editing['average_shot_length']}s")

        # Validate Characters & Locations
        assert len(data["characters"]) > 0
        char0 = data["characters"][0]
        assert char0["id"].startswith("CHAR_")
        print(f"  [OK] Character Bible item verified: {char0['id']} ({char0['display_name']})")

        assert len(data["locations"]) > 0
        loc0 = data["locations"][0]
        assert loc0["id"].startswith("LOC_")
        print(f"  [OK] Location Registry verified: {loc0['id']} ({loc0['name']})")

        # Validate Scenes and Prompts
        scenes = data["scenes"]
        assert len(scenes) > 0
        for scn in scenes:
            assert scn["image_prompt"], "Image prompt must not be empty"
            assert scn["animation_prompt"], "I2V prompt must not be empty"
            assert scn["text_to_video_prompt"], "T2V prompt must not be empty"
            assert scn["negative_prompt"], "Negative prompt must not be empty"
            assert "camera_shot" in scn and "camera_movement" in scn and "lighting" in scn

        print(f"  [OK] All {len(scenes)} scenes verified with Image, I2V, T2V, and Negative prompts.")
        print(f"       Scene 1 Image Prompt: {scenes[0]['image_prompt'][:90]}...")
        print(f"       Scene 1 I2V Prompt:   {scenes[0]['animation_prompt'][:90]}...")

        # Validate Master Blueprint Markdown
        assert data["blueprint_markdown"]
        assert "# Master Recreation Blueprint" in data["blueprint_markdown"]
        assert "## 1. Global Style DNA" in data["blueprint_markdown"]
        assert "## 5. Scene-by-Scene Recreation Prompts" in data["blueprint_markdown"]
        print(f"  [OK] Master Recreation Blueprint document generated ({len(data['blueprint_markdown'])} chars).")

        # Validate Remix Mode
        assert data["remix_data"] is not None
        remix = data["remix_data"]
        assert remix["remix_concept"]
        assert len(remix["remixed_scenes"]) == len(scenes)
        print(f"  [OK] Remix Mode verified: '{remix['remix_concept']}' across {len(remix['remixed_scenes'])} scenes.")

        # 3. Test GET /api/projects/{id}/analysis
        get_res = await client.get(f"{base_url}/projects/{project_id}/analysis")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["project_id"] == project_id
        print("  [OK] GET /api/projects/{id}/analysis successfully returned cached analysis package.")

        # 4. Test Single-Scene Prompt Regeneration
        print("  --> Testing POST /api/projects/{id}/scenes/1/regenerate...")
        regen_res = await client.post(f"{base_url}/projects/{project_id}/scenes/1/regenerate")
        assert regen_res.status_code == 200
        regen_data = regen_res.json()
        assert regen_data["scene_number"] == 1
        assert regen_data["image_prompt"]
        print("  [OK] Single scene regenerated successfully.")

        # 5. Test User Scene Edits via PUT
        print("  --> Testing PUT /api/projects/{id}/scenes/1 with custom director notes...")
        edit_res = await client.put(
            f"{base_url}/projects/{project_id}/scenes/1",
            json={
                "scene_summary": "Hero protagonist steps into golden volumetric sunlight",
                "camera_shot": "Extreme Close-up",
                "camera_angle": "Dutch angle",
                "camera_movement": "Rapid orbit around subject",
            },
        )
        assert edit_res.status_code == 200
        edit_data = edit_res.json()
        assert edit_data["camera_shot"] == "Extreme Close-up"
        assert edit_data["camera_angle"] == "Dutch angle"
        assert "Extreme Close-up" in edit_data["image_prompt"]
        print("  [OK] Scene edit saved & prompt re-synchronized successfully.")

    print("\n========================================")
    print("ALL PHASE 5 TESTS PASSED SUCCESSFULLY!")
    print("========================================")


if __name__ == "__main__":
    asyncio.run(test_phase5_pipeline())
