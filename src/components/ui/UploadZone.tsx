import { useCallback, useRef, useState } from 'react';
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize, isValidAstroFile } from '../../lib/upload';

export interface UploadFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploads: UploadFile[];
  onRemove: (id: string) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function UploadZone({
  onFilesSelected,
  uploads,
  onRemove,
  disabled = false,
  maxFiles = 50,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setDragError(null);
      const fileArray = Array.from(files);
      const valid = fileArray.filter(isValidAstroFile);
      const invalid = fileArray.filter((f) => !isValidAstroFile(f));

      if (invalid.length > 0) {
        setDragError(
          `${invalid.length} file(s) rejected — only FITS, RAW, and DSLR formats accepted`
        );
      }

      if (valid.length > maxFiles) {
        setDragError(`Maximum ${maxFiles} files at once`);
        return;
      }

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [onFilesSelected, maxFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-lg p-8 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-accent bg-accent-muted scale-[1.01]'
            : disabled
            ? 'border-space-border bg-space-surface opacity-50 cursor-not-allowed'
            : 'border-space-border bg-space-surface hover:border-primary/60 hover:bg-primary-muted/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".fits,.fit,.fts,.raw,.cr2,.cr3,.nef,.arw,.dng"
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
        />

        <div
          className={`p-3 rounded-full transition-colors duration-200 ${
            isDragging ? 'bg-accent/20' : 'bg-space-elevated'
          }`}
        >
          <Upload
            size={24}
            className={isDragging ? 'text-accent' : 'text-text-secondary'}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            {isDragging ? 'Drop files here' : 'Drag & drop your astronomy files'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            FITS, RAW, CR2/CR3, NEF, ARW, DNG — up to {maxFiles} files
          </p>
        </div>

        {!isDragging && (
          <button
            type="button"
            className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
          >
            or browse files
          </button>
        )}
      </div>

      {dragError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-error-muted border border-error/20 rounded-md">
          <AlertCircle size={14} className="text-error flex-shrink-0" />
          <span className="text-xs text-error">{dragError}</span>
          <button
            type="button"
            onClick={() => setDragError(null)}
            className="ml-auto text-error/60 hover:text-error"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <UploadFileRow
              key={upload.id}
              upload={upload}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadFileRow({
  upload,
  onRemove,
}: {
  upload: UploadFile;
  onRemove: (id: string) => void;
}) {
  const isLoading = upload.status === 'uploading';

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-space-elevated border border-space-border rounded-md">
      <div className="flex-shrink-0">
        {upload.status === 'done' ? (
          <CheckCircle2 size={16} className="text-success" />
        ) : upload.status === 'error' ? (
          <AlertCircle size={16} className="text-error" />
        ) : upload.status === 'uploading' ? (
          <Loader2 size={16} className="text-primary animate-spin" />
        ) : (
          <File size={16} className="text-text-muted" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-text-primary font-mono truncate">
            {upload.file.name}
          </span>
          <span className="text-xs text-text-muted flex-shrink-0">
            {formatFileSize(upload.file.size)}
          </span>
        </div>

        {isLoading && (
          <div className="mt-1.5 h-1 bg-space-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        )}

        {upload.status === 'error' && upload.error && (
          <p className="text-xs text-error mt-0.5 truncate">{upload.error}</p>
        )}
      </div>

      {upload.status !== 'uploading' && (
        <button
          type="button"
          onClick={() => onRemove(upload.id)}
          className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
          aria-label="Remove file"
        >
          <X size={14} />
        </button>
      )}

      {isLoading && (
        <span className="text-xs text-text-muted font-mono flex-shrink-0">
          {upload.progress}%
        </span>
      )}
    </div>
  );
}
