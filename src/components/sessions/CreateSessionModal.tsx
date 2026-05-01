import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sun,
  Moon,
  Layers,
  Minus,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Ban,
  ChevronRight,
  Star,
  Telescope,
  CircleDashed,
  Sparkles,
  Compass,
  Target,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { isValidAstroFile, formatFileSize, totalFileSize } from '../../lib/upload';
import { useUiStore } from '../../store/uiStore';
import { startProcessing } from '../../services/sessions';
import { searchCatalog, resolveObject, type CatalogObject } from '../../services/catalog';
import { SearchableSelect, type SelectGroup } from '../ui/SearchableSelect';
import { ProfileChoiceSelect, type ProfileChoice } from '../processing/ProfileChoiceSelect';
import type { FrameType } from '../../lib/upload';
import type { QueuedFile } from '../../hooks/useUploadQueue';

interface FrameCategory {
  type: FrameType;
  label: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  description: string;
  required?: boolean;
}

const CATEGORIES: FrameCategory[] = [
  {
    type: 'lights',
    label: 'Lights',
    icon: Sun,
    color: 'text-warning',
    borderColor: 'border-warning/40',
    description: 'Your main science frames',
    required: true,
  },
  {
    type: 'darks',
    label: 'Darks',
    icon: Moon,
    color: 'text-text-secondary',
    borderColor: 'border-space-border-light',
    description: 'Dark calibration frames',
  },
  {
    type: 'flats',
    label: 'Flats',
    icon: Layers,
    color: 'text-accent',
    borderColor: 'border-accent/30',
    description: 'Flat field frames',
  },
  {
    type: 'bias',
    label: 'Bias',
    icon: Minus,
    color: 'text-text-muted',
    borderColor: 'border-space-border',
    description: 'Bias / offset frames',
  },
];

// Built-in preset metadata is provided by ProfileChoiceSelect; the modal
// only needs the discriminated ProfileChoice type to track the user's pick.

function StepIndicator({ current }: { current: number }) {
  const labels = ['Session & profile', 'Upload frames'];
  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-space-border/60 bg-space-bg/40">
      {labels.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all duration-200 ${
                  isDone
                    ? 'bg-success text-white'
                    : isActive
                      ? 'bg-primary text-white'
                      : 'bg-space-elevated border border-space-border text-text-muted'
                }`}
              >
                {isDone ? <CheckCircle2 size={11} /> : step}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block transition-colors ${
                  isActive ? 'text-text-primary' : isDone ? 'text-success' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <ChevronRight size={13} className="text-text-muted mx-2 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniDropZone({
  category,
  files,
  onAdd,
  onRemove,
  disabled,
}: {
  category: FrameCategory;
  files: QueuedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) el.value = '';
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    // Snapshot files synchronously, then defer heavy work so React can
    // paint the loading state before blocking the main thread.
    const snapshot = Array.from(e.dataTransfer.files);
    setIsProcessing(true);
    setTimeout(() => {
      const valid = snapshot.filter(isValidAstroFile);
      if (valid.length) onAdd(valid);
      setIsProcessing(false);
    }, 0);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    // Snapshot FileList before clearing the input, then defer heavy work.
    const snapshot = Array.from(e.target.files);
    e.target.value = '';
    setIsProcessing(true);
    setTimeout(() => {
      const valid = snapshot.filter(isValidAstroFile);
      if (valid.length) onAdd(valid);
      setIsProcessing(false);
    }, 0);
  };

  const Icon = category.icon;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`
          relative flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer
          transition-all duration-150
          ${
            dragging
              ? 'border-accent/60 bg-accent-muted scale-[1.01]'
              : disabled || isProcessing
                ? 'border-space-border/50 opacity-50 cursor-not-allowed'
                : `${category.borderColor} bg-space-elevated hover:bg-space-border/20`
          }
        `}
        onClick={() =>
          !disabled && !isProcessing && document.getElementById(`file-input-${category.type}`)?.click()
        }
      >
        <input
          id={`file-input-${category.type}`}
          ref={inputRef}
          type="file"
          multiple
          accept=".fits,.fit,.fts,.raw,.cr2,.cr3,.nef,.arw,.dng"
          className="hidden"
          onChange={handleInput}
          disabled={disabled || isProcessing}
        />
        <Icon size={15} className={category.color} />
        <div className="flex-1">
          <span className="text-sm font-medium text-text-primary">{category.label}</span>
          {category.required && (
            <span className="ml-1.5 text-xs text-warning">required</span>
          )}
          <p className="text-xs text-text-muted">{category.description}</p>
        </div>

        {isProcessing ? (
          <span className="text-xs text-text-muted flex items-center gap-1.5 flex-shrink-0">
            <Loader2 size={12} className="animate-spin text-primary" />
            Indexing…
          </span>
        ) : files.length > 0 ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {errorCount > 0 && (
              <span className="text-xs text-error font-mono">{errorCount} err</span>
            )}
            {doneCount > 0 && (
              <span className="text-xs text-success font-mono">
                {doneCount}/{files.length}
              </span>
            )}
            {doneCount === 0 && (
              <span className="text-xs text-text-secondary font-mono font-semibold">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-text-muted">
              {formatFileSize(totalFileSize(files.map((f) => f.file)))}
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0">
            <Upload size={11} />
            Drop or click
          </span>
        )}
      </div>

      {files.length > 0 && (
        <div className="ml-3 space-y-1 max-h-28 overflow-y-auto">
          {files.map((qf) => (
            <FileRow key={qf.id} qf={qf} onRemove={onRemove} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({
  qf,
  onRemove,
  disabled,
}: {
  qf: QueuedFile;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 bg-space-bg/50 rounded border border-space-border/40"
      title={qf.status === 'error' ? qf.error : undefined}
    >
      <div className="flex-shrink-0">
        {qf.status === 'done' ? (
          <CheckCircle2 size={12} className="text-success" />
        ) : qf.status === 'error' ? (
          <AlertCircle size={12} className="text-error" />
        ) : qf.status === 'uploading' ? (
          <Loader2 size={12} className="text-primary animate-spin" />
        ) : (
          <File size={12} className="text-text-muted" />
        )}
      </div>
      <span className="flex-1 text-xs font-mono text-text-secondary truncate">
        {qf.file.name}
      </span>
      {qf.status === 'error' && qf.error && (
        <span className="text-xs text-error truncate max-w-[200px]" title={qf.error}>
          {qf.error}
        </span>
      )}
      <span className="text-xs text-text-muted flex-shrink-0">
        {formatFileSize(qf.file.size)}
      </span>
      {qf.status === 'uploading' && (
        <span className="text-xs text-primary font-mono flex-shrink-0">{qf.progress}%</span>
      )}
      {(qf.status === 'queued' || qf.status === 'error') && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(qf.id);
          }}
          className="text-text-muted hover:text-error transition-colors flex-shrink-0"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

function UploadProgressView({
  state,
  sessionName,
  onCancel,
}: {
  state: ReturnType<typeof useUploadQueue>['state'];
  sessionName: string;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-text-primary">Uploading frames…</p>
        <p className="text-xs text-text-muted truncate max-w-xs mx-auto">{sessionName}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-muted">Overall progress</span>
          <span className="text-xs font-mono text-text-secondary">{state.overallPercent}%</span>
        </div>
        <div className="h-2 bg-space-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
            style={{ width: `${state.overallPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const catFiles = state.files.filter((f) => f.frameType === cat.type);
          if (catFiles.length === 0) return null;
          const done = catFiles.filter((f) => f.status === 'done').length;
          const pct = Math.round((done / catFiles.length) * 100);
          const Icon = cat.icon;
          return (
            <div key={cat.type} className="flex items-center gap-3">
              <Icon size={13} className={`${cat.color} flex-shrink-0`} />
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-xs text-text-secondary">{cat.label}</span>
                  <span className="text-xs font-mono text-text-muted">
                    {done}/{catFiles.length}
                  </span>
                </div>
                <div className="h-1 bg-space-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.currentFileName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-space-elevated rounded-md border border-space-border">
          <Loader2 size={12} className="text-primary animate-spin flex-shrink-0" />
          <span className="text-xs text-text-muted font-mono truncate">{state.currentFileName}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-error/30 text-error hover:bg-error-muted rounded-md text-sm transition-all"
      >
        <Ban size={13} />
        Cancel upload
      </button>
    </div>
  );
}

// Auto-start overlay shown after upload completes
function AutoStartView({ sessionName }: { sessionName: string }) {
  return (
    <div className="space-y-4 py-6 text-center">
      <div className="w-12 h-12 rounded-full bg-success-muted border border-success/30 flex items-center justify-center mx-auto">
        <CheckCircle2 size={22} className="text-success" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Upload complete</p>
        <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs mx-auto">{sessionName}</p>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
        <Loader2 size={12} className="animate-spin" />
        Starting processing…
      </div>
    </div>
  );
}

// ── Target picker ─────────────────────────────────────────────────────────
// Map a CatalogObject.type to a Lucide icon (used in dropdown options).
const TYPE_ICONS: Record<CatalogObject['type'], React.ElementType> = {
  galaxy: Sparkles,
  cluster: Star,
  nebula: Telescope,
  planetary: CircleDashed,
  supernova: Star,
  other: Compass,
};

const TYPE_GROUP_ORDER: CatalogObject['type'][] = [
  'nebula',
  'galaxy',
  'cluster',
  'planetary',
  'supernova',
  'other',
];

const TYPE_GROUP_LABELS: Record<CatalogObject['type'], string> = {
  nebula: 'Nebulae',
  galaxy: 'Galaxies',
  cluster: 'Star clusters',
  planetary: 'Planetary nebulae',
  supernova: 'Supernova remnants',
  other: 'Other',
};

/**
 * Parse a right-ascension string in any of the common forms:
 *
 * - decimal degrees: ``"83.82"``
 * - decimal hours with ``h`` suffix: ``"5.588h"``
 * - sexagesimal hours/minutes/seconds: ``"5h35m17s"``, ``"05:35:17"``
 *
 * @returns RA in decimal degrees, or ``null`` when unparseable.
 */
function parseRa(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  // 5h35m17s or 5h 35m 17.4s
  const hms = s.match(/^(-?\d+(?:\.\d+)?)h\s*(?:(\d+(?:\.\d+)?)m\s*(?:(\d+(?:\.\d+)?)s?)?)?$/i);
  if (hms) {
    const h = parseFloat(hms[1]);
    const m = hms[2] ? parseFloat(hms[2]) : 0;
    const sec = hms[3] ? parseFloat(hms[3]) : 0;
    return (h + m / 60 + sec / 3600) * 15;
  }
  // 05:35:17.4
  const colon = s.match(/^(-?\d+):(\d+)(?::(\d+(?:\.\d+)?))?$/);
  if (colon) {
    const h = parseFloat(colon[1]);
    const m = parseFloat(colon[2]);
    const sec = colon[3] ? parseFloat(colon[3]) : 0;
    return (h + m / 60 + sec / 3600) * 15;
  }
  // bare decimal — interpret as degrees
  const num = parseFloat(s);
  if (Number.isFinite(num) && num >= -360 && num <= 360) {
    // Heuristic: values in 0-24 are interpreted as hours
    if (num >= 0 && num <= 24 && /[hH]$/.test(s)) return num * 15;
    return num;
  }
  return null;
}

/**
 * Parse a declination string in any of the common forms:
 *
 * - decimal degrees: ``"-5.39"``
 * - sexagesimal: ``"-5°23'28\""``, ``"-05:23:28"``, ``"-5d23m28s"``
 *
 * @returns Dec in decimal degrees in ``[-90, +90]``, or ``null`` if invalid.
 */
function parseDec(input: string): number | null {
  const s = input.trim().replace(/[°*]/g, 'd').replace(/['′]/g, 'm').replace(/["″]/g, 's');
  if (!s) return null;
  const dms = s.match(/^(-?\+?\d+(?:\.\d+)?)d\s*(?:(\d+(?:\.\d+)?)m\s*(?:(\d+(?:\.\d+)?)s?)?)?$/i);
  if (dms) {
    const sign = dms[1].startsWith('-') ? -1 : 1;
    const d = Math.abs(parseFloat(dms[1]));
    const m = dms[2] ? parseFloat(dms[2]) : 0;
    const sec = dms[3] ? parseFloat(dms[3]) : 0;
    const v = sign * (d + m / 60 + sec / 3600);
    return v >= -90 && v <= 90 ? v : null;
  }
  const colon = s.match(/^(-?\+?\d+):(\d+)(?::(\d+(?:\.\d+)?))?$/);
  if (colon) {
    const sign = colon[1].startsWith('-') ? -1 : 1;
    const d = Math.abs(parseFloat(colon[1]));
    const m = parseFloat(colon[2]);
    const sec = colon[3] ? parseFloat(colon[3]) : 0;
    const v = sign * (d + m / 60 + sec / 3600);
    return v >= -90 && v <= 90 ? v : null;
  }
  const num = parseFloat(s);
  if (Number.isFinite(num) && num >= -90 && num <= 90) return num;
  return null;
}

interface TargetPickerProps {
  objectName: string;
  setObjectName: (v: string) => void;
  targetRa: number | null;
  setTargetRa: (v: number | null) => void;
  targetDec: number | null;
  setTargetDec: (v: number | null) => void;
  manualMode: boolean;
  setManualMode: (v: boolean) => void;
  manualRaInput: string;
  setManualRaInput: (v: string) => void;
  manualDecInput: string;
  setManualDecInput: (v: string) => void;
  manualNameInput: string;
  setManualNameInput: (v: string) => void;
  resolving: boolean;
  setResolving: (v: boolean) => void;
  resolveError: string | null;
  setResolveError: (v: string | null) => void;
}

/**
 * Combined object picker: catalogue search + manual coordinate entry +
 * optional SIMBAD resolution. Sets ``targetRa``/``targetDec`` so plate
 * solving can run a fast targeted solve instead of a 180° blind solve.
 */
function TargetPicker({
  objectName,
  setObjectName,
  targetRa,
  setTargetRa,
  targetDec,
  setTargetDec,
  manualMode,
  setManualMode,
  manualRaInput,
  setManualRaInput,
  manualDecInput,
  setManualDecInput,
  manualNameInput,
  setManualNameInput,
  resolving,
  setResolving,
  resolveError,
  setResolveError,
}: TargetPickerProps) {
  const { data: catalogResp } = useQuery({
    queryKey: ['catalog', 'objects'],
    queryFn: () => searchCatalog('', 500),
    staleTime: 1000 * 60 * 60, // 1h — bundled catalogue is static
  });

  const groupedOptions = useMemo<SelectGroup<string>[]>(() => {
    const items = catalogResp?.items ?? [];
    const byType: Record<string, CatalogObject[]> = {};
    for (const obj of items) {
      (byType[obj.type] ??= []).push(obj);
    }
    return TYPE_GROUP_ORDER
      .filter((t) => byType[t]?.length)
      .map((t) => {
        const Icon = TYPE_ICONS[t];
        return {
          label: TYPE_GROUP_LABELS[t],
          options: byType[t].map((obj) => ({
            value: obj.id,
            label: `${obj.id} — ${obj.name}`,
            description: `${obj.constellation}${obj.magnitude !== null ? ` · mag ${obj.magnitude.toFixed(1)}` : ''}`,
            icon: <Icon size={13} />,
            searchHaystack: `${obj.name} ${obj.constellation}`,
          })),
        };
      });
  }, [catalogResp]);

  const flatById = useMemo(() => {
    const m = new Map<string, CatalogObject>();
    for (const obj of catalogResp?.items ?? []) m.set(obj.id, obj);
    return m;
  }, [catalogResp]);

  // The currently chosen catalogue id (when not in manual mode).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleCatalogChoice = (id: string) => {
    const obj = flatById.get(id);
    if (!obj) return;
    setSelectedId(id);
    setObjectName(`${obj.id} — ${obj.name}`);
    setTargetRa(obj.ra_deg);
    setTargetDec(obj.dec_deg);
    setResolveError(null);
  };

  const handleClear = () => {
    setSelectedId(null);
    setObjectName('');
    setTargetRa(null);
    setTargetDec(null);
    setManualRaInput('');
    setManualDecInput('');
    setManualNameInput('');
    setResolveError(null);
  };

  const applyManual = () => {
    const ra = parseRa(manualRaInput);
    const dec = parseDec(manualDecInput);
    if (ra === null || dec === null) {
      setResolveError('Could not parse coordinates. Try formats like "5h35m17s" / "-5°23\'28"" or decimal degrees.');
      setTargetRa(null);
      setTargetDec(null);
      return;
    }
    setResolveError(null);
    setTargetRa(ra);
    setTargetDec(dec);
    if (manualNameInput.trim()) setObjectName(manualNameInput.trim());
  };

  const handleSimbadResolve = async () => {
    const name = manualNameInput.trim();
    if (!name) return;
    setResolving(true);
    setResolveError(null);
    try {
      const obj = await resolveObject(name);
      if (!obj) {
        setResolveError(`'${name}' not found in the bundled catalogue or via SIMBAD.`);
        return;
      }
      setObjectName(obj.id === name.toUpperCase().replace(/\s+/g, '') ? name : `${obj.id} — ${obj.name}`);
      setTargetRa(obj.ra_deg);
      setTargetDec(obj.dec_deg);
      setManualRaInput(obj.ra_deg.toFixed(4));
      setManualDecInput(obj.dec_deg.toFixed(4));
    } finally {
      setResolving(false);
    }
  };

  const hasCoords = targetRa !== null && targetDec !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
          <Target size={12} className="text-text-muted" />
          Target object{' '}
          <span className="text-text-muted font-normal">(recommended)</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setManualMode(!manualMode);
            setResolveError(null);
          }}
          className="text-[11px] text-primary hover:text-primary-hover transition-colors"
        >
          {manualMode ? '← Use catalogue' : 'Enter coordinates manually →'}
        </button>
      </div>

      {!manualMode && (
        <SearchableSelect<string>
          value={selectedId}
          onChange={handleCatalogChoice}
          options={groupedOptions}
          placeholder="Search Messier or NGC/IC objects…"
          searchable
          searchPlaceholder="Type a name, id, or constellation…"
          maxHeight={280}
          ariaLabel="Target object"
        />
      )}

      {manualMode && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualNameInput}
              onChange={(e) => setManualNameInput(e.target.value)}
              placeholder="Name (e.g. NGC 6888 — for SIMBAD lookup)"
              className="flex-1 px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={handleSimbadResolve}
              disabled={!manualNameInput.trim() || resolving}
              className="px-3 py-2 text-xs font-medium bg-space-elevated border border-space-border text-text-secondary hover:text-text-primary hover:border-primary/40 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {resolving ? <Loader2 size={12} className="animate-spin" /> : <Compass size={12} />}
              SIMBAD
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={manualRaInput}
              onChange={(e) => setManualRaInput(e.target.value)}
              onBlur={applyManual}
              placeholder="RA (e.g. 5h35m17s or 83.82)"
              className="w-full px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono"
            />
            <input
              type="text"
              value={manualDecInput}
              onChange={(e) => setManualDecInput(e.target.value)}
              onBlur={applyManual}
              placeholder="Dec (e.g. -5°23'28&quot; or -5.39)"
              className="w-full px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono"
            />
          </div>
        </div>
      )}

      {hasCoords && (
        <div className="mt-2 flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-success-muted/40 border border-success/20 rounded">
          <span className="text-success font-mono">
            RA {targetRa!.toFixed(4)}° · Dec {targetDec!.toFixed(4)}°
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-text-muted hover:text-error transition-colors"
            aria-label="Clear target"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {!hasCoords && objectName && (
        <p className="mt-1.5 text-[11px] text-text-muted">
          Object name set without coordinates — ASTAP will fall back to a slow blind solve.
        </p>
      )}

      {resolveError && (
        <p className="mt-1.5 text-[11px] text-error flex items-start gap-1">
          <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
          {resolveError}
        </p>
      )}
    </div>
  );
}

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionModal({ open, onOpenChange }: CreateSessionModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast, selectedPreset, setSessionPreset, setSessionJob } = useUiStore();

  const [step, setStep] = useState(1);
  const [sessionName, setSessionName] = useState('');
  const [objectName, setObjectName] = useState('');
  const [targetRa, setTargetRa] = useState<number | null>(null);
  const [targetDec, setTargetDec] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualRaInput, setManualRaInput] = useState('');
  const [manualDecInput, setManualDecInput] = useState('');
  const [manualNameInput, setManualNameInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [profileChoice, setProfileChoice] = useState<ProfileChoice>(() => ({
    kind: 'preset',
    preset:
      selectedPreset === 'advanced' ? 'standard' : selectedPreset,
  }));

  const alreadyStarted = useRef(false);

  const { state, addFiles, removeFile, startUpload, cancel, reset, filesByType } =
    useUploadQueue();

  // Auto-start mutation
  const startMutation = useMutation({
    mutationFn: (sessionId: string) =>
      profileChoice.kind === 'profile'
        ? startProcessing(sessionId, 'advanced', profileChoice.profileId)
        : startProcessing(sessionId, profileChoice.preset),
    onSuccess: (data, sessionId) => {
      setSessionJob(sessionId, data.job_id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate(`/sessions/${sessionId}`);
      onOpenChange(false);
      setTimeout(() => {
        reset();
        alreadyStarted.current = false;
      }, 300);
    },
    onError: (_err, sessionId) => {
      addToast({
        variant: 'warning',
        title: 'Upload complete',
        message: 'Could not auto-start — open the session to start manually.',
      });
      navigate(`/sessions/${sessionId}`);
      onOpenChange(false);
      setTimeout(() => {
        reset();
        alreadyStarted.current = false;
      }, 300);
    },
  });

  // Trigger auto-start when upload finishes
  useEffect(() => {
    if (state.phase === 'done' && state.sessionId && !alreadyStarted.current) {
      alreadyStarted.current = true;
      const presetForStore =
        profileChoice.kind === 'profile' ? 'advanced' : profileChoice.preset;
      setSessionPreset(state.sessionId, presetForStore);
      startMutation.mutate(state.sessionId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.sessionId]);

  const handleClose = useCallback(() => {
    if (state.phase === 'uploading') return;
    onOpenChange(false);
    setTimeout(() => {
      reset();
      setSessionName('');
      setObjectName('');
      setTargetRa(null);
      setTargetDec(null);
      setManualMode(false);
      setManualRaInput('');
      setManualDecInput('');
      setManualNameInput('');
      setResolveError(null);
      setStep(1);
      alreadyStarted.current = false;
    }, 300);
  }, [state.phase, onOpenChange, reset]);

  const handleStart = useCallback(async () => {
    await startUpload(
      sessionName.trim(),
      objectName.trim() || undefined,
      targetRa ?? undefined,
      targetDec ?? undefined,
    );
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  }, [sessionName, objectName, targetRa, targetDec, startUpload, queryClient]);

  const handleNextFromStep1 = () => {
    if (!sessionName.trim()) {
      addToast({ variant: 'warning', title: 'Session name is required' });
      return;
    }
    setStep(2);
  };

  const totalFiles = state.files.length;
  const totalBytes = state.files.reduce((sum, f) => sum + f.file.size, 0);
  const lightsCount = filesByType('lights').length;

  const isUploading = state.phase === 'uploading';
  const isDone = state.phase === 'done';
  const isCancelled = state.phase === 'cancelled';
  const isError = state.phase === 'error';

  // Show auto-start overlay when done (before navigation)
  const showAutoStart = isDone && !isCancelled;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-xl bg-space-elevated border border-space-border rounded-lg shadow-2xl animate-slide-in-up focus:outline-none"
          onInteractOutside={(e) => { if (isUploading || showAutoStart) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isUploading || showAutoStart) e.preventDefault(); }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-space-border">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary">
                {isCancelled ? 'Upload cancelled' : 'New Session'}
              </Dialog.Title>
              {!isUploading && !showAutoStart && !isCancelled && (
                <Dialog.Description className="text-sm text-text-secondary mt-0.5">
                  {step === 1 && 'Name your session and choose a processing profile'}
                  {step === 2 && 'Add your calibration frames'}
                </Dialog.Description>
              )}
            </div>
            {!isUploading && !showAutoStart && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-text-muted hover:text-text-secondary transition-colors mt-0.5"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            )}
          </div>

          {/* Step indicator */}
          {!isUploading && !showAutoStart && !isCancelled && !isError && (
            <StepIndicator current={step} />
          )}

          {/* Body */}
          <div className="px-6 py-5">
            {/* Uploading */}
            {isUploading && (
              <UploadProgressView
                state={state}
                sessionName={sessionName}
                onCancel={cancel}
              />
            )}

            {/* Auto-start overlay */}
            {showAutoStart && <AutoStartView sessionName={sessionName} />}

            {/* Cancelled */}
            {isCancelled && (
              <div className="space-y-4 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-space-elevated border border-space-border flex items-center justify-center mx-auto">
                  <Ban size={20} className="text-text-muted" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Upload cancelled</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-space-elevated border border-space-border text-text-secondary hover:text-text-primary rounded-md text-sm transition-all"
                >
                  Close
                </button>
              </div>
            )}

            {/* Step 1: Name + preset */}
            {!isUploading && !showAutoStart && !isCancelled && step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Session name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleNextFromStep1(); }}
                    placeholder="e.g. M31 – Oct 2024"
                    className="w-full px-3 py-2 bg-space-bg border border-space-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                    autoFocus
                  />
                </div>

                <TargetPicker
                  objectName={objectName}
                  setObjectName={setObjectName}
                  targetRa={targetRa}
                  setTargetRa={setTargetRa}
                  targetDec={targetDec}
                  setTargetDec={setTargetDec}
                  manualMode={manualMode}
                  setManualMode={setManualMode}
                  manualRaInput={manualRaInput}
                  setManualRaInput={setManualRaInput}
                  manualDecInput={manualDecInput}
                  setManualDecInput={setManualDecInput}
                  manualNameInput={manualNameInput}
                  setManualNameInput={setManualNameInput}
                  resolving={resolving}
                  setResolving={setResolving}
                  resolveError={resolveError}
                  setResolveError={setResolveError}
                />

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Processing profile
                  </label>
                  <ProfileChoiceSelect
                    value={profileChoice}
                    onChange={setProfileChoice}
                    ariaLabel="Processing profile"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-surface rounded-md text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    disabled={!sessionName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Upload frames */}
            {!isUploading && !showAutoStart && !isCancelled && step === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Frame files
                    </p>
                    {totalFiles > 0 && (
                      <span className="text-xs text-text-muted">
                        {totalFiles} file{totalFiles !== 1 ? 's' : ''} ·{' '}
                        {formatFileSize(totalBytes)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => (
                      <MiniDropZone
                        key={cat.type}
                        category={cat}
                        files={filesByType(cat.type)}
                        onAdd={(files) => addFiles(files, cat.type)}
                        onRemove={removeFile}
                        disabled={false}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-space-border text-text-muted hover:text-text-secondary hover:bg-space-surface rounded-md text-sm transition-all"
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={lightsCount === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload size={14} />
                    Upload &amp; Start
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
