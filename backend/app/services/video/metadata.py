import json
import math
import subprocess
from pathlib import Path
from typing import Optional
from app.config import settings
from app.schemas.project import VideoMetadata
from app.utils.ffmpeg_check import get_ffprobe_path


def calculate_aspect_ratio(width: int, height: int) -> str:
    if width <= 0 or height <= 0:
        return "Unknown"
    gcd = math.gcd(width, height)
    aspect_w = width // gcd
    aspect_h = height // gcd
    # Map common ratios cleanly
    ratio_val = width / height
    if abs(ratio_val - 9 / 16) < 0.03:
        return "9:16"
    if abs(ratio_val - 16 / 9) < 0.03:
        return "16:9"
    if abs(ratio_val - 1.0) < 0.03:
        return "1:1"
    if abs(ratio_val - 4 / 3) < 0.03:
        return "4:3"
    if abs(ratio_val - 3 / 4) < 0.03:
        return "3:4"
    return f"{aspect_w}:{aspect_h}"


def extract_metadata_ffprobe(video_path: str | Path) -> Optional[VideoMetadata]:
    """
    Extracts detected technical metadata using ffprobe.
    These fields are DETECTED FACTS, not AI guesses.
    """
    path_str = str(video_path)
    ffprobe_bin = get_ffprobe_path()
    if not ffprobe_bin:
        return None

    cmd = [
        ffprobe_bin,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        path_str,
    ]

    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if res.returncode != 0 or not res.stdout:
            return None

        data = json.loads(res.stdout)
        format_info = data.get("format", {})
        streams = data.get("streams", [])

        # Find primary video stream
        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

        duration = float(format_info.get("duration", 0.0))
        if duration == 0.0 and video_stream:
            duration = float(video_stream.get("duration", 0.0))

        width = int(video_stream.get("width", 0)) if video_stream else 0
        height = int(video_stream.get("height", 0)) if video_stream else 0

        # Calculate FPS
        fps = 30.0
        if video_stream and "r_frame_rate" in video_stream:
            try:
                num, den = video_stream["r_frame_rate"].split("/")
                fps = round(float(num) / float(den), 2)
            except Exception:
                pass

        file_size = int(format_info.get("size", Path(video_path).stat().st_size))

        return VideoMetadata(
            filename=Path(video_path).name,
            duration_seconds=round(duration, 2),
            width=width,
            height=height,
            aspect_ratio=calculate_aspect_ratio(width, height),
            fps=fps,
            codec=video_stream.get("codec_name", "unknown") if video_stream else "unknown",
            audio_codec=audio_stream.get("codec_name", "none") if audio_stream else "none",
            file_size_bytes=file_size,
        )
    except Exception as e:
        print(f"Error in extract_metadata_ffprobe: {e}")
        return None


def extract_metadata_fallback(video_path: str | Path) -> VideoMetadata:
    """
    Fallback metadata extractor using OpenCV / standard file stats
    when FFprobe is not available in PATH.
    """
    p = Path(video_path)
    file_size = p.stat().st_size if p.exists() else 0
    duration = 0.0
    width = 1080
    height = 1920
    fps = 30.0

    try:
        import cv2
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or width
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or height
            fps = round(cap.get(cv2.CAP_PROP_FPS) or 30.0, 2)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            if frame_count > 0 and fps > 0:
                duration = round(frame_count / fps, 2)
            cap.release()
    except Exception as e:
        print(f"Fallback metadata exception: {e}")

    return VideoMetadata(
        filename=p.name,
        duration_seconds=duration,
        width=width,
        height=height,
        aspect_ratio=calculate_aspect_ratio(width, height),
        fps=fps,
        codec="h264",
        audio_codec="aac",
        file_size_bytes=file_size,
    )


def extract_video_metadata(video_path: str | Path) -> VideoMetadata:
    """
    Primary metadata extraction function. Tries FFprobe first, falls back to OpenCV.
    """
    meta = extract_metadata_ffprobe(video_path)
    if meta:
        return meta
    return extract_metadata_fallback(video_path)
