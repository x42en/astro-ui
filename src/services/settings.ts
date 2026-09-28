import api from '../lib/axios';
import type { AppSettingsRemote, AppSettingsUpdate, LlmModelEntry, LlmSettings } from '../types';

/**
 * Fetch the global operational settings singleton.
 *
 * @returns The current remote settings.
 */
export async function getRemoteSettings(): Promise<AppSettingsRemote> {
  const response = await api.get<AppSettingsRemote>('/settings');
  return response.data;
}

/**
 * Partially update the global settings (admin only).
 *
 * @param patch - Fields to update; `undefined` fields are left untouched.
 * @returns The updated remote settings.
 */
export async function updateRemoteSettings(
  patch: AppSettingsUpdate
): Promise<AppSettingsRemote> {
  const response = await api.put<AppSettingsRemote>('/settings', patch);
  return response.data;
}

/**
 * Fetch the LLM provider overview (active provider + per-profile models).
 * API keys are never exposed — only a `has_api_key` flag per provider.
 *
 * @returns The LLM provider overview.
 */
export async function getLlmSettings(): Promise<LlmSettings> {
  const response = await api.get<LlmSettings>('/settings/llm');
  return response.data;
}

/**
 * List the models advertised by one provider's `/models` endpoint.
 *
 * @param provider - `ollama` | `vllm` | `kilo`.
 * @returns Advertised model entries (best effort).
 */
export async function listLlmModels(provider: string): Promise<LlmModelEntry[]> {
  const response = await api.get<LlmModelEntry[]>('/settings/llm/models', {
    params: { provider },
  });
  return response.data;
}

/**
 * Ping one provider (admin-gated on the backend via settings write role).
 *
 * @param provider - Provider key to probe.
 * @param model - Optional model override for the probe.
 * @returns Probe result with latency.
 */
export async function testLlmProvider(
  provider: string,
  model?: string
): Promise<{ ok: boolean; provider: string; model: string; latency_ms: number }> {
  const response = await api.post(
    '/settings/llm/test',
    null,
    { params: { provider, ...(model ? { model } : {}) } }
  );
  return response.data;
}
