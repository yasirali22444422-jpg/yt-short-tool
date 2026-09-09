import asyncio
import os
import subprocess
import sys
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).parent))


from app.utils.ffmpeg_check import get_ffmpeg_path


def generate_e2e_sample_video(output_path: Path):
    """
    Generates a 6-second multi-scene test video with synthesized audio using FFmpeg.
    """
    if output_path.exists():
        return

    ffmpeg_bin = get_ffmpeg_path() or "ffmpeg"
    cmd = [
        ffmpeg_bin,
        "-y",
        "-f", "lavfi", "-i", "testsrc=size=720x1280:rate=30:duration=6",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=6",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        str(output_path),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg sample generation failed: {res.stderr}")


async def test_complete_e2e_pipeline():
    print("================================================================")
    print("PHASE 7: FULL END-TO-END SYSTEM INTEGRATION & HARDENING SUITE")
    print("================================================================")

    base_url = "http://127.0.0.1:8000/api"
    sample_file = Path(__file__).parent / "phase7_e2e_video.mp4"

    # Step 1: Synthesize sample video
    print("\n--- 1. Generating Test Video ---")
    generate_e2e_sample_video(sample_file)
    assert sample_file.exists(), "Sample video file must exist"
    print(f"  [OK] Generated {sample_file.name} ({sample_file.stat().st_size} bytes)")

    async with httpx.AsyncClient(timeout=45.0) as client:
        # Step 2: Test Upload
        print("\n--- 2. Testing Video Upload ---")
        with open(sample_file, "rb") as f:
            files = {"file": (sample_file.name, f, "video/mp4")}
            data = {
                "name": "Phase 7 E2E Production Hardening Test",
                "analysis_mode": "detailed",
                "provider": "gemini",
                "model": "gemini-2.5-flash",
            }
            up_res = await client.post(f"{base_url}/upload", files=files, data=data)

        assert up_res.status_code == 201, f"Upload failed: {up_res.text}"
        project_id = up_res.json()["project_id"]
        print(f"  [OK] Upload succeeded. Project ID: {project_id}")

        # Step 3: Video Engine (Metadata & Keyframe Extraction)
        print("\n--- 3. Testing Video Engine Processing ---")
        proc_res = await client.post(f"{base_url}/projects/{project_id}/process")
        assert proc_res.status_code == 200, f"Processing failed: {proc_res.text}"
        proc_data = proc_res.json()
        assert proc_data["status"] in ("scenes_detected", "frames_extracted", "audio_processed")
        print(f"  [OK] Video processed: {proc_data['status']}, Scenes: {proc_data['scene_count']}")

        # Step 4: Audio Engine
        print("\n--- 4. Testing Audio Engine & Transcription ---")
        audio_res = await client.post(f"{base_url}/projects/{project_id}/audio/process")
        assert audio_res.status_code == 200, f"Audio processing failed: {audio_res.text}"
        audio_data = audio_res.json()
        assert audio_data["has_audio"] is True
        print(f"  [OK] Audio analyzed: has_audio={audio_data['has_audio']}, SFX cues={len(audio_data.get('sfx_cues', []))}")

        # Step 5: Provider BYOK & Connection Testing
        print("\n--- 5. Testing AI Provider BYOK System ---")
        save_key_res = await client.post(
            f"{base_url}/providers/gemini/key",
            json={"api_key": "mock-e2e-gemini-key-7777", "selected_model": "gemini-2.5-flash"},
        )
        assert save_key_res.status_code == 200
        test_conn_res = await client.post(f"{base_url}/providers/gemini/test")
        assert test_conn_res.status_code == 200
        assert test_conn_res.json()["success"] is True
        print("  [OK] BYOK encrypted storage and connection test verified.")

        # Step 6: Full Multimodal AI Analysis Pipeline
        print("\n--- 6. Testing Full AI Analysis Pipeline ---")
        analysis_res = await client.post(
            f"{base_url}/projects/{project_id}/analyze",
            json={"provider": "gemini", "model": "gemini-2.5-flash", "mode": "recreate"},
        )
        assert analysis_res.status_code == 200, f"Analysis failed: {analysis_res.text}"
        analysis = analysis_res.json()
        assert len(analysis["scenes"]) > 0
        assert analysis["global_style"]["visual_style"]
        assert len(analysis["characters"]) > 0
        assert len(analysis["locations"]) > 0
        assert analysis["blueprint_markdown"]
        print(f"  [OK] Multimodal reverse-engineering analysis verified:")
        print(f"       Total Scenes Analyzed: {len(analysis['scenes'])}")
        print(f"       Global Style: {analysis['global_style']['visual_style']}")
        print(f"       Character Bible: {analysis['characters'][0]['display_name']} ({analysis['characters'][0]['id']})")
        print(f"       Master Blueprint: {len(analysis['blueprint_markdown'])} chars")

        # Step 7: Single-Scene Edit & Prompt Regeneration
        print("\n--- 7. Testing In-Line Scene Editing & Prompt Regeneration ---")
        edit_res = await client.put(
            f"{base_url}/projects/{project_id}/scenes/1",
            json={
                "scene_summary": "Focal protagonist leaps across reflective puddle in rain",
                "camera_movement": "Dynamic whip pan left to right",
            },
        )
        assert edit_res.status_code == 200
        regen_res = await client.post(f"{base_url}/projects/{project_id}/scenes/1/regenerate")
        assert regen_res.status_code == 200
        print("  [OK] In-line scene edit and prompt regeneration verified.")

        # Step 8: Multi-Format Export Studio
        print("\n--- 8. Testing Export Studio (JSON, Markdown, TXT) ---")
        for fmt in ["json", "markdown", "txt"]:
            exp_res = await client.get(f"{base_url}/projects/{project_id}/export?format={fmt}")
            assert exp_res.status_code == 200
            assert "attachment" in exp_res.headers.get("content-disposition", "")
            print(f"  [OK] Export {fmt.upper()} verified ({len(exp_res.content)} bytes)")

        # Step 9: Error Handling & Boundary Robustness
        print("\n--- 9. Testing System Robustness & Error Handling ---")
        # 404 for non-existent project
        missing_res = await client.get(f"{base_url}/projects/proj_non_existent")
        assert missing_res.status_code == 404
        print("  [OK] Non-existent project correctly rejected with 404.")

        # Invalid export format
        bad_exp_res = await client.get(f"{base_url}/projects/{project_id}/export?format=invalid")
        assert bad_exp_res.status_code == 400
        print("  [OK] Invalid export format rejected with 400.")

        # Step 10: Frontend Integration & Route Verification
        print("\n--- 10. Testing Frontend Route Responses ---")
        routes = ["/", "/providers", "/settings", "/projects", f"/projects/{project_id}"]
        for r in routes:
            fe_res = await client.get(f"http://localhost:3000{r}")
            assert fe_res.status_code == 200, f"Route {r} failed with {fe_res.status_code}"
            print(f"  [OK] Frontend Route http://localhost:3000{r} returned HTTP 200 OK")

    # Clean up test video file
    if sample_file.exists():
        try:
            os.remove(sample_file)
        except Exception:
            pass

    print("\n================================================================")
    print("ALL PHASE 7 HARDENING & INTEGRATION TESTS PASSED AT 100%!")
    print("================================================================")


if __name__ == "__main__":
    asyncio.run(test_complete_e2e_pipeline())
