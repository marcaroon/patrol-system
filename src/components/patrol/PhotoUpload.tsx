// src/components/patrol/PhotoUpload.tsx
"use client";
import { useRef, useState } from "react";
import { Camera, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { processPhoto } from "@/lib/photoUtils";
import type { PhotoMeta } from "@/types";

interface Props {
  label?: string;
  subdir: string;         // e.g. "security/kcp" or "hse/visit"
  value?: PhotoMeta;
  onChange: (photo: PhotoMeta) => void;
  required?: boolean;
}

export default function PhotoUpload({ label, subdir, value, onChange, required }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("File harus berupa gambar"); return; }
    if (file.size > 15 * 1024 * 1024) { setError("Ukuran foto maksimal 15MB"); return; }

    setLoading(true);
    setError(null);
    try {
      // 1. Apply watermark client-side
      const { blob, timestamp, latitude, longitude } = await processPhoto(file);

      // 2. Upload watermarked blob to server
      const form = new FormData();
      form.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      form.append("subdir", subdir);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = await res.json();

      onChange({ url, timestamp, latitude, longitude });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal mengunggah foto";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
    onChange(undefined as unknown as PhotoMeta);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="form-label">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {value?.url ? (
        <div className="relative rounded-xl overflow-hidden border border-green-200">
          <img src={value.url} alt="Foto patrol" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={reset}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-1.5 text-white text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Foto + watermark timestamp & GPS</span>
            </div>
            {value.latitude && (
              <p className="text-white/50 text-xs mt-0.5">
                📍 {value.latitude.toFixed(5)}, {value.longitude?.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={`photo-upload-zone ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          {loading ? (
            <div className="py-6 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              <p className="text-sm text-gray-500">Memproses foto & watermark GPS...</p>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
                >
                  <Camera className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Ambil Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Pilih File</span>
                </button>
              </div>
              <p className="text-xs text-gray-400">Foto otomatis diberi watermark timestamp & koordinat GPS</p>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}
