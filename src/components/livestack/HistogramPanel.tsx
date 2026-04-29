import { useEffect, useRef, useState } from 'react';

interface HistogramPanelProps {
  /** Source URL of the JPEG used to compute the histogram. */
  imageUrl: string | null;
}

interface Histogram {
  red: Uint32Array;
  green: Uint32Array;
  blue: Uint32Array;
  max: number;
}

/**
 * Lightweight 256-bin RGB histogram drawn on a small canvas.
 *
 * Computation is done in the main thread via an offscreen
 * ``HTMLImageElement`` + ``CanvasRenderingContext2D.getImageData``;
 * the typical preview is < 4 MP so this stays well under one frame.
 * If we observe jank on slower machines, the computation can be
 * lifted into a dedicated Web Worker without changing this API.
 */
export function HistogramPanel({ imageUrl }: HistogramPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hist, setHist] = useState<Histogram | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setHist(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement('canvas');
      // Down-sample large previews to keep histogram cost bounded.
      const scale = Math.min(1, 512 / Math.max(img.width, img.height));
      off.width = Math.max(1, Math.round(img.width * scale));
      off.height = Math.max(1, Math.round(img.height * scale));
      const ctx = off.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, off.width, off.height);
      const { data } = ctx.getImageData(0, 0, off.width, off.height);
      const r = new Uint32Array(256);
      const g = new Uint32Array(256);
      const b = new Uint32Array(256);
      for (let i = 0; i < data.length; i += 4) {
        r[data[i]]++;
        g[data[i + 1]]++;
        b[data[i + 2]]++;
      }
      let max = 0;
      for (let i = 1; i < 255; i++) {
        if (r[i] > max) max = r[i];
        if (g[i] > max) max = g[i];
        if (b[i] > max) max = b[i];
      }
      setHist({ red: r, green: g, blue: b, max });
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hist) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, width, height);

    const drawChannel = (data: Uint32Array, color: string) => {
      ctx.beginPath();
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const y = height - (data[i] / hist.max) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    ctx.globalCompositeOperation = 'lighter';
    drawChannel(hist.red, 'rgba(255, 91, 91, 0.55)');
    drawChannel(hist.green, 'rgba(91, 255, 122, 0.55)');
    drawChannel(hist.blue, 'rgba(91, 155, 255, 0.55)');
    ctx.globalCompositeOperation = 'source-over';
  }, [hist]);

  return (
    <div className="bg-space-surface border border-space-border rounded-xl p-4 flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text-primary">Histogram</h3>
      <canvas
        ref={canvasRef}
        width={260}
        height={120}
        className="w-full h-[120px] rounded-md border border-space-border"
      />
      {!hist && <p className="text-[11px] text-text-muted">Awaiting first frame…</p>}
    </div>
  );
}
