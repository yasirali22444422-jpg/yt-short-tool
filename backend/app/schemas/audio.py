from typing import Optional
from pydantic import BaseModel, Field


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: Optional[str] = None


class SoundEffectCue(BaseModel):
    timestamp: float
    duration: float
    label: str
    confidence: float = Field(default=0.85)


class MusicAnalysis(BaseModel):
    has_music: bool = False
    mood: str = "neutral"
    intensity: str = "moderate"
    tempo_feel: str = "moderate"
    dramatic_changes: list[str] = Field(default_factory=list)


class AudioAnalysisResult(BaseModel):
    has_audio: bool = False
    has_speech: bool = False
    full_transcript: str = ""
    segments: list[TranscriptSegment] = Field(default_factory=list)
    sfx_cues: list[SoundEffectCue] = Field(default_factory=list)
    music: MusicAnalysis = Field(default_factory=MusicAnalysis)
    audio_file_url: Optional[str] = None
