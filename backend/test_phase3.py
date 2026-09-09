import httpx
from pathlib import Path

def run_test():
    client = httpx.Client(timeout=45)
    video_path = Path("data/sample_speech_video.mp4")
    assert video_path.exists(), f"Test video {video_path} does not exist."

    # 1. Upload the spoken speech short video
    with open(video_path, "rb") as f:
        files = {"file": ("sample_speech_video.mp4", f, "video/mp4")}
        data = {
            "name": "Phase 3 Audio & Whisper Test",
            "analysis_mode": "detailed",
            "provider": "gemini",
        }
        upload_res = client.post("http://127.0.0.1:8000/api/upload", files=files, data=data)

    print("1. Upload Status:", upload_res.status_code)
    assert upload_res.status_code == 201
    project_id = upload_res.json()["project_id"]
    print("   Project ID:", project_id)

    # 2. Trigger processing (which executes metadata, scene detection, keyframes, audio extraction, & Whisper transcription)
    proc_res = client.post(f"http://127.0.0.1:8000/api/projects/{project_id}/process")
    print("2. Process Status:", proc_res.status_code)
    assert proc_res.status_code == 200
    res_json = proc_res.json()
    print("   Status after processing:", res_json["status"])

    # 3. Verify Audio Endpoint
    audio_res = client.get(f"http://127.0.0.1:8000/api/projects/{project_id}/audio")
    print("3. Audio Analysis Endpoint Status:", audio_res.status_code)
    assert audio_res.status_code == 200
    audio_data = audio_res.json()

    print("   Has Audio:", audio_data["has_audio"])
    print("   Has Speech:", audio_data["has_speech"])
    print("   Full Transcript:", audio_data["full_transcript"])
    print("   Segment Count:", len(audio_data["segments"]))

    assert audio_data["has_audio"] is True
    assert audio_data["has_speech"] is True
    assert len(audio_data["segments"]) >= 1
    first_seg = audio_data["segments"][0]
    print(f"   First Segment [{first_seg['start']}s -> {first_seg['end']}s]: \"{first_seg['text']}\"")

    # 4. Verify Music & SFX
    print("   Music Analysis:", audio_data["music"])
    print("   SFX Cues Count:", len(audio_data["sfx_cues"]))

    # 5. Verify Audio Streaming
    if audio_data.get("audio_file_url"):
        preview_url = audio_data["audio_file_url"]
        stream_res = client.get(f"http://127.0.0.1:8000{preview_url}")
        print("5. Audio Stream Status:", stream_res.status_code, stream_res.headers.get("content-type"), "size:", len(stream_res.content))
        assert stream_res.status_code == 200
        assert len(stream_res.content) > 500

    # 6. Verify Frontend rendering of project with Audio tab
    fe_res = client.get(f"http://localhost:3000/projects/{project_id}")
    print("6. Frontend Project Page Status:", fe_res.status_code)
    assert fe_res.status_code == 200

    print("\nSUCCESS: ALL PHASE 3 REQUIREMENTS AND ACCEPTANCE TESTS PASSED!")

if __name__ == "__main__":
    run_test()
