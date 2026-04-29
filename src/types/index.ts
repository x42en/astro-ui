export type SessionStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type SessionMode = 'batch' | 'live';

export interface LiveStackState {
  session_id: string;
  is_running: boolean;
  frame_count: number;
  rejected_count: number;
  accumulator_path: string | null;
  reference_path: string | null;
  shape: number[] | null;
  preview_generation: number;
  last_fwhm: number | null;
  total_integration_seconds: number | null;
  last_stretch: Record<string, number>;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'retrying';

export type ProfilePreset = 'quick' | 'standard' | 'quality' | 'advanced';

export type InputFormat = 'fits' | 'raw_dslr' | 'mixed';

export interface CaptureMetadata {
  frame_count?: number;
  with_metadata?: number;
  exposure_seconds?: number | null;
  exposure_seconds_min?: number;
  exposure_seconds_max?: number;
  iso?: number | null;
  iso_min?: number;
  iso_max?: number;
  f_number?: number | null;
  focal_length_mm?: number | null;
  focal_length_mm_min?: number;
  focal_length_mm_max?: number;
  temperature_c?: number | null;
  gain?: number | null;
  camera_make?: string;
  camera_model?: string;
  lens_model?: string;
  telescope?: string;
  filter?: string;
  total_integration_seconds?: number;
  [k: string]: unknown;
}

export interface ProfileSummary {
  preset?: ProfilePreset;
  stretch_method?: string;
  tools?: Partial<Record<
    | 'drizzle_enabled'
    | 'plate_solving_enabled'
    | 'gradient_removal_enabled'
    | 'color_calibration_enabled'
    | 'photometric_calibration_enabled'
    | 'denoise_enabled'
    | 'sharpen_enabled'
    | 'super_resolution_enabled'
    | 'star_separation_enabled',
    boolean
  >>;
}

export interface SessionRead {
  id: string;
  name: string;
  inbox_path: string;
  status: SessionStatus;
  input_format: InputFormat | null;
  mode: SessionMode;
  live_frame_count: number;
  frame_count_lights: number;
  frame_count_darks: number;
  frame_count_flats: number;
  frame_count_dark_flats: number;
  frame_count_bias: number;
  owner_id: string | null;
  object_name: string | null;
  ra: number | null;
  dec: number | null;
  target_ra: number | null;
  target_dec: number | null;
  acquired_at: string | null;
  capture_metadata: CaptureMetadata | null;
  is_in_gallery: boolean;
  gallery_published_at: string | null;
  gallery_author_name: string | null;
  gallery_download_count: number;
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
  profile_snapshot: ProcessingProfileConfig | null;
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

  /** Star detection (`findstar`) — drives Siril's `register` (frame
   *  alignment).  When disabled, Siril's built-in defaults are used and
   *  no `setfindstar` command is emitted.  Enable only for faint /
   *  wide-field rigs where the defaults reject too many true stars;
   *  relaxed values smear nebular chrominance during the stack. */
  findstar_override_enabled?: boolean;
  findstar_radius?: number;
  findstar_sigma?: number;
  findstar_roundness?: number;
  findstar_relax?: boolean;

  plate_solving_enabled?: boolean;
  plate_solving_radius_deg?: number;
  plate_solving_speed?: 'auto' | 'slow' | 'fast';

  gradient_removal_enabled?: boolean;
  gradient_removal_method?: 'ai' | 'polynomial';
  /** GraXpert AI selector; doubles as `mode + version`:
   *  - `1.0.1`              Background Extraction (default).
   *  - `auto`               Default. Catalogue-driven: BGE for nebulae,
   *    chained `deconv-both` for galaxies / clusters. The orchestrator
   *    resolves the placeholder at job start.
   *  - `1.0.1`              GraXpert BGE (legacy default).
   *  - `deconv-obj-1.0.1`   Object-only deconvolution.
   *  - `deconv-stars-1.0.0` Stars-only deconvolution.
   *  - `deconv-both-1.0.1`  Object + stars chained (auto-selected on
   *    galaxies / clusters by the object-type catalogue).
   */
  gradient_removal_ai_model?: string;
  gradient_removal_correction?: 'Subtraction' | 'Division';
  gradient_removal_smoothing?: number;
  gradient_removal_deconv_strength?: number;
  gradient_removal_deconv_psfsize?: number;
  gradient_removal_deconv_batch_size?: number;

  stretch_method?: 'asinh' | 'auto' | 'linear';
  stretch_strength?: number;

  color_calibration_enabled?: boolean;
  /** Acquisition hardware hint.  `true` (default, the modern astrophoto norm)
   *  for defiltered DSLR / dedicated OSC astro cameras with broadband R/G/B
   *  response.  Set `false` for a stock DSLR with full IR-cut filter; the
   *  display pipeline then softens the per-channel red black-point and adds
   *  a mild red/saturation boost to preserve the residual Hα signal. */
  camera_defiltered?: boolean;
  /** Siril photometric colour calibration (`pcc`).  Independent from
   *  `camera_defiltered`: requires a successful plate-solve and an internet
   *  catalogue lookup, which can fail silently on small FOV / sparse fields. */
  photometric_calibration_enabled?: boolean;

  denoise_enabled?: boolean;
  denoise_engine?: 'cosmic_clarity' | 'graxpert';
  denoise_strength?: number;
  denoise_luminance_only?: boolean;
  denoise_graxpert_ai_model?: string;
  denoise_graxpert_batch_size?: number;

  sharpen_enabled?: boolean;
  sharpen_stellar_amount?: number;
  sharpen_nonstellar_amount?: number;
  sharpen_radius?: number;

  super_resolution_enabled?: boolean;
  super_resolution_scale?: number;
  /** Tri-state user policy: `auto` honours the catalogue (skip on bright
   *  nebulae); `on` / `off` force the step regardless of object type. */
  super_resolution_mode?: 'auto' | 'on' | 'off';

  star_separation_enabled?: boolean;
  star_separation_recombine?: boolean;
  star_separation_nebula_weight?: number;
  star_separation_star_weight?: number;
  /** Tri-state user policy: `auto` honours the catalogue (skip on
   *  galaxies / clusters); `on` / `off` force the step regardless. */
  star_separation_mode?: 'auto' | 'on' | 'off';

  max_retries?: number;
}

export interface ProfileRead {
  id: string;
  owner_user_id: string | null;
  is_shared: boolean;
  shared_at: string | null;
  is_owner: boolean;
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

// ── Observation sites ───────────────────────────────────────────────────────
export interface ObservationSite {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  elevation_m: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}
export interface ObservationSiteCreate {
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  timezone?: string;
}
export interface ObservationSiteUpdate {
  name?: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  elevation_m?: number;
  timezone?: string;
}

// ── Catalog objects (matches backend CatalogObject) ─────────────────────────
export interface CatalogObject {
  id: string;
  name: string;
  type: 'galaxy' | 'nebula' | 'cluster' | 'planetary' | 'supernova' | 'other';
  constellation: string;
  ra_deg: number;
  dec_deg: number;
  magnitude: number | null;
  source?: string;
}

// ── Followed objects ────────────────────────────────────────────────────────
export interface FollowedObject {
  id: string;
  catalog_id: string;
  note: string | null;
  notify_when_visible: boolean;
  created_at: string;
  catalog_object: CatalogObject | null;
}
export interface FollowedObjectCreate {
  catalog_id: string;
  note?: string | null;
  notify_when_visible?: boolean;
}

// ── Planning ────────────────────────────────────────────────────────────────
export interface GeoLocation {
  name: string;
  country: string | null;
  timezone: string;
  elevation_m: number;
  latitude: number;
  longitude: number;
}
export interface HourlyWeather {
  time: string;
  cloud_cover_pct: number;
  cloud_cover_low_pct: number;
  visibility_m: number;
  relative_humidity_pct: number;
  dew_point_c: number;
  wind_speed_kmh: number;
}
export interface DailyWeather {
  date: string;
  sunrise: string;
  sunset: string;
  moonrise: string | null;
  moonset: string | null;
  moon_phase: number;
}
export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation_m: number;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
}
export interface ObservationWindow {
  site_latitude: number;
  site_longitude: number;
  site_elevation_m: number;
  date: string;
  sunset: string;
  sunrise_next: string;
  astronomical_twilight_end: string;
  astronomical_twilight_start: string;
  moon_illumination: number;
  moonrise: string | null;
  moonset: string | null;
  moon_above_horizon_during_window: boolean;
  darkness_score: number;
}
export interface AltAzPoint {
  time: string;
  altitude_deg: number;
  azimuth_deg: number;
}
export interface ObjectVisibility {
  catalog_id: string;
  name: string;
  type: CatalogObject['type'];
  constellation: string;
  ra_deg: number;
  dec_deg: number;
  magnitude: number | null;
  max_altitude_deg: number;
  transit_time: string | null;
  rise_time: string | null;
  set_time: string | null;
  moon_separation_deg: number;
  score: number;
  altitude_curve: AltAzPoint[];
}
export interface RecommendationBundle {
  window: ObservationWindow;
  weather_summary: {
    cloud_cover_avg_pct: number;
    cloud_cover_min_pct: number;
    visibility_min_m: number;
  } | null;
  recommendations: ObjectVisibility[];
}
export interface NightlyForecastEntry {
  date: string;
  max_altitude_deg: number;
  hours_above_min_altitude: number;
  transit_time: string | null;
  moon_separation_deg: number;
  moon_illumination: number;
  moon_above_horizon_during_window: boolean;
  darkness_score: number;
  score: number;
}
export interface ObjectForecast {
  catalog_id: string;
  name: string;
  type: CatalogObject['type'];
  constellation: string;
  ra_deg: number;
  dec_deg: number;
  magnitude: number | null;
  site_latitude: number;
  site_longitude: number;
  site_elevation_m: number;
  min_altitude_deg: number;
  nights: NightlyForecastEntry[];
}

export interface AppSettingsRemote {
  inbox_path: string;
  ollama_url: string;
  ollama_model: string;
  pipeline_max_retries: number;
  session_stability_delay: number;
  updated_at: string;
  updated_by_user_id: string | null;
}

export type AppSettingsUpdate = Partial<Omit<AppSettingsRemote, 'updated_at' | 'updated_by_user_id'>>;
