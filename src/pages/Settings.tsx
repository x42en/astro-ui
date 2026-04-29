import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useUiStore } from '../store/uiStore';
import api from '../lib/axios';
import type { AppSettings } from '../store/settingsStore';

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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  monospace?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all ${monospace ? 'font-mono' : ''}`}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-32 px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary font-mono focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
    />
  );
}

type ConnectionState = 'idle' | 'checking' | 'ok' | 'error';

export function SettingsPage() {
  const store = useSettingsStore();
  const { addToast } = useUiStore();

  const [form, setForm] = useState<AppSettings>({
    apiBaseUrl: store.apiBaseUrl,
    wsBaseUrl: store.wsBaseUrl,
    inboxPath: store.inboxPath,
    ollamaUrl: store.ollamaUrl,
    pipelineMaxRetries: store.pipelineMaxRetries,
    sessionStabilityDelay: store.sessionStabilityDelay,
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(
      form.apiBaseUrl !== store.apiBaseUrl ||
      form.wsBaseUrl !== store.wsBaseUrl ||
      form.inboxPath !== store.inboxPath ||
      form.ollamaUrl !== store.ollamaUrl ||
      form.pipelineMaxRetries !== store.pipelineMaxRetries ||
      form.sessionStabilityDelay !== store.sessionStabilityDelay
    );
  }, [form, store]);

  const patch = (partial: Partial<AppSettings>) =>
    setForm((f) => ({ ...f, ...partial }));

  const handleSave = () => {
    store.update(form);
    addToast({ variant: 'success', title: 'Settings saved' });
    setDirty(false);
  };

  const handleReset = () => {
    store.reset();
    const s = useSettingsStore.getState();
    setForm({
      apiBaseUrl: s.apiBaseUrl,
      wsBaseUrl: s.wsBaseUrl,
      inboxPath: s.inboxPath,
      ollamaUrl: s.ollamaUrl,
      pipelineMaxRetries: s.pipelineMaxRetries,
      sessionStabilityDelay: s.sessionStabilityDelay,
    });
    addToast({ variant: 'info', title: 'Settings reset to defaults' });
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent mb-1.5">Config</p>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Settings</h1>
          <p className="text-base text-text-secondary mt-2 leading-relaxed">
            Configure connection parameters and processing defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Save changes
          </button>
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-warning-muted border border-warning/30 rounded-md text-xs text-warning">
          <AlertCircle size={13} />
          You have unsaved changes
        </div>
      )}

      <SettingsSection
        icon={Server}
        title="Connection"
        description="Backend API endpoint, WebSocket URL and authentication"
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

      </SettingsSection>

      <SettingsSection
        icon={FolderOpen}
        title="Backend & Storage"
        description="Paths and URLs configured on the Astro-Stack server"
      >
        <FieldRow
          label="Inbox Path"
          hint="Folder watched by the backend for incoming session frames. Should match INBOX_PATH in the server config"
        >
          <TextInput
            value={form.inboxPath}
            onChange={(v) => patch({ inboxPath: v })}
            placeholder="/data/inbox"
            monospace
          />
        </FieldRow>

        <div className="h-px bg-space-border/60" />

        <FieldRow
          label="Ollama URL"
          hint="Base URL of the Ollama instance used for AI-based gradient removal. Matches OLLAMA_URL in the server config"
        >
          <TextInput
            value={form.ollamaUrl}
            onChange={(v) => patch({ ollamaUrl: v })}
            placeholder="http://localhost:11434"
            monospace
          />
        </FieldRow>
      </SettingsSection>

      <SettingsSection
        icon={Cpu}
        title="Processing Defaults"
        description="Default pipeline behavior for new processing jobs"
      >
        <FieldRow
          label="Max retries"
          hint="Maximum number of retry attempts per pipeline step on failure"
        >
          <NumberInput
            value={form.pipelineMaxRetries}
            onChange={(v) => patch({ pipelineMaxRetries: v })}
            min={0}
            max={10}
          />
        </FieldRow>

        <div className="h-px bg-space-border/60" />

        <FieldRow
          label="Session stability delay"
          hint="Seconds to wait after the last file change before auto-triggering processing (used by the backend watcher)"
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={form.sessionStabilityDelay}
              onChange={(v) => patch({ sessionStabilityDelay: v })}
              min={1}
              max={60}
            />
            <span className="text-sm text-text-muted">seconds</span>
          </div>
        </FieldRow>
      </SettingsSection>

      <div className="flex justify-end gap-2 pt-2">
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
          Save changes
        </button>
      </div>
    </div>
  );
}
