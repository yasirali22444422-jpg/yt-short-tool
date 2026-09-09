import asyncio
import json
import sys
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).parent))

from app.database.session import async_session_maker
from app.models.database import Project, Scene


async def test_scene_frames_safety():
    print("==========================================================")
    print("TESTING SCENE FRAMES SAFETY & NORMALIZATION FIX")
    print("==========================================================")

    base_url = "http://127.0.0.1:8000/api"

    # Step 1: Create a test project with scenes in various edge case states
    async with async_session_maker() as db:
        test_proj = Project(
            name="Test Scene Frames Edge Cases",
            status="scenes_detected",
            analysis_mode="detailed",
            provider="gemini",
            model="gemini-2.5-flash",
        )
        db.add(test_proj)
        await db.commit()
        await db.refresh(test_proj)
        proj_id = test_proj.id

        # Scene 1: Normal frames array
        s1 = Scene(
            project_id=proj_id,
            scene_number=1,
            start_time="0.0",
            end_time="2.5",
            analysis_json=json.dumps({
                "scene_number": 1,
                "start_time": 0.0,
                "end_time": 2.5,
                "duration": 2.5,
                "frames": [
                    {"frame_type": "start", "timestamp": 0.0, "file_path": "", "relative_url": "/api/projects/test/frames/f1.jpg"}
                ],
                "frame_count": 1,
            }),
        )

        # Scene 2: frames is None / missing completely (Legacy or corrupt record)
        s2 = Scene(
            project_id=proj_id,
            scene_number=2,
            start_time="2.5",
            end_time="5.0",
            analysis_json=json.dumps({
                "scene_number": 2,
                "start_time": 2.5,
                "end_time": 5.0,
                "duration": 2.5,
                # No "frames" key at all!
            }),
        )

        # Scene 3: analysis_json is None or empty string
        s3 = Scene(
            project_id=proj_id,
            scene_number=3,
            start_time="5.0",
            end_time="7.5",
            analysis_json=None,
        )

        # Scene 4: Phase 5 style with keyframe_urls but no frames array
        s4 = Scene(
            project_id=proj_id,
            scene_number=4,
            start_time="7.5",
            end_time="10.0",
            analysis_json=json.dumps({
                "scene_number": 4,
                "start_time": 7.5,
                "end_time": 10.0,
                "duration": 2.5,
                "keyframe_urls": ["/api/projects/test/frames/f4.jpg"],
            }),
        )

        db.add_all([s1, s2, s3, s4])
        await db.commit()

    # Step 2: Query GET /api/projects/{proj_id}/scenes
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(f"{base_url}/projects/{proj_id}/scenes")
        assert res.status_code == 200, f"Failed to get scenes: {res.text}"
        data = res.json()
        scenes = data["scenes"]
        assert len(scenes) == 4, f"Expected 4 scenes, got {len(scenes)}"

        for scn in scenes:
            assert "frames" in scn, f"Scene {scn['scene_number']} missing 'frames'"
            assert isinstance(scn["frames"], list), f"Scene {scn['scene_number']} 'frames' is not a list: {type(scn['frames'])}"
            assert isinstance(scn["frame_count"], int)
            print(f"  [OK] Scene {scn['scene_number']}: frames count = {len(scn['frames'])}, frame_count = {scn['frame_count']}")

        # Verify Scene 2 (which had no frames key) normalized to empty list []
        assert scenes[1]["frames"] == [], "Scene 2 should have normalized to empty list"
        # Verify Scene 3 (which had analysis_json=None) normalized to empty list []
        assert scenes[2]["frames"] == [], "Scene 3 should have normalized to empty list"
        # Verify Scene 4 (which had keyframe_urls) normalized frames from keyframe_urls
        assert len(scenes[3]["frames"]) == 1, "Scene 4 should have converted keyframe_urls into frames"

        # Step 3: Test Frontend Project Page Render
        print("\n--- Testing Frontend Project Detail Page with Empty & Non-Empty Frames ---")
        fe_res = await client.get(f"http://localhost:3000/projects/{proj_id}")
        assert fe_res.status_code == 200, f"Frontend returned {fe_res.status_code}"
        assert "<html" in fe_res.text.lower()
        print(f"  [OK] Frontend rendered successfully with status 200 OK (no crashes with missing frames!)")

    print("\n==========================================================")
    print("ALL SCENE FRAMES SAFETY TESTS PASSED 100%!")
    print("==========================================================")


if __name__ == "__main__":
    asyncio.run(test_scene_frames_safety())
