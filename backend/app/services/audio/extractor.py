import subprocess
from pathlib import Path
from typing import Optional, Tuple
from app.utils.ffmpeg_check import get_ffmpeg_path


def extract_audio_from_video(
    video_path: str | Path,
    project_dir: Path,
) -> Tuple[Optional[Path], Optional[Path]]:
    """
    Extracts audio from video:
    1. 16kHz mono PCM WAV for Whisper / STT processing
    2. MP3 file for frontend web playback
    Returns (wav_path, mp3_path) or (None, None) if no audio stream exists.
    """
    ffmpeg_bin = get_ffmpeg_path()
    if not ffmpeg_bin:
        print("FFmpeg not available for audio extraction.")
        return None, None

    audio_dir = project_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    wav_path = audio_dir / "extracted_16k.wav"
    mp3_path = audio_dir / "preview.mp3"

    # 1. Extract 16kHz mono WAV for Whisper
    cmd_wav = [
        ffmpeg_bin,
        "-y",
        "-i", str(video_path),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(wav_path),
    ]

    try:
        res = subprocess.run(cmd_wav, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
        if res.returncode != 0 or not wav_path.exists() or wav_path.stat().st_size < 100:
            # Video likely has no audio stream
            return None, None
    except Exception as e:
        print(f"Error extracting WAV audio: {e}")
        return None, None

    # 2. Extract MP3 for browser playback
    cmd_mp3 = [
        ffmpeg_bin,
        "-y",
        "-i", str(video_path),
        "-vn",
        "-c:a", "libmp3lame",
        "-b:a", "128k",
        str(mp3_path),
    ]

    try:
        subprocess.run(cmd_mp3, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
    except Exception:
        pass

    return wav_path, mp3_path if mp3_path.exists() else None
