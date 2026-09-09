import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional


def find_binary(binary_name: str) -> Optional[str]:
    """
    Locates binary (ffmpeg or ffprobe) across:
    1. System PATH
    2. Local backend/bin directory
    3. Common Windows package manager locations
    """
    # 1. Direct path check
    found = shutil.which(binary_name)
    if found:
        return found

    # 2. Local backend bin directory
    base_dir = Path(__file__).resolve().parent.parent.parent
    local_bin = base_dir / "bin" / f"{binary_name}.exe"
    if local_bin.is_file():
        return str(local_bin)

    # 3. Check common Windows paths
    candidates = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages",
        Path(os.environ.get("PROGRAMFILES", "C:\\Program Files")) / "FFmpeg" / "bin",
        Path("C:\\ffmpeg\\bin"),
        Path(os.environ.get("USERPROFILE", "")) / "scoop" / "shims",
    ]

    for cand in candidates:
        if cand.exists():
            direct = cand / f"{binary_name}.exe"
            if direct.is_file():
                return str(direct)
            # Scan one level of subdirectories for winget packages
            try:
                for match in cand.glob(f"**/{binary_name}.exe"):
                    if match.is_file():
                        return str(match)
            except Exception:
                continue

    return None


def get_ffmpeg_path() -> Optional[str]:
    return find_binary("ffmpeg")


def get_ffprobe_path() -> Optional[str]:
    return find_binary("ffprobe")


def check_ffmpeg_status() -> dict[str, any]:
    ffmpeg_bin = get_ffmpeg_path()
    ffprobe_bin = get_ffprobe_path()

    status = {
        "ffmpeg_installed": ffmpeg_bin is not None,
        "ffprobe_installed": ffprobe_bin is not None,
        "ffmpeg_path": ffmpeg_bin,
        "ffprobe_path": ffprobe_bin,
        "version": None,
    }

    if ffmpeg_bin:
        try:
            res = subprocess.run(
                [ffmpeg_bin, "-version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5,
            )
            first_line = res.stdout.splitlines()[0] if res.stdout else "unknown"
            status["version"] = first_line
        except Exception as e:
            status["version_error"] = str(e)

    return status
