import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Server, Zap, Globe } from 'lucide-react';
import { getLlmSettings } from '../../services/settings';
import type { LlmOverride, LlmProvider } from '../../types';

interface LlmChoiceSelectProps {
  value: LlmOverride;
  onChange: (llm: LlmOverride) => void;
  disabled?: boolean;
  ariaLabel?: string;
  compact?: boolean;
}

const PROVIDER_META: Array<{
  value: LlmProvider;
  label: string;
  description: string;
  Icon: React.ElementType;
}> = [
  {
    value: 'default',
    label: 'Global default',
    description: 'Use the operator-configured active provider',
    Icon: Bot,
  },
  {
    value: 'ollama',
    label: 'Ollama',
    description: 'Local stack — switchable models, no external calls',
    Icon: Server,
  },
  {
    value: 'vllm',
    label: 'vLLM',
    description: 'Self-hosted — one model served very fast',
    Icon: Zap,
  },
  {
    value: 'kilo',
    label: 'Kilo',
    description: 'External gateway — test many models, offload GPU',
    Icon: Globe,
  },
];

/**
 * Compact provider picker for the vision critic, shared by the batch launch
 * card and the live-session start flow. Shows the active model per provider
 * from the `['llm-settings']` query and hides the key status entirely.
 */
export function LlmChoiceSelect({
  value,
  onChange,
  disabled = false,
  ariaLabel = 'Vision-critic LLM provider',
  compact = false,
}: LlmChoiceSelectProps) {
  const { data: llm } = useQuery({
    queryKey: ['llm-settings'],
    queryFn: getLlmSettings,
    staleTime: 60_000,
  });

  const modelByProvider = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of llm?.profiles ?? []) map[p.provider] = p.model;
    return map;
  }, [llm]);

  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-1.5'}>
      {!compact && (
        <p className="text-[11px] text-text-muted uppercase tracking-wider text-center">
          Vision critic LLM
        </p>
      )}
      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-2'} gap-1.5`}>
        {PROVIDER_META.map(({ value: provider, label, description, Icon }) => {
          const selected = value.provider === provider;
          const model = modelByProvider[provider];
          return (
            <button
              key={provider}
              type="button"
              title={model ? `${description} — ${model}` : description}
              disabled={disabled}
              onClick={() =>
                onChange({ provider, ...(value.model && selected ? { model: value.model } : {}) })
              }
              aria-label={`${ariaLabel}: ${label}`}
              aria-pressed={selected}
              className={`flex items-center ${compact ? 'justify-center px-2 py-1.5' : 'gap-1.5 px-2.5 py-1.5'} rounded-lg border text-xs transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                selected
                  ? 'bg-primary/15 border-primary/50 text-text-primary'
                  : 'bg-white/5 hover:bg-white/10 border-space-border hover:border-white/20 text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={13} className="flex-shrink-0" />
              {!compact && <span className="font-medium truncate">{label}</span>}
              {compact && <span className="sr-only">{label}</span>}
            </button>
          );
        })}
      </div>
      {!compact && value.provider !== 'default' && (
        <input
          type="text"
          value={value.model ?? ''}
          onChange={(e) => onChange({ provider: value.provider, model: e.target.value || undefined })}
          placeholder={modelByProvider[value.provider] ?? 'Model override (optional)'}
          disabled={disabled}
          aria-label="LLM model override"
          className="w-full px-3 py-1.5 bg-space-elevated border border-space-border rounded text-xs text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
        />
      )}
    </div>
  );
}
