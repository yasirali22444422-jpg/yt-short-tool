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
