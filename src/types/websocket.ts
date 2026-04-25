// WebSocket event types mirror the backend domain/ws_event.py schema.
// All events share the base fields: type, job_id, session_id, timestamp.

export interface WsBaseEvent {
  type: string;
  job_id: string | null;
  session_id: string | null;
  timestamp: string;
}

export interface WsProgressEvent extends WsBaseEvent {
  type: 'progress';
  step: string;
  step_index: number;
  total_steps: number;
  percent: number;
  message: string;
}

export interface WsLogEvent extends WsBaseEvent {
  type: 'log';
  level: 'debug' | 'info' | 'warning' | 'error';
  source: 'siril' | 'astap' | 'graxpert' | 'cosmic' | 'system';
  message: string;
}

export interface WsStepStatusEvent extends WsBaseEvent {
  type: 'step_status';
  step: string;
  step_index: number;
  status: 'starting' | 'success' | 'error' | 'skipped';
  result: Record<string, unknown> | null;
}

export interface WsErrorEvent extends WsBaseEvent {
  type: 'error';
  error_code: string;
  message: string;
  step: string;
  retryable: boolean;
  attempt: number;
  max_attempts: number;
}

export interface WsCompletedEvent extends WsBaseEvent {
  type: 'completed';
  duration_seconds: number;
  outputs: Record<string, string>;
}

export interface WsCancelledEvent extends WsBaseEvent {
  type: 'cancelled';
  reason: string;
}

export interface WsSessionDetectedEvent extends WsBaseEvent {
  type: 'session_detected';
  inbox_path: string;
  name: string;
}

export interface WsSessionReadyEvent extends WsBaseEvent {
  type: 'session_ready';
  frame_count_lights: number;
  frame_count_darks: number;
  frame_count_flats: number;
  frame_count_bias: number;
  input_format: string;
}

export type WsEvent =
  | WsProgressEvent
  | WsLogEvent
  | WsStepStatusEvent
  | WsErrorEvent
  | WsCompletedEvent
  | WsCancelledEvent
  | WsSessionDetectedEvent
  | WsSessionReadyEvent;
