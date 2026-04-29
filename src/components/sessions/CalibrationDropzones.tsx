import { useCallback, useRef, useState } from 'react';
import { Layers, Loader2, Moon, Upload } from 'lucide-react';
import { uploadFileChunked, type FrameType } from '../../lib/upload';
import { useUiStore } from '../../store/uiStore';
import { useQueryClient } from '@tanstack/react-query';

interface CalibrationKindMeta {
  type: FrameType;
  label: string;
  description: string;
  color: string;
  borderColor: string;
}

/**
 * The three calibration libraries we expose to the user. Bias frames
 * are handled in a later iteration so they are intentionally absent.
 */
const KINDS: CalibrationKindMeta[] = [
  {
    type: 'darks',
    label: 'Darks',
    description: 'Same exposure, ISO and temperature, lens cap on.',
    color: 'text-text-secondary',
    borderColor: 'border-space-border-light',
  },
  {
    type: 'flats',
    label: 'Flats',
    description: 'Uniform light source at working aperture, median ~50% of the dynamic range.',
    color: 'text-accent',
    borderColor: 'border-accent/30',
  },
  {
    type: 'dark_flats',
    label: 'Dark-flats',
    description: 'Same ISO and exposure as the flats, sensor in the dark.',
    color: 'text-warning',
    borderColor: 'border-warning/40',
  },
];

interface ProgressMap {
  [key: string]: { uploaded: number; total: number; pending: boolean };
}

interface CalibrationDropzonesProps {
  /** Existing session that will receive the calibration frames. */
  sessionId: string;
  /** Optional: notify parent when a kind has finished uploading at least one file. */
  onUploaded?: (kind: FrameType, count: number) => void;
  /** Counters returned by the backend so the user sees what's already there. */
  counts?: Partial<Record<FrameType, number>>;
  /** Disable interaction (e.g. during another async operation). */
  disabled?: boolean;
}

/**
 * Reusable 3-zone uploader for darks / flats / dark-flats. Uploads go
 * straight to the chunked ``/sessions/upload`` endpoint with the matching
 * ``X-Frame-Type`` header, so they share the same backend logic as the
 * "create session" flow.
 */
export function CalibrationDropzones({
  sessionId,
  onUploaded,
  counts = {},
  disabled = false,
}: CalibrationDropzonesProps) {
  const { addToast } = useUiStore();
  const queryClient = useQueryClient();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [progress, setProgress] = useState<ProgressMap>({});

  const handleFiles = useCallback(
    async (kind: FrameType, files: FileList | null) => {
      if (!files || files.length === 0) return;
      const list = Array.from(files);
      setProgress((prev) => ({
        ...prev,
        [kind]: { uploaded: 0, total: list.length, pending: true },
      }));

      let uploaded = 0;
      try {
        for (const file of list) {
          await uploadFileChunked(file, { sessionId, frameType: kind });
          uploaded += 1;
          setProgress((prev) => ({
            ...prev,
            [kind]: { uploaded, total: list.length, pending: uploaded < list.length },
          }));
        }
        addToast({
          variant: 'success',
          title: `${list.length} ${kind} file${list.length > 1 ? 's' : ''} uploaded`,
        });
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        onUploaded?.(kind, uploaded);
      } catch (err) {
        addToast({
          variant: 'error',
          title: `Upload failed (${kind})`,
          message: err instanceof Error ? err.message : String(err),
        });
        setProgress((prev) => ({
          ...prev,
          [kind]: { uploaded, total: list.length, pending: false },
        }));
      }
    },
    [sessionId, addToast, queryClient, onUploaded],
  );

  return (
    <div className="space-y-2">
      {KINDS.map((meta) => {
        const prog = progress[meta.type];
        const existing = counts[meta.type] ?? 0;
        const Icon = meta.type === 'flats' ? Layers : Moon;
        const inputId = `cal-input-${meta.type}`;
        const isPending = prog?.pending ?? false;
        return (
          <div
            key={meta.type}
            className={`relative flex items-start gap-3 px-3 py-2.5 rounded-md border bg-space-elevated transition-colors ${
              disabled
                ? 'opacity-50 cursor-not-allowed border-space-border/50'
                : `${meta.borderColor} hover:bg-space-border/20 cursor-pointer`
            }`}
            onClick={() => !disabled && document.getElementById(inputId)?.click()}
          >
            <input
              id={inputId}
              ref={(el) => {
                inputRefs.current[meta.type] = el;
              }}
              type="file"
              multiple
              accept=".fits,.fit,.fts,.raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.rw2,.orf,.pef"
              className="hidden"
              disabled={disabled || isPending}
              onChange={(e) => {
                const files = e.target.files;
                e.target.value = '';
                handleFiles(meta.type, files);
              }}
            />
            <Icon size={16} className={`${meta.color} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{meta.label}</span>
                {existing > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-success-muted text-success">
                    {existing} already received
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">{meta.description}</p>
              {prog && (
                <p className="text-[11px] text-text-secondary font-mono mt-1">
                  {isPending ? 'Uploading… ' : 'Done · '}
                  {prog.uploaded}/{prog.total}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
              {isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Upload size={12} />
              )}
              <span>Click to add</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
