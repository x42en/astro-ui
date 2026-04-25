import type { JobStatus, StepStatus, SessionStatus } from './index';

export interface WsJobStatusEvent {
  type: 'job_status';
  job_id: string;
  status: JobStatus;
  current_step: string | null;
}

export interface WsStepUpdateEvent {
  type: 'step_update';
  step_name: string;
  step_index: number;
  status: StepStatus;
  attempt_count: number;
  error_code: string | null;
}

export interface WsSessionStatusEvent {
  type: 'session_status';
  status: SessionStatus;
}

export interface WsErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type WsEvent =
  | WsJobStatusEvent
  | WsStepUpdateEvent
  | WsSessionStatusEvent
  | WsErrorEvent;
