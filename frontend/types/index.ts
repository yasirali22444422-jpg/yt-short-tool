export type AnalysisMode = 'fast' | 'detailed' | 'deep';

export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface VideoMetadata {
  filename: string;
  duration_seconds: number;
  width: number;
  height: number;
  aspect_ratio: string;
  fps: number;
  codec: string;
  audio_codec: string;
  file_size_bytes: number;
}

export interface VideoInfo {
  id: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  source_deleted: boolean;
  metadata?: VideoMetadata | null;
}

export interface Project {
  id: string;
  name: string;
  status: 'uploaded' | 'metadata_extracted' | 'scenes_detected' | 'frames_extracted' | 'audio_processed' | 'ai_analysis_started' | 'completed' | 'failed';
  analysis_mode: AnalysisMode;
  provider: string;
  model: string;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  video?: VideoInfo | null;
}

export interface ProjectListItem {
  id: string;
  name: string;
  status: string;
  analysis_mode: AnalysisMode;
  provider: string;
  model: string;
  created_at: string;
  video_filename?: string | null;
  video_size_mb?: number | null;
  video_duration_seconds?: number | null;
  formatted_duration?: string | null;
  is_internal_test?: boolean;
}


export interface UploadResponse {
  project_id: string;
  project_name: string;
  video_id: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  status: string;
  message: string;
}

export interface SystemStatus {
  status: string;
  ffmpeg: {
    ffmpeg_installed: boolean;
    ffprobe_installed: boolean;
    ffmpeg_path: string | null;
    ffprobe_path: string | null;
    version?: string | null;
  };
  max_video_duration_sec: number;
  max_file_size_mb: number;
  allowed_extensions: string[];
  default_provider: string;
  default_model: string;
}

export interface ProviderInfo {
  provider: string;
  name: string;
  description: string;
  has_key: boolean;
  masked_key?: string | null;
  selected_model: string;
  available_models: string[];
}

export interface SaveKeyPayload {
  api_key?: string;
  selected_model?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface CharacterBibleItem {
  id: string;
  display_name: string;
  type: string;
  gender_presentation: string;
  estimated_age: string;
  height_build: string;
  skin_tone: string;
  face_shape: string;
  hair: string;
  eyes: string;
  clothing: string[];
  accessories: string[];
  distinctive_features: string[];
  visual_style: string;
  confidence: number;
}

export interface ObjectRegistryItem {
  id: string;
  name: string;
  appearance: string;
  color: string;
  material: string;
  shape: string;
  special_details: string;
  scene_appearances: string[];
}

export interface LocationRegistryItem {
  id: string;
  name: string;
  environment: string;
  architecture: string;
  weather: string;
  time_of_day: string;
  lighting: string;
  key_landmarks: string[];
  color_palette: string;
}

export interface GlobalStyleDNA {
  medium: string;
  visual_style: string;
  color_palette: string;
  lighting_style: string;
  texture_style: string;
  depth_of_field: string;
  contrast: string;
  camera_language: string;
  motion_style: string;
  editing_pace: string;
  overall_mood: string;
}

export interface EditingDNA {
  editing_pace: string;
  average_shot_length: number;
  common_transitions: string[];
  motion_blur: string;
  speed_ramping: boolean;
}

export interface SceneAnalysisData {
  scene_id: string;
  scene_number: number;
  start_time: number;
  end_time: number;
  duration: number;
  characters: string[];
  objects: string[];
  location_id: string;
  scene_summary: string;
  foreground: string;
  midground: string;
  background: string;
  character_actions: string[];
  character_poses: string[];
  facial_expressions: string[];
  camera_shot: string;
  camera_angle: string;
  camera_movement: string;
  lens_feel: string;
  composition: string;
  lighting: string;
  color_palette: string;
  subject_motion: string;
  environment_motion: string;
  physics: string;
  vfx: string[];
  transition_in: string;
  transition_out: string;
  dialogue: string[];
  sound_effects: string[];
  music_description: string;
  editing_notes: string;
  image_prompt: string;
  animation_prompt: string;
  text_to_video_prompt: string;
  negative_prompt: string;
  confidence: { [key: string]: number };
  keyframe_urls: string[];
}

export interface RemixAnalysis {
  remix_concept: string;
  target_genre: string;
  character_mappings: { [key: string]: string };
  location_mappings: { [key: string]: string };
  remixed_scenes: any[];
  remixed_blueprint_markdown: string;
}

export interface FullAnalysisPackage {
  project_id: string;
  mode: string;
  provider: string;
  model: string;
  content_type: string;
  content_type_confidence: number;
  global_style: GlobalStyleDNA;
  editing_dna: EditingDNA;
  characters: CharacterBibleItem[];
  objects: ObjectRegistryItem[];
  locations: LocationRegistryItem[];
  scenes: SceneAnalysisData[];
  blueprint_markdown: string;
  remix_data?: RemixAnalysis | null;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  source_file?: string | null;
  content: string;
  is_default: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

