from typing import Any, Optional
from pydantic import BaseModel, Field


class CharacterBibleItem(BaseModel):
    id: str = Field(..., description="Unique persistent ID e.g. CHAR_001")
    display_name: str
    type: str = "human"
    gender_presentation: str = "unspecified"
    estimated_age: str = "unspecified"
    height_build: str = "average"
    skin_tone: str = "neutral"
    face_shape: str = "oval"
    hair: str = "short dark"
    eyes: str = "dark"
    clothing: list[str] = Field(default_factory=list)
    accessories: list[str] = Field(default_factory=list)
    distinctive_features: list[str] = Field(default_factory=list)
    visual_style: str = "cinematic realism"
    confidence: float = 0.85


class ObjectRegistryItem(BaseModel):
    id: str = Field(..., description="Unique persistent ID e.g. OBJ_001")
    name: str
    appearance: str
    color: str = "neutral"
    material: str = "standard"
    shape: str = "standard"
    special_details: str = ""
    scene_appearances: list[str] = Field(default_factory=list)


class LocationRegistryItem(BaseModel):
    id: str = Field(..., description="Unique persistent ID e.g. LOC_001")
    name: str
    environment: str = "interior"
    architecture: str = "contemporary"
    weather: str = "clear"
    time_of_day: str = "day"
    lighting: str = "ambient daylight"
    key_landmarks: list[str] = Field(default_factory=list)
    color_palette: str = "neutral"


class GlobalStyleDNA(BaseModel):
    medium: str = "Real footage"  # e.g. 3D animation, Anime, Real footage
    visual_style: str = "Cinematic Realism"
    color_palette: str = "Natural contrast, balanced tones"
    lighting_style: str = "Three-point cinematic lighting"
    texture_style: str = "Detailed realistic textures"
    depth_of_field: str = "Medium depth of field"
    contrast: str = "Balanced"
    camera_language: str = "Dynamic handheld with steady framing"
    motion_style: str = "Fluid natural pacing"
    editing_pace: str = "Moderate"
    overall_mood: str = "Engaging and focused"


class EditingDNA(BaseModel):
    editing_pace: str = "moderate"
    average_shot_length: float = 3.0
    common_transitions: list[str] = Field(default_factory=lambda: ["hard cut"])
    motion_blur: str = "natural"
    speed_ramping: bool = False


class SceneAnalysisData(BaseModel):
    scene_id: str
    scene_number: int
    start_time: float
    end_time: float
    duration: float

    characters: list[str] = Field(default_factory=list)
    objects: list[str] = Field(default_factory=list)
    location_id: str = "LOC_001"

    scene_summary: str = ""
    foreground: str = ""
    midground: str = ""
    background: str = ""

    character_actions: list[str] = Field(default_factory=list)
    character_poses: list[str] = Field(default_factory=list)
    facial_expressions: list[str] = Field(default_factory=list)

    camera_shot: str = "Medium"
    camera_angle: str = "Eye level"
    camera_movement: str = "Static"
    lens_feel: str = "~35mm natural perspective"

    composition: str = "Rule of thirds"
    lighting: str = "Natural diffused"
    color_palette: str = "Balanced neutral"

    subject_motion: str = "Subtle character motion"
    environment_motion: str = "Stationary environment"
    physics: str = "Realistic gravity and motion"

    vfx: list[str] = Field(default_factory=list)
    transition_in: str = "Cut"
    transition_out: str = "Cut"

    dialogue: list[str] = Field(default_factory=list)
    sound_effects: list[str] = Field(default_factory=list)
    music_description: str = ""
    editing_notes: str = ""

    # Prompts
    image_prompt: str = ""
    animation_prompt: str = ""
    text_to_video_prompt: str = ""
    negative_prompt: str = ""

    confidence: dict[str, float] = Field(default_factory=dict)
    keyframe_urls: list[str] = Field(default_factory=list)


class RemixAnalysis(BaseModel):
    remix_concept: str
    target_genre: str
    character_mappings: dict[str, str] = Field(default_factory=dict)
    location_mappings: dict[str, str] = Field(default_factory=dict)
    remixed_scenes: list[dict[str, Any]] = Field(default_factory=list)
    remixed_blueprint_markdown: str = ""


class FullAnalysisPackage(BaseModel):
    project_id: str
    mode: str = "recreate"  # "recreate" | "remix"
    provider: str
    model: str
    content_type: str = "Real footage"
    content_type_confidence: float = 0.88
    global_style: GlobalStyleDNA
    editing_dna: EditingDNA
    characters: list[CharacterBibleItem] = Field(default_factory=list)
    objects: list[ObjectRegistryItem] = Field(default_factory=list)
    locations: list[LocationRegistryItem] = Field(default_factory=list)
    scenes: list[SceneAnalysisData] = Field(default_factory=list)
    blueprint_markdown: str = ""
    remix_data: Optional[RemixAnalysis] = None


class StartAnalysisRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    mode: str = "recreate"  # "recreate" | "remix"


class UpdateSceneRequest(BaseModel):
    scene_summary: Optional[str] = None
    camera_shot: Optional[str] = None
    camera_angle: Optional[str] = None
    camera_movement: Optional[str] = None
    lens_feel: Optional[str] = None
    lighting: Optional[str] = None
    character_actions: Optional[list[str]] = None
    image_prompt: Optional[str] = None
    animation_prompt: Optional[str] = None
    text_to_video_prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
