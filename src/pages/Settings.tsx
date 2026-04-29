import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import { useIsAdmin } from '../store/authStore';
import { AUTH_MODE } from '../lib/oidc';
import api from '../lib/axios';
import type { AppSettings } from '../store/settingsStore';
import type { AppSettingsRemote, AppSettingsUpdate } from '../types';
import { getRemoteSettings, updateRemoteSettings } from '../services/settings';

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
    addToast({ variant: 'success', title: 'Connection settings saved' });
    setDirty(false);
  };

  const handleReset = () => {
    store.reset();
    const s = useSettingsStore.getState();
    setForm({ apiBaseUrl: s.apiBaseUrl, wsBaseUrl: s.wsBaseUrl });
    addToast({ variant: 'info', title: 'Connection settings reset to defaults' });
    setDirty(false);
  };

  const handleTestConnection = async () => {
    setConnectionState('checking');
    setConnectionMessage('');
    store.update({ apiBaseUrl: form.apiBaseUrl });
    try {
      await api.get('/health', { timeout: 5000 });
      setConnectionState('ok');
      setConnectionMessage('Backend reachable and responding');
    } catch (err: unknown) {
      setConnectionState('error');
      const e = err as { message?: string };
      setConnectionMessage(e?.message ?? 'Could not reach the backend');
    }
  };

  return (
    <SettingsSection
      icon={Server}
      title="Connection"
      description="Backend API endpoint and WebSocket URL — stored locally in this browser"
    >
      <FieldRow
        label="API Base URL"
        hint="Root URL of the Astro-Stack REST API, including the version path"
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
            Test
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
        label="WebSocket URL"
        hint="Used for real-time job progress updates"
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
          Unsaved changes
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-secondary border border-space-border hover:border-space-border-light rounded-md transition-all"
        >
          <RotateCcw size={12} />
          Reset defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Save size={13} />
          Save
        </button>
      </div>
    </SettingsSection>
  );
}

// ── Operational section (backend DB) ──────────────────────────────────────

function OperationalSettings() {
  const qc = useQueryClient();
  const { addToast } = useUiStore();
  const isAdmin = useIsAdmin();
  // In disabled auth mode every user is implicitly an admin.
  const canEdit = isAdmin || AUTH_MODE === 'disabled';

  const { data, isLoading, isError } = useQuery<AppSettingsRemote>({
    queryKey: ['app-settings'],
    queryFn: getRemoteSettings,
  });

  const [form, setForm] = useState<AppSettingsUpdate | null>(null);
  const [dirty, setDirty] = useState(false);

  // Initialise form when query data arrives
  useEffect(() => {
    if (data && form === null) {
      setForm({
        inbox_path: data.inbox_path,
        ollama_url: data.ollama_url,
        ollama_model: data.ollama_model,
        pipeline_max_retries: data.pipeline_max_retries,
        session_stability_delay: data.session_stability_delay,
      });
    }
  }, [data, form]);

  // Track dirty state vs persisted data
  useEffect(() => {
    if (!data || !form) { setDirty(false); return; }
    setDirty(
      form.inbox_path !== data.inbox_path ||
      form.ollama_url !== data.ollama_url ||
      form.ollama_model !== data.ollama_model ||
      form.pipeline_max_retries !== data.pipeline_max_retries ||
      form.session_stability_delay !== data.session_stability_delay
    );
  }, [form, data]);

  const mutation = useMutation<AppSettingsRemote, Error, AppSettingsUpdate>({
    mutationFn: updateRemoteSettings,
    onSuccess: (updated) => {
      qc.setQueryData(['app-settings'], updated);
      addToast({ variant: 'success', title: 'Operational settings saved' });
      setDirty(false);
    },
    onError: (err) => {
      addToast({ variant: 'error', title: 'Save failed', message: err.message });
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
        pipeline_max_retries: data.pipeline_max_retries,
        session_stability_delay: data.session_stability_delay,
      });
    }
  };

  if (isLoading || !form) {
    return (
      <div className="bg-space-surface border border-space-border rounded-lg p-8 flex items-center justify-center gap-2 text-text-muted text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-space-surface border border-space-border rounded-lg p-8 flex items-center justify-center gap-2 text-error text-sm">
        <AlertCircle size={16} />
        Could not load operational settings from the backend.
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
        title="Inbox &amp; AI"
        description="Server-side paths and Ollama AI configuration — shared across all instances"
      >
        <FieldRow
          label="Inbox Path"
          hint="Folder watched by the backend for incoming session frames (matches INBOX_PATH env var)"
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
          label="Ollama URL"
          hint="Base URL of the Ollama instance used for AI-based gradient removal"
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
          label="Ollama Model"
          hint="Model name used for inference requests to Ollama"
        >
          <TextInput
            value={form.ollama_model ?? ''}
            onChange={(v) => patch({ ollama_model: v })}
            placeholder="llama3.2"
            monospace
            disabled={!canEdit}
          />
        </FieldRow>
      </SettingsSection>

      <SettingsSection
        icon={Cpu}
        title="Processing Defaults"
        description="Default pipeline behaviour for new processing jobs — shared across all instances"
      >
        <FieldRow
          label="Max retries"
          hint="Maximum number of retry attempts per pipeline step on failure"
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
          label="Session stability delay"
          hint="Seconds to wait after the last file change before auto-triggering processing"
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={form.session_stability_delay ?? 30}
              onChange={(v) => patch({ session_stability_delay: v })}
              min={1}
              max={300}
              disabled={!canEdit}
            />
            <span className="text-sm text-text-muted">seconds</span>
          </div>
        </FieldRow>

        {!canEdit && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-space-elevated border border-space-border rounded-md text-xs text-text-muted">
            <Lock size={12} />
            Admin role required to edit operational settings
          </div>
        )}

        {dirty && canEdit && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-warning-muted border border-warning/30 rounded-md text-xs text-warning">
            <AlertCircle size={13} />
            Unsaved changes — these will apply immediately to all running instances
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
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || mutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save
            </button>
          </div>
        )}
      </SettingsSection>

      {data && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted justify-end">
          <Clock size={11} />
          Last updated {updatedAt}
          {data.updated_by_user_id && (
            <span className="font-mono text-text-muted/70">by {data.updated_by_user_id}</span>
          )}
        </div>
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent mb-1.5">Config</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Settings</h1>
        <p className="text-base text-text-secondary mt-2 leading-relaxed">
          Configure connection parameters and server-side processing defaults.
        </p>
      </div>

      <ConnectionSettings />
      <OperationalSettings />
    </div>
  );
}


