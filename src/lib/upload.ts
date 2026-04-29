import api from './axios';

// 10 MB chunks: each 8 MB FITS file fits in a single chunk (150 files → 150 requests).
// Increasing beyond the file size has no drawback — the last chunk is always smaller.
const CHUNK_SIZE = 10 * 1024 * 1024;

export type FrameType = 'lights' | 'darks' | 'flats' | 'dark_flats' | 'bias';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  chunkIndex: number;
  totalChunks: number;
}

export interface UploadResult {
  session_id: string;
  file_path: string;
}

export type ProgressCallback = (progress: UploadProgress) => void;

export interface UploadOptions {
  sessionId?: string;
  sessionName?: string;
  objectName?: string;
  /** User-supplied right ascension hint, J2000 decimal degrees. */
  targetRa?: number;
  /** User-supplied declination hint, J2000 decimal degrees. */
  targetDec?: number;
  frameType?: FrameType;
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
}

export async function uploadFileChunked(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { sessionId, sessionName, objectName, targetRa, targetDec, frameType, onProgress, signal } = options;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadId: string | null = null;

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError');

    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunk, file.name);

    const headers: Record<string, string> = {
      'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
      'Upload-Chunk': String(i),
      'Upload-Total-Chunks': String(totalChunks),
      // File names may contain Unicode characters (accents, emoji, …); HTTP
      // headers are limited to ISO-8859-1 so we percent-encode the value.
      'X-File-Name': encodeURIComponent(file.name),
    };

    if (uploadId) headers['X-Upload-ID'] = uploadId;
    if (sessionId) headers['X-Session-ID'] = sessionId;
    // Free-form text headers may contain Unicode (em-dashes, accents, …) but
    // HTTP headers are restricted to ISO-8859-1. Percent-encode them so the
    // browser's setRequestHeader() accepts the value; the API decodes it.
    if (sessionName) headers['X-Session-Name'] = encodeURIComponent(sessionName);
    if (objectName) headers['X-Object-Name'] = encodeURIComponent(objectName);
    if (typeof targetRa === 'number') headers['X-Target-RA'] = String(targetRa);
    if (typeof targetDec === 'number') headers['X-Target-Dec'] = String(targetDec);
    if (frameType) headers['X-Frame-Type'] = frameType;
    if (i === 0) headers['Upload-Start'] = 'true';
    if (i === totalChunks - 1) headers['Upload-Finalize'] = 'true';

    const response = await api.post<UploadResult>('/sessions/upload', formData, {
      // Do NOT set Content-Type manually — the browser must set it automatically
      // to include the multipart boundary (e.g. "multipart/form-data; boundary=----XYZ").
      // Forcing it here strips the boundary and causes a 422 on the server.
      headers,
      signal,
      // No timeout for uploads: large files on slow connections can take minutes.
      // The global axios timeout (30s) applies to API calls only, not file transfers.
      timeout: 0,
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          const totalLoaded = i * CHUNK_SIZE + evt.loaded;
          onProgress({
            loaded: Math.min(totalLoaded, file.size),
            total: file.size,
            percentage: Math.round((Math.min(totalLoaded, file.size) / file.size) * 100),
            chunkIndex: i,
            totalChunks,
          });
        }
      },
    });

    if (i === 0 && response.data) {
      const data = response.data as unknown as { upload_id?: string; session_id?: string };
      if (data.upload_id) uploadId = data.upload_id;
    }

    if (i === totalChunks - 1) return response.data;
  }

  throw new Error('Upload failed: no finalization response');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isValidAstroFile(file: File): boolean {
  const validExtensions = ['.fits', '.fit', '.fts', '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng'];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return validExtensions.includes(ext);
}

export function totalFileSize(files: File[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}
