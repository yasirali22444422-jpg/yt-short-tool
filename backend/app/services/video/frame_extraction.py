import subprocess
from pathlib import Path
from typing import TypedDict
from PIL import Image

from app.services.video.scene_detection import SceneInterval
from app.utils.ffmpeg_check import get_ffmpeg_path


class ExtractedFrame(TypedDict):
    frame_type: str  # 'start', 'middle', 'end', 'motion'
    timestamp: float
    file_path: str
    relative_url: str


def extract_frame_ffmpeg(video_path: str, timestamp: float, output_path: Path) -> bool:
    ffmpeg_bin = get_ffmpeg_path()
    if not ffmpeg_bin:
        return False

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_bin,
        "-y",
        "-ss", str(timestamp),
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        str(output_path),
    ]

    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
        return res.returncode == 0 and output_path.is_file() and output_path.stat().st_size > 0
    except Exception as e:
        print(f"FFmpeg frame extract error at {timestamp}: {e}")
        return False


def extract_frame_opencv(video_path: str, timestamp: float, output_path: Path) -> bool:
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return False

        # Seek to timestamp in milliseconds
        cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
        ret, frame = cap.read()
        cap.release()

        if ret and frame is not None:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(output_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            return True
        return False
    except Exception as e:
        print(f"OpenCV frame extract error at {timestamp}: {e}")
        return False


def extract_frame(video_path: str, timestamp: float, output_path: Path) -> bool:
    if extract_frame_ffmpeg(video_path, timestamp, output_path):
        return True
    return extract_frame_opencv(video_path, timestamp, output_path)


def determine_frame_timestamps(scene: SceneInterval, mode: str = "detailed") -> list[tuple[str, float]]:
    """
    Returns list of (frame_type, timestamp) for the scene based on analysis mode.
    """
    start = scene["start_time"]
    end = scene["end_time"]
    dur = scene["duration"]

    # Offset by small delta so we don't grab cut transition boundary frames
    delta = min(0.1, dur * 0.1)
    t_start = round(start + delta, 2)
    t_mid = round((start + end) / 2.0, 2)
    t_end = round(max(start + delta, end - delta), 2)

    if mode == "fast":
        # 1-2 frames: middle, or start and end
        if dur < 2.0:
            return [("middle", t_mid)]
        return [("start", t_start), ("end", t_end)]

    elif mode == "detailed":
        # 3-5 frames: start, middle, end
        if dur <= 2.5:
            return [("start", t_start), ("middle", t_mid), ("end", t_end)]
        else:
            t_m1 = round(start + dur * 0.33, 2)
            t_m2 = round(start + dur * 0.66, 2)
            return [("start", t_start), ("motion", t_m1), ("middle", t_mid), ("motion", t_m2), ("end", t_end)]

    else:  # 'deep'
        # Adaptive: start, mid, end, and intervals every ~0.8s
        points: list[tuple[str, float]] = [("start", t_start)]
        step = 0.8
        curr = t_start + step
        while curr < t_end:
            points.append(("motion", round(curr, 2)))
            curr += step
        points.append(("end", t_end))
        return points


def extract_scene_keyframes(
    video_path: str | Path,
    scenes: list[SceneInterval],
    project_dir: Path,
    project_id: str,
    mode: str = "detailed",
) -> dict[int, list[ExtractedFrame]]:
    """
    Extracts keyframes for each scene and saves to project_dir/frames/.
    """
    frames_dir = project_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    results: dict[int, list[ExtractedFrame]] = {}

    for scene in scenes:
        scene_num = scene["scene_number"]
        timestamps = determine_frame_timestamps(scene, mode)
        scene_frames: list[ExtractedFrame] = []

        for idx, (f_type, ts) in enumerate(timestamps):
            frame_filename = f"scene_{scene_num:03d}_{idx:02d}_{f_type}.jpg"
            dest = frames_dir / frame_filename

            success = extract_frame(str(video_path), ts, dest)
            if success:
                # Create optimized thumbnail version if large
                try:
                    with Image.open(dest) as img:
                        if max(img.size) > 1280:
                            img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                            img.save(dest, "JPEG", quality=85)
                except Exception:
                    pass

                rel_url = f"/api/projects/{project_id}/frames/{frame_filename}"
                scene_frames.append({
                    "frame_type": f_type,
                    "timestamp": ts,
                    "file_path": str(dest),
                    "relative_url": rel_url,
                })

        results[scene_num] = scene_frames

    return results
