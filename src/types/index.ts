export type SessionStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'retrying';

export type ProfilePreset = 'quick' | 'standard' | 'quality' | 'advanced';

export type InputFormat = 'fits' | 'raw_dslr' | 'mixed';

export interface SessionRead {
  id: string;
  name: string;
  inbox_path: string;
  status: SessionStatus;
  input_format: InputFormat | null;
  frame_count_lights: number;
  frame_count_darks: number;
  frame_count_flats: number;
  frame_count_bias: number;
  object_name: string | null;
  ra: number | null;
  dec: number | null;
  target_ra: number | null;
  target_dec: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobStepRead {
  id: string | null;
  step_name: string;
  display_name: string;
  step_index: number;
  status: StepStatus;
  attempt_count: number;
  started_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  output_metadata: Record<string, unknown> | null;
}

export interface JobRead {
  id: string;
  session_id: string;
  profile_preset: ProfilePreset;
  status: JobStatus;
  current_step: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  output_fits_path: string | null;
  output_tiff_path: string | null;
  output_preview_path: string | null;
  created_at: string;
  steps: JobStepRead[];
}

export interface ProcessingProfileConfig {
  rejection_algorithm?: 'sigma' | 'winsorized' | 'linear' | 'none';
  rejection_low?: number;
  rejection_high?: number;
  normalization?: 'addscale' | 'mulscale' | 'none';

  drizzle_enabled?: boolean;
  drizzle_scale?: number;
  drizzle_pixfrac?: number;

  debayer_pattern?: 'auto' | 'RGGB' | 'BGGR' | 'GRBG' | 'GBRG';

  plate_solving_enabled?: boolean;
  plate_solving_radius_deg?: number;
  plate_solving_speed?: 'auto' | 'slow' | 'fast';

  gradient_removal_enabled?: boolean;
  gradient_removal_method?: 'ai' | 'polynomial';
  gradient_removal_ai_model?: string;

  stretch_method?: 'asinh' | 'auto' | 'linear';
  stretch_strength?: number;

  color_calibration_enabled?: boolean;
  /** Siril photometric colour calibration (`pcc`).  Recommended only for
   *  defiltered DSLR / dedicated OSC astro cameras: on stock DSLR it tends to
   *  neutralise residual Hα. */
  photometric_calibration_enabled?: boolean;

  denoise_enabled?: boolean;
  denoise_strength?: number;
  denoise_luminance_only?: boolean;

  sharpen_enabled?: boolean;
  sharpen_stellar_amount?: number;
  sharpen_nonstellar_amount?: number;
  sharpen_radius?: number;

  super_resolution_enabled?: boolean;
  super_resolution_scale?: number;

  star_separation_enabled?: boolean;
  star_separation_recombine?: boolean;
  star_separation_nebula_weight?: number;
  star_separation_star_weight?: number;

  max_retries?: number;
}

export interface ProfileRead {
  id: string;
  name: string;
  description: string | null;
  config: ProcessingProfileConfig;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreate {
  name: string;
  description?: string;
  config: ProcessingProfileConfig;
}

export interface ProfileUpdate {
  name?: string;
  description?: string;
  config?: ProcessingProfileConfig;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProcessRequest {
  preset: ProfilePreset;
  profile_id?: string;
}
