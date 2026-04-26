import { useState, useRef, useCallback } from 'react';
import { uploadFileChunked, totalFileSize } from '../lib/upload';
import type { FrameType, UploadResult } from '../lib/upload';

export interface QueuedFile {
  id: string;
  file: File;
  frameType: FrameType;
  status: 'queued' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  result?: UploadResult;
}

export type UploadPhase = 'idle' | 'uploading' | 'done' | 'error' | 'cancelled';

export interface UploadQueueState {
  files: QueuedFile[];
  phase: UploadPhase;
  sessionId: string | null;
  currentFileName: string | null;
  totalBytes: number;
  uploadedBytes: number;
  overallPercent: number;
}

let fileIdCounter = 0;
function nextId() {
  return `qf-${Date.now()}-${++fileIdCounter}`;
}

export function useUploadQueue() {
  const [state, setState] = useState<UploadQueueState>({
    files: [],
    phase: 'idle',
    sessionId: null,
    currentFileName: null,
    totalBytes: 0,
    uploadedBytes: 0,
    overallPercent: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  // Synchronous ref mirror of state.files — always up to date even inside async functions.
  // React 18 automatic batching makes setState updaters asynchronous outside event handlers,
  // so reading state.files from inside startUpload (async) would always return the initial [].
  const filesRef = useRef<QueuedFile[]>([]);

  const addFiles = useCallback((newFiles: File[], frameType: FrameType) => {
    const queued: QueuedFile[] = newFiles.map((file) => ({
      id: nextId(),
      file,
      frameType,
      status: 'queued',
      progress: 0,
    }));
    filesRef.current = [...filesRef.current, ...queued];
    setState((prev) => {
      const nextFiles = [...prev.files, ...queued];
      return {
        ...prev,
        files: nextFiles,
        totalBytes: totalFileSize(nextFiles.map((f) => f.file)),
      };
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    filesRef.current = filesRef.current.filter((f) => f.id !== id);
    setState((prev) => {
      const nextFiles = prev.files.filter((f) => f.id !== id);
      return {
        ...prev,
        files: nextFiles,
        totalBytes: totalFileSize(nextFiles.map((f) => f.file)),
      };
    });
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    filesRef.current = [];
    setState({
      files: [],
      phase: 'idle',
      sessionId: null,
      currentFileName: null,
      totalBytes: 0,
      uploadedBytes: 0,
      overallPercent: 0,
    });
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({ ...prev, phase: 'cancelled' }));
  }, []);

  const startUpload = useCallback(
    async (sessionName: string, objectName?: string) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState((prev) => ({
        ...prev,
        phase: 'uploading',
        currentFileName: null,
        uploadedBytes: 0,
        overallPercent: 0,
      }));

      let resolvedSessionId: string | null = null;
      let cumulativeBytes = 0;

      // Read the current file list synchronously from the ref.
      // (setState updaters cannot be used as synchronous reads in async functions.)
      const currentFiles = filesRef.current;
      const total = totalFileSize(currentFiles.map((f) => f.file));

      const updateFile = (id: string, patch: Partial<QueuedFile>) => {
        // Keep filesRef in sync so the final allDone check reads correct statuses.
        filesRef.current = filesRef.current.map((f) => (f.id === id ? { ...f, ...patch } : f));
        setState((prev) => ({
          ...prev,
          files: prev.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        }));
      };

      const ORDER: FrameType[] = ['lights', 'darks', 'flats', 'bias'];

      for (const frameType of ORDER) {
        const group = currentFiles.filter((f) => f.frameType === frameType);
        for (const qf of group) {
          if (controller.signal.aborted) break;

          updateFile(qf.id, { status: 'uploading', progress: 0 });
          setState((prev) => ({
            ...prev,
            currentFileName: qf.file.name,
          }));

          let fileBytesAtStart = cumulativeBytes;

          try {
            const result = await uploadFileChunked(qf.file, {
              sessionId: resolvedSessionId ?? undefined,
              sessionName: resolvedSessionId ? undefined : sessionName,
              objectName: resolvedSessionId ? undefined : objectName,
              frameType,
              signal: controller.signal,
              onProgress: ({ loaded }) => {
                const newTotal = fileBytesAtStart + loaded;
                const pct = total > 0 ? Math.round((newTotal / total) * 100) : 0;
                setState((prev) => ({
                  ...prev,
                  uploadedBytes: newTotal,
                  overallPercent: pct,
                  files: prev.files.map((f) =>
                    f.id === qf.id
                      ? { ...f, progress: Math.round((loaded / qf.file.size) * 100) }
                      : f
                  ),
                }));
              },
            });

            if (!resolvedSessionId && result.session_id) {
              resolvedSessionId = result.session_id;
            }

            cumulativeBytes = fileBytesAtStart + qf.file.size;
            updateFile(qf.id, { status: 'done', progress: 100, result });
          } catch (err) {
            if (controller.signal.aborted) {
              setState((prev) => ({ ...prev, phase: 'cancelled' }));
              return;
            }
            const message = err instanceof Error ? err.message : 'Upload failed';
            updateFile(qf.id, { status: 'error', error: message });
          }
        }
        if (controller.signal.aborted) break;
      }

      if (!controller.signal.aborted) {
        const allDone = filesRef.current.every((f) => f.status === 'done');
        setState((prev) => ({
          ...prev,
          phase: allDone ? 'done' : 'error',
          sessionId: resolvedSessionId,
          overallPercent: allDone ? 100 : prev.overallPercent,
        }));
      }
    },
    []
  );

  const filesByType = useCallback(
    (frameType: FrameType): QueuedFile[] => {
      return state.files.filter((f) => f.frameType === frameType);
    },
    [state.files]
  );

  return {
    state,
    addFiles,
    removeFile,
    startUpload,
    cancel,
    reset,
    filesByType,
  };
}
