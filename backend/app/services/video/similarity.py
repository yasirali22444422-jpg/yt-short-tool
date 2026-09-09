from pathlib import Path
from PIL import Image
import imagehash

from app.services.video.frame_extraction import ExtractedFrame


def deduplicate_scene_frames(
    frames: list[ExtractedFrame],
    hash_threshold: int = 5,  # Hamming distance <= 5 implies nearly identical image
) -> list[ExtractedFrame]:
    """
    Deduplicates near-identical frames within a scene using perceptual hashing (pHash).
    Always retains at least the first frame and never drops below 1 frame per scene.
    """
    if len(frames) <= 1:
        return frames

    kept: list[ExtractedFrame] = []
    hashes: list[imagehash.ImageHash] = []

    for f in frames:
        p = Path(f["file_path"])
        if not p.exists():
            continue

        try:
            with Image.open(p) as img:
                current_hash = imagehash.phash(img)
        except Exception as e:
            # Keep frame if hashing fails
            kept.append(f)
            continue

        # Check distance with all already-kept frames in this scene
        is_duplicate = False
        for prev_h in hashes:
            distance = current_hash - prev_h
            if distance <= hash_threshold:
                is_duplicate = True
                break

        if not is_duplicate or len(kept) == 0:
            kept.append(f)
            hashes.append(current_hash)
        else:
            # Remove redundant duplicate image file from disk to save space
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass

    return kept if kept else frames[:1]
