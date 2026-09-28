import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Server,
  FolderOpen,
  Cpu,
  Wifi,
  WifiOff,
  Loader2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock,
  Bot,
  Globe,
  Zap,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import { useIsAdmin } from '../store/authStore';
import { AUTH_MODE } from '../lib/oidc';
import api from '../lib/axios';
import type { AppSettings } from '../store/settingsStore';
import type { AppSettingsRemote, AppSettingsUpdate, LlmSettings } from '../types';
import { getRemoteSettings, updateRemoteSettings, getLlmSettings, listLlmModels, testLlmProvider } from '../services/settings';

// ── Shared UI primitives ───────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-space-surface border border-space-border rounded-lg overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b border-space-border/60">
        <div className="w-8 h-8 rounded-md bg-space-elevated border border-space-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={15} className="text-text-secondary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-start gap-6">
      <div className="pt-2">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  monospace,
  type = 'text',
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  monospace?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${monospace ? 'font-mono' : ''}`}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-32 px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary font-mono focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

// ── Connection section (local store) ───────────────────────────────────────

type ConnectionState = 'idle' | 'checking' | 'ok' | 'error';

function ConnectionSettings() {
  const { t } = useTranslation();
  const store = useSettingsStore();
  const { addToast } = useUiStore();

  const [form, setForm] = useState<AppSettings>({
    apiBaseUrl: store.apiBaseUrl,
    wsBaseUrl: store.wsBaseUrl,
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(
      form.apiBaseUrl !== store.apiBaseUrl ||
      form.wsBaseUrl !== store.wsBaseUrl
    );
  }, [form, store]);

  const patch = (partial: Partial<AppSettings>) =>
    setForm((f) => ({ ...f, ...partial }));

  const handleSave = () => {
    store.update(form);
    addToast({ variant: 'success', title: t('settings.connection.saved') });
    setDirty(false);
  };

  const handleReset = () => {
    store.reset();
    const s = useSettingsStore.getState();
    setForm({ apiBaseUrl: s.apiBaseUrl, wsBaseUrl: s.wsBaseUrl });
    addToast({ variant: 'info', title: t('settings.connection.reset') });
    setDirty(false);
  };

  const handleTestConnection = async () => {
    setConnectionState('checking');
    setConnectionMessage('');
    store.update({ apiBaseUrl: form.apiBaseUrl });
    try {
      await api.get('/health', { timeout: 5000 });
      setConnectionState('ok');
      setConnectionMessage(t('settings.connection.ok'));
    } catch (err: unknown) {
      setConnectionState('error');
      const e = err as { message?: string };
      setConnectionMessage(e?.message ?? t('settings.connection.error'));
    }
  };

  return (
    <SettingsSection
      icon={Server}
      title={t('settings.connection.title')}
      description={t('settings.connection.description')}
    >
      <FieldRow
        label={t('settings.connection.apiBaseUrl')}
        hint={t('settings.connection.apiBaseUrlHint')}
      >
        <div className="flex gap-2">
          <TextInput
            value={form.apiBaseUrl}
            onChange={(v) => patch({ apiBaseUrl: v })}
            placeholder="http://localhost:8080/api/v1"
            monospace
          />
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={connectionState === 'checking'}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-space-border hover:border-space-border-light text-text-secondary hover:text-text-primary bg-space-elevated rounded transition-all disabled:opacity-50 flex-shrink-0"
          >
            {connectionState === 'checking' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : connectionState === 'ok' ? (
              <Wifi size={12} className="text-success" />
            ) : connectionState === 'error' ? (
              <WifiOff size={12} className="text-error" />
            ) : (
              <Wifi size={12} />
            )}
            {t('settings.connection.test')}
          </button>
        </div>
        {connectionMessage && (
          <div className={`flex items-center gap-1.5 mt-2 text-xs ${connectionState === 'ok' ? 'text-success' : 'text-error'}`}>
            {connectionState === 'ok' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {connectionMessage}
          </div>
        )}
      </FieldRow>

      <div className="h-px bg-space-border/60" />

      <FieldRow
        label={t('settings.connection.webSocketUrl')}
        hint={t('settings.connection.webSocketHint')}
      >
        <TextInput
          value={form.wsBaseUrl}
          onChange={(v) => patch({ wsBaseUrl: v })}
          placeholder="ws://localhost:8080/ws"
          monospace
        />
      </FieldRow>

      {dirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-warning-muted border border-warning/30 rounded-md text-xs text-warning">
          <AlertCircle size={13} />
          {t('settings.connection.unsavedChanges')}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary border border-space-border hover:border-space-border-light rounded-md transition-all"
        >
          <RotateCcw size={12} />
          {t('settings.connection.resetDefaults')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Save size={13} />
          {t('settings.connection.save')}
        </button>
      </div>
    </SettingsSection>
  );
}

// ── Operational section (backend DB) ──────────────────────────────────────

function OperationalSettings() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { addToast } = useUiStore();
  const isAdmin = useIsAdmin();
  const canEdit = isAdmin || AUTH_MODE === 'disabled';

  const { data, isLoading, isError } = useQuery<AppSettingsRemote>({
    queryKey: ['app-settings'],
    queryFn: getRemoteSettings,
  });

  const [form, setForm] = useState<AppSettingsUpdate | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data && form === null) {
      setForm({
        inbox_path: data.inbox_path,
        ollama_url: data.ollama_url,
        ollama_model: data.ollama_model,
        llm_active_provider: data.llm_active_provider,
        llm_ollama_url: data.llm_ollama_url,
        llm_ollama_model: data.llm_ollama_model,
        llm_vllm_base_url: data.llm_vllm_base_url,
        llm_vllm_model: data.llm_vllm_model,
        llm_kilo_model: data.llm_kilo_model,
        pipeline_max_retries: data.pipeline_max_retries,
        session_stability_delay: data.session_stability_delay,
      });
    }
  }, [data, form]);

  useEffect(() => {
    if (!data || !form) { setDirty(false); return; }
    setDirty(
      form.inbox_path !== data.inbox_path ||
      form.ollama_url !== data.ollama_url ||
      form.ollama_model !== data.ollama_model ||
      form.llm_active_provider !== data.llm_active_provider ||
      form.llm_ollama_url !== data.llm_ollama_url ||
      form.llm_ollama_model !== data.llm_ollama_model ||
      form.llm_vllm_base_url !== data.llm_vllm_base_url ||
      form.llm_vllm_model !== data.llm_vllm_model ||
      form.llm_kilo_model !== data.llm_kilo_model ||
      form.pipeline_max_retries !== data.pipeline_max_retries ||
      form.session_stability_delay !== data.session_stability_delay
    );
  }, [form, data]);

  const mutation = useMutation<AppSettingsRemote, Error, AppSettingsUpdate>({
    mutationFn: updateRemoteSettings,
    onSuccess: (updated) => {
      qc.setQueryData(['app-settings'], updated);
      addToast({ variant: 'success', title: t('settings.processingDefaults.saved') });
      setDirty(false);
    },
    onError: (err) => {
      addToast({ variant: 'error', title: t('settings.processingDefaults.saveFailed'), message: err.message });
    },
  });

  const patch = (partial: Partial<AppSettingsUpdate>) =>
    setForm((f) => (f ? { ...f, ...partial } : f));

  const handleSave = () => {
    if (!form) return;
    mutation.mutate(form);
  };

  const handleReset = () => {
    if (data) {
      setForm({
        inbox_path: data.inbox_path,
        ollama_url: data.ollama_url,
        ollama_model: data.ollama_model,
        llm_active_provider: data.llm_active_provider,
        llm_ollama_url: data.llm_ollama_url,
        llm_ollama_model: data.llm_ollama_model,
        llm_vllm_base_url: data.llm_vllm_base_url,
        llm_vllm_model: data.llm_vllm_model,
        llm_kilo_model: data.llm_kilo_model,
        pipeline_max_retries: data.pipeline_max_retries,
        session_stability_delay: data.session_stability_delay,
      });
    }
  };

  if (isLoading || !form) {
    return (
      <div className="bg-space-surface border border-space-border rounded-lg p-8 flex items-center justify-center gap-2 text-text-muted text-sm">
        <Loader2 size={16} className="animate-spin" />
        {t('settings.processingDefaults.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-space-surface border border-space-border rounded-lg p-8 flex items-center justify-center gap-2 text-error text-sm">
        <AlertCircle size={16} />
        {t('settings.processingDefaults.errorLoad')}
      </div>
    );
  }

  const updatedAt = data
    ? new Date(data.updated_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <>
      <SettingsSection
        icon={FolderOpen}
        title={t('settings.inboxAi.title')}
        description={t('settings.inboxAi.description')}
      >
        <FieldRow
          label={t('settings.inboxAi.inboxPath')}
          hint={t('settings.inboxAi.inboxPathHint')}
        >
          <TextInput
            value={form.inbox_path ?? ''}
            onChange={(v) => patch({ inbox_path: v })}
            placeholder="/data/inbox"
            monospace
            disabled={!canEdit}
          />
        </FieldRow>

        <div className="h-px bg-space-border/60" />

        <FieldRow
          label={t('settings.inboxAi.ollamaUrl')}
          hint={t('settings.inboxAi.ollamaUrlHint')}
        >
          <TextInput
            value={form.ollama_url ?? ''}
            onChange={(v) => patch({ ollama_url: v })}
            placeholder="http://localhost:11434"
            monospace
            disabled={!canEdit}
          />
        </FieldRow>

        <div className="h-px bg-space-border/60" />

        <FieldRow
          label={t('settings.inboxAi.ollamaModel')}
          hint={t('settings.inboxAi.ollamaModelHint')}
        >
          <TextInput
            value={form.ollama_model ?? ''}
            onChange={(v) => patch({ ollama_model: v })}
            placeholder="qwen3-vl:8b"
            monospace
            disabled={!canEdit}
          />
        </FieldRow>
      </SettingsSection>

      <LlmProvidersSection form={form} patch={patch} canEdit={canEdit} />

      <SettingsSection
        icon={Cpu}
        title={t('settings.processingDefaults.title')}
        description={t('settings.processingDefaults.description')}
      >
        <FieldRow
          label={t('settings.processingDefaults.maxRetries')}
          hint={t('settings.processingDefaults.maxRetriesHint')}
        >
          <NumberInput
            value={form.pipeline_max_retries ?? 3}
            onChange={(v) => patch({ pipeline_max_retries: v })}
            min={0}
            max={10}
            disabled={!canEdit}
          />
        </FieldRow>

        <div className="h-px bg-space-border/60" />

        <FieldRow
          label={t('settings.processingDefaults.stabilityDelay')}
          hint={t('settings.processingDefaults.stabilityDelayHint')}
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={form.session_stability_delay ?? 30}
              onChange={(v) => patch({ session_stability_delay: v })}
              min={1}
              max={300}
              disabled={!canEdit}
            />
            <span className="text-sm text-text-muted">{t('settings.processingDefaults.seconds')}</span>
          </div>
        </FieldRow>

        {!canEdit && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-space-elevated border border-space-border rounded-md text-xs text-text-muted">
            <Lock size={12} />
            {t('settings.processingDefaults.adminRequired')}
          </div>
        )}

        {dirty && canEdit && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-warning-muted border border-warning/30 rounded-md text-xs text-warning">
            <AlertCircle size={13} />
            {t('settings.processingDefaults.unsavedChanges')}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary border border-space-border hover:border-space-border-light rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={12} />
              {t('settings.processingDefaults.discard')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || mutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {t('settings.processingDefaults.save')}
            </button>
          </div>
        )}
      </SettingsSection>

      {data && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted justify-end">
          <Clock size={11} />
          {t('settings.processingDefaults.lastUpdated')} {updatedAt}
          {data.updated_by_user_id && (
            <span className="font-mono text-text-muted/70">{t('settings.processingDefaults.by')} {data.updated_by_user_id}</span>
          )}
        </div>
      )}
    </>
  );
}

// ── LLM providers section (backend DB, admin-gated writes) ─────────────────

const LLM_PROVIDER_OPTIONS = [
  { value: 'ollama', icon: Server },
  { value: 'vllm', icon: Zap },
  { value: 'kilo', icon: Globe },
] as const;

function LlmProvidersSection({
  form,
  patch,
  canEdit,
}: {
  form: AppSettingsUpdate;
  patch: (partial: Partial<AppSettingsUpdate>) => void;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const { data: llm } = useQuery<LlmSettings>({
    queryKey: ['llm-settings'],
    queryFn: getLlmSettings,
  });
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const keyStatus = (provider: string): boolean | null => {
    const found = llm?.profiles.find((prof) => prof.provider === provider);
    return found ? found.has_api_key : null;
  };

  const handleTest = async (provider: string) => {
    setTesting(provider);
    try {
      const res = await testLlmProvider(provider);
      setTestResult((s) => ({ ...s, [provider]: t('settings.llm.testOk', { ms: res.latency_ms }) }));
    } catch {
      setTestResult((s) => ({ ...s, [provider]: t('settings.llm.testFailed') }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <SettingsSection
      icon={Bot}
      title={t('settings.llm.title')}
      description={t('settings.llm.description')}
    >
      <FieldRow
        label={t('settings.llm.activeProvider')}
        hint={t('settings.llm.activeProviderHint')}
      >
        <div className="grid grid-cols-3 gap-1.5">
          {LLM_PROVIDER_OPTIONS.map(({ value, icon: Icon }) => {
            const selected = (form.llm_active_provider ?? llm?.active_provider ?? 'vllm') === value;
            return (
              <button
                key={value}
                type="button"
                disabled={!canEdit}
                onClick={() => patch({ llm_active_provider: value })}
                aria-pressed={selected}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  selected
                    ? 'bg-primary/15 border-primary/50 text-text-primary'
                    : 'bg-white/5 hover:bg-white/10 border-space-border hover:border-white/20 text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={13} />
                {value === 'ollama' ? 'Ollama' : value === 'vllm' ? 'vLLM' : 'Kilo'}
              </button>
            );
          })}
        </div>
      </FieldRow>

      <div className="h-px bg-space-border/60" />

      <FieldRow
        label={t('settings.llm.providerOllama')}
        hint={t('settings.llm.modelHintOllama')}
      >
        <div className="space-y-2">
          <TextInput
            value={form.llm_ollama_url ?? ''}
            onChange={(v) => patch({ llm_ollama_url: v })}
            placeholder="http://localhost:11434"
            monospace
            disabled={!canEdit}
          />
          <TextInput
            value={form.llm_ollama_model ?? ''}
            onChange={(v) => patch({ llm_ollama_model: v })}
            placeholder="qwen3-vl:8b"
            monospace
            disabled={!canEdit}
          />
          <ProviderTestRow
            provider="ollama"
            hasKey={keyStatus('ollama')}
            result={testResult.ollama}
            testing={testing === 'ollama'}
            onTest={() => handleTest('ollama')}
          />
        </div>
      </FieldRow>

      <div className="h-px bg-space-border/60" />

      <FieldRow
        label={t('settings.llm.providerVllm')}
        hint={t('settings.llm.modelHintVllm')}
      >
        <div className="space-y-2">
          <TextInput
            value={form.llm_vllm_base_url ?? ''}
            onChange={(v) => patch({ llm_vllm_base_url: v })}
            placeholder="http://vllm:8000/v1"
            monospace
            disabled={!canEdit}
          />
          <TextInput
            value={form.llm_vllm_model ?? ''}
            onChange={(v) => patch({ llm_vllm_model: v })}
            placeholder="lagarde-vllm"
            monospace
            disabled={!canEdit}
          />
          <ProviderTestRow
            provider="vllm"
            hasKey={keyStatus('vllm')}
            result={testResult.vllm}
            testing={testing === 'vllm'}
            onTest={() => handleTest('vllm')}
          />
        </div>
      </FieldRow>

      <div className="h-px bg-space-border/60" />

      <FieldRow
        label={t('settings.llm.providerKilo')}
        hint={t('settings.llm.modelHintKilo')}
      >
        <div className="space-y-2">
          <TextInput
            value={form.llm_kilo_model ?? ''}
            onChange={(v) => patch({ llm_kilo_model: v })}
            placeholder="qwen/qwen3.8-27b:free"
            monospace
            disabled={!canEdit}
          />
          <ProviderTestRow
            provider="kilo"
            hasKey={keyStatus('kilo')}
            result={testResult.kilo}
            testing={testing === 'kilo'}
            onTest={() => handleTest('kilo')}
          />
          <ModelBrowser provider="kilo" canEdit={canEdit} onPick={(id) => patch({ llm_kilo_model: id })} />
        </div>
      </FieldRow>
    </SettingsSection>
  );
}

function ProviderTestRow({
  provider,
  hasKey,
  result,
  testing,
  onTest,
}: {
  provider: string;
  hasKey: boolean | null;
  result?: string;
  testing: boolean;
  onTest: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={onTest}
        disabled={testing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-space-border hover:border-space-border-light text-text-secondary hover:text-text-primary bg-space-elevated rounded transition-all disabled:opacity-50"
      >
        {testing ? <Loader2 size={11} className="animate-spin" /> : <Wifi size={11} />}
        {t('settings.llm.test')}
      </button>
      {hasKey !== null && (
        <span className={hasKey ? 'text-success' : 'text-text-muted'}>
          {hasKey ? t('settings.llm.hasKey') : t('settings.llm.noKey')}
        </span>
      )}
      {result && (
        <span className={result === t('settings.llm.testFailed') ? 'text-error' : 'text-success'}>
          {result}
        </span>
      )}
      <span className="sr-only">{provider}</span>
    </div>
  );
}

function ModelBrowser({
  provider,
  canEdit,
  onPick,
}: {
  provider: string;
  canEdit: boolean;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['llm-models', provider],
    queryFn: () => listLlmModels(provider),
    enabled: open,
    staleTime: 300_000,
  });
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-accent hover:text-accent-hover underline underline-offset-2"
      >
        {t('settings.llm.browseModels')}
      </button>
    );
  }
  return (
    <div className="max-h-40 overflow-y-auto border border-space-border rounded-md divide-y divide-space-border/60">
      {isLoading && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
          <Loader2 size={11} className="animate-spin" />
          {t('settings.processingDefaults.loading')}
        </div>
      )}
      {(data ?? []).slice(0, 60).map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={!canEdit}
          onClick={() => onPick(m.id)}
          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <span className="font-mono text-text-secondary truncate">{m.id}</span>
          <span className="flex gap-1 flex-shrink-0">
            {m.free && (
              <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[10px] font-medium">
                {t('settings.llm.free')}
              </span>
            )}
            {m.vision && (
              <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-medium">
                {t('settings.llm.vision')}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent mb-1.5">{t('settings.title')}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{t('settings.heading')}</h1>
        <p className="text-base text-text-secondary mt-2 leading-relaxed">
          {t('settings.description')}
        </p>
      </div>

      <ConnectionSettings />
      <OperationalSettings />
    </div>
  );
}


