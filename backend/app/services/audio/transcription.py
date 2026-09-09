import math
from pathlib import Path
from typing import Optional
import numpy as np
from scipy.io import wavfile

from app.schemas.audio import AudioAnalysisResult, MusicAnalysis, SoundEffectCue, TranscriptSegment


def transcribe_speech_whisper(wav_path: Path) -> tuple[bool, str, list[TranscriptSegment]]:
    """
    Transcribes speech using faster-whisper locally.
    Returns (has_speech, full_transcript, segments).
    """
    if not wav_path or not wav_path.exists():
        return False, "", []

    try:
        from faster_whisper import WhisperModel

        # Use lightweight 'tiny' or 'base' model on CPU with int8 quantization for high speed
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments_gen, info = model.transcribe(str(wav_path), beam_size=2)

        segments: list[TranscriptSegment] = []
        full_text_parts: list[str] = []

        for seg in segments_gen:
            clean_text = seg.text.strip()
            if clean_text:
                segments.append(
                    TranscriptSegment(
                        start=round(seg.start, 2),
                        end=round(seg.end, 2),
                        text=clean_text,
                    )
                )
                full_text_parts.append(clean_text)

        full_transcript = " ".join(full_text_parts)
        has_speech = len(segments) > 0 and len(full_transcript) > 0

        return has_speech, full_transcript, segments
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        return False, "", []


def analyze_acoustics(wav_path: Path) -> tuple[list[SoundEffectCue], MusicAnalysis]:
    """
    Analyzes audio waveform for SFX cues, energy transients, and musical tempo/mood.
    """
    sfx_cues: list[SoundEffectCue] = []
    music = MusicAnalysis(has_music=False, mood="ambient", intensity="low", tempo_feel="moderate")

    if not wav_path or not wav_path.exists():
        return sfx_cues, music

    try:
        sample_rate, data = wavfile.read(str(wav_path))
        if data.ndim > 1:
            data = data.mean(axis=1)

        # Normalize audio to float -1.0 to 1.0
        max_val = np.max(np.abs(data))
        if max_val == 0:
            return sfx_cues, music

        norm_data = data.astype(np.float32) / max_val
        duration = len(norm_data) / sample_rate

        # Windowed energy calculation (100ms windows)
        win_size = int(sample_rate * 0.1)
        if win_size == 0 or len(norm_data) < win_size:
            return sfx_cues, music

        num_windows = len(norm_data) // win_size
        energies = [
            np.sqrt(np.mean(norm_data[i * win_size : (i + 1) * win_size] ** 2))
            for i in range(num_windows)
        ]
        mean_energy = float(np.mean(energies))
        max_energy = float(np.max(energies))

        # 1. Detect significant transients / SFX cues
        threshold = mean_energy * 2.2
        for i in range(1, len(energies) - 1):
            if energies[i] > threshold and energies[i] > energies[i - 1] and energies[i] > energies[i + 1]:
                t = round(i * 0.1, 2)
                # Label based on energy intensity
                label = "impact" if energies[i] > 0.6 else "whoosh / transient SFX"
                sfx_cues.append(
                    SoundEffectCue(
                        timestamp=t,
                        duration=0.3,
                        label=label,
                        confidence=0.82,
                    )
                )

        # 2. Analyze Music presence & mood
        has_audio = mean_energy > 0.02
        if has_audio:
            music.has_music = True
            if mean_energy > 0.25 or max_energy > 0.7:
                music.intensity = "high"
                music.mood = "energetic and punchy"
                music.tempo_feel = "fast"
            elif mean_energy > 0.1:
                music.intensity = "moderate"
                music.mood = "cinematic and focused"
                music.tempo_feel = "moderate"
            else:
                music.intensity = "low"
                music.mood = "subtle atmospheric / ambient"
                music.tempo_feel = "slow"

    except Exception as e:
        print(f"Acoustic analysis error: {e}")

    return sfx_cues[:8], music  # Limit to top 8 SFX cues


def analyze_audio(wav_path: Optional[Path], audio_url: Optional[str] = None) -> AudioAnalysisResult:
    """
    Main audio analysis orchestrator.
    Combines Whisper speech-to-text with acoustic SFX and music analysis.
    """
    if not wav_path or not wav_path.exists():
        return AudioAnalysisResult(
            has_audio=False,
            has_speech=False,
            full_transcript="",
            segments=[],
            sfx_cues=[],
            music=MusicAnalysis(has_music=False, mood="silent", intensity="none", tempo_feel="none"),
            audio_file_url=None,
        )

    has_speech, full_transcript, segments = transcribe_speech_whisper(wav_path)
    sfx_cues, music = analyze_acoustics(wav_path)

    return AudioAnalysisResult(
        has_audio=True,
        has_speech=has_speech,
        full_transcript=full_transcript,
        segments=segments,
        sfx_cues=sfx_cues,
        music=music,
        audio_file_url=audio_url,
    )
