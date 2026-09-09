import httpx
from pathlib import Path

def run_test():
    client = httpx.Client(timeout=30)
    video_path = Path("data/sample_3scenes_9sec.mp4")
    assert video_path.exists(), f"Test video {video_path} does not exist."

    # 1. Upload the 9s 3-scene video
    with open(video_path, "rb") as f:
        files = {"file": ("sample_3scenes_9sec.mp4", f, "video/mp4")}
        data = {
            "name": "Phase 2 Real 3-Scene Test",
            "analysis_mode": "detailed",
            "provider": "gemini",
        }
        upload_res = client.post("http://127.0.0.1:8000/api/upload", files=files, data=data)

    print("1. Upload Status:", upload_res.status_code)
    assert upload_res.status_code == 201
    project_id = upload_res.json()["project_id"]
    print("   Project ID:", project_id)

    # 2. Trigger Phase 2 video processing
    proc_res = client.post(f"http://127.0.0.1:8000/api/projects/{project_id}/process")
    print("2. Process Status:", proc_res.status_code)
    assert proc_res.status_code == 200
    result = proc_res.json()
    print("   Status after processing:", result["status"])
    print("   Detected Metadata:", result["metadata"])
    print("   Scene Count:", result["scene_count"])
    assert result["scene_count"] >= 3, f"Expected >=3 scenes, got {result['scene_count']}"

    # 3. Verify scenes API endpoint
    scenes_res = client.get(f"http://127.0.0.1:8000/api/projects/{project_id}/scenes")
    print("3. Scenes endpoint status:", scenes_res.status_code)
    assert scenes_res.status_code == 200
    scenes_data = scenes_res.json()["scenes"]
    print("   Retrieved scenes from DB:", len(scenes_data))

    first_scene = scenes_data[0]
    print("   Scene 1 frames count:", first_scene["frame_count"])
    assert first_scene["frame_count"] >= 1
    first_frame_url = first_scene["frames"][0]["relative_url"]
    print("   Scene 1 first frame URL:", first_frame_url)

    # 4. Verify frame image serving
    frame_res = client.get(f"http://127.0.0.1:8000{first_frame_url}")
    print("4. Frame image HTTP Status:", frame_res.status_code, frame_res.headers.get("content-type"), "size:", len(frame_res.content))
    assert frame_res.status_code == 200
    assert "image/jpeg" in frame_res.headers.get("content-type", "")
    assert len(frame_res.content) > 1000

    # 5. Verify Next.js frontend route for this project
    fe_res = client.get(f"http://localhost:3000/projects/{project_id}")
    print("5. Frontend project page status:", fe_res.status_code)
    assert fe_res.status_code == 200

    print("\nSUCCESS: ALL PHASE 2 REQUIREMENTS AND ACCEPTANCE TESTS PASSED!")

if __name__ == "__main__":
    run_test()
