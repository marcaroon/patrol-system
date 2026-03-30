// src/components/patrol/SignaturePad.tsx
"use client";
import { useRef, useState } from "react";
import { RotateCcw, Check } from "lucide-react";

interface Props {
  label: string;
  onSave: (dataUrl: string) => void;
  savedUrl?: string;
}

export default function SignaturePad({ label, onSave, savedUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const scale = (canvas: HTMLCanvasElement) => {
    return { scaleX: canvas.width / canvas.getBoundingClientRect().width, scaleY: canvas.height / canvas.getBoundingClientRect().height };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const { scaleX, scaleY } = scale(canvas);
    const pos = getPos(e, rect);
    lastPos.current = { x: pos.x * scaleX, y: pos.y * scaleY };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const { scaleX, scaleY } = scale(canvas);
    const rawPos = getPos(e, rect);
    const pos = { x: rawPos.x * scaleX, y: rawPos.y * scaleY };
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    if (!canvasRef.current || !hasDrawn) return;
    onSave(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <label className="form-label text-xs">{label}</label>
      {savedUrl ? (
        <div className="border border-green-200 rounded-xl bg-green-50 p-2">
          <img src={savedUrl} alt="Tanda tangan" className="h-20 object-contain mx-auto" />
          <p className="text-center text-xs text-green-600 mt-1">✓ Tersimpan</p>
          <button type="button" onClick={() => onSave("")}
            className="w-full mt-1 text-xs text-red-500 hover:text-red-700">
            Hapus & Ulangi
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <canvas
            ref={canvasRef} width={400} height={120}
            className="sig-canvas"
            onMouseDown={startDraw} onMouseMove={draw}
            onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)}
          />
          <p className="text-xs text-gray-400 text-center">Tanda tangan di atas</p>
          <div className="flex gap-2">
            <button type="button" onClick={clear} className="flex-1 btn-secondary justify-center py-2">
              <RotateCcw className="w-3.5 h-3.5" /> Hapus
            </button>
            <button type="button" onClick={save} disabled={!hasDrawn}
              className="flex-1 btn-primary justify-center py-2 disabled:opacity-40">
              <Check className="w-3.5 h-3.5" /> Simpan TTD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
