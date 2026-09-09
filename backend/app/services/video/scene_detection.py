import os
from pathlib import Path
from typing import TypedDict


class SceneInterval(TypedDict):
    scene_number: int
    start_time: float
    end_time: float
    duration: float


def detect_scenes_pyscenedetect(video_path: str | Path, threshold: float = 27.0) -> list[SceneInterval]:
    """
    Detects scene boundaries using PySceneDetect ContentDetector.
    """
    try:
        from scenedetect import detect, ContentDetector, AdaptiveDetector
        # Short videos benefit from adaptive or content detector with min_scene_len of ~15 frames
        scene_list = detect(str(video_path), ContentDetector(threshold=threshold, min_scene_len=12))

        intervals: list[SceneInterval] = []
        for i, scene in enumerate(scene_list):
            start_sec = round(scene[0].get_seconds(), 2)
            end_sec = round(scene[1].get_seconds(), 2)
            duration = round(end_sec - start_sec, 2)
            if duration > 0.2:  # ignore sub-quarter-second glitch cuts
                intervals.append({
                    "scene_number": len(intervals) + 1,
                    "start_time": start_sec,
                    "end_time": end_sec,
                    "duration": duration,
                })
        return intervals
    except Exception as e:
        print(f"PySceneDetect detection warning: {e}")
        return []


def detect_scenes_opencv_fallback(video_path: str | Path, total_duration: float) -> list[SceneInterval]:
    """
    Fallback scene detection using OpenCV histogram comparison or time-segmenting.
    If video is short (< 10s) and single shot, produces 1 scene.
    If video is longer, splits into coherent segments.
    """
    try:
        import cv2
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return fallback_time_slices(total_duration)

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            cap.release()
            return fallback_time_slices(total_duration)

        cuts = [0]
        prev_hist = None
        frame_idx = 0
        step = max(1, int(fps / 5))  # Sample every 5th or 6th frame to be fast

        while True:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
            cv2.normalize(hist, hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

            if prev_hist is not None:
                correlation = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_CORREL)
                # Significant drop in correlation indicates a scene transition
                if correlation < 0.45:
                    time_since_last_cut = (frame_idx - cuts[-1]) / fps
                    if time_since_last_cut >= 1.0:  # Minimum 1 second shot
                        cuts.append(frame_idx)

            prev_hist = hist
            frame_idx += step
            if frame_idx >= total_frames:
                break

        cap.release()
        cuts.append(total_frames)

        intervals: list[SceneInterval] = []
        for i in range(len(cuts) - 1):
            s_sec = round(cuts[i] / fps, 2)
            e_sec = round(cuts[i + 1] / fps, 2)
            dur = round(e_sec - s_sec, 2)
            if dur >= 0.5:
                intervals.append({
                    "scene_number": len(intervals) + 1,
                    "start_time": s_sec,
                    "end_time": e_sec,
                    "duration": dur,
                })

        return intervals if intervals else fallback_time_slices(total_duration)
    except Exception as e:
        print(f"OpenCV fallback scene detection error: {e}")
        return fallback_time_slices(total_duration)


def fallback_time_slices(total_duration: float) -> list[SceneInterval]:
    dur = max(total_duration, 1.0)
    if dur <= 6.0:
        return [{
            "scene_number": 1,
            "start_time": 0.0,
            "end_time": dur,
            "duration": dur,
        }]
    # Divide into ~4 second chunks
    chunk_len = 4.0
    num_chunks = max(1, int(round(dur / chunk_len)))
    intervals: list[SceneInterval] = []
    for i in range(num_chunks):
        s = round(i * (dur / num_chunks), 2)
        e = round((i + 1) * (dur / num_chunks), 2)
        intervals.append({
            "scene_number": i + 1,
            "start_time": s,
            "end_time": e,
            "duration": round(e - s, 2),
        })
    return intervals


def detect_scenes(video_path: str | Path, total_duration: float) -> list[SceneInterval]:
    """
    Main scene detection orchestrator.
    Tries PySceneDetect first; if 0 scenes returned, falls back to OpenCV / histogram analysis.
    """
    scenes = detect_scenes_pyscenedetect(video_path)
    if scenes and len(scenes) > 0:
        return scenes
    return detect_scenes_opencv_fallback(video_path, total_duration)
