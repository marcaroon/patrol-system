// src/components/patrol/PhotoUpload.tsx
"use client";
import { useRef, useState } from "react";
import { Camera, X, CheckCircle, Loader2 } from "lucide-react";
import { processPhoto } from "@/lib/photoUtils";
import type { PhotoMeta } from "@/types";

interface Props {
  label?: string;
  subdir: string;
  value?: PhotoMeta;
  onChange: (photo: PhotoMeta) => void;
  required?: boolean;
  personelName?: string; // Nama personel untuk watermark
}

export default function PhotoUpload({
  label,
  subdir,
  value,
  onChange,
  required,
  personelName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Satu ref — hanya untuk kamera, `capture="environment"` wajib
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Ukuran foto maksimal 15MB");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Apply watermark + GPS client-side (pass nama personel)
      const { blob, timestamp, latitude, longitude } = await processPhoto(
        file,
        personelName
      );

      // 2. Upload ke server
      const form = new FormData();
      form.append(
        "file",
        new File([blob], "photo.jpg", { type: "image/jpeg" })
      );
      form.append("subdir", subdir);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload gagal");
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
    if (cameraRef.current) cameraRef.current.value = "";
    onChange(undefined as unknown as PhotoMeta);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {value?.url ? (
        /* ── Preview setelah foto diambil ── */
        <div className="relative rounded-xl overflow-hidden border border-green-200">
          <img
            src={value.url}
            alt="Foto patrol"
            className="w-full h-56 object-cover"
          />
          {/* Tombol ganti foto */}
          <button
            type="button"
            onClick={() => {
              reset();
              // Langsung buka kamera lagi
              setTimeout(() => cameraRef.current?.click(), 100);
            }}
            className="absolute top-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold hover:bg-black/80 transition"
          >
            <Camera className="w-3.5 h-3.5" /> Ambil Ulang
          </button>
          {/* Tombol hapus */}
          <button
            type="button"
            onClick={reset}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {/* Info watermark */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-1.5 text-white text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Foto + watermark timestamp, GPS & peta</span>
            </div>
            {value.latitude && (
              <p className="text-white/50 text-xs mt-0.5">
                📍 {value.latitude.toFixed(5)}, {value.longitude?.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ── Zone ambil foto ── */
        <div
          className={`photo-upload-zone ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
          onClick={() => !loading && cameraRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && !loading && cameraRef.current?.click()
          }
        >
          {loading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Memproses foto...
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Menerapkan watermark GPS &amp; peta
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <Camera className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Ketuk untuk ambil foto
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Otomatis diberi watermark nama, timestamp &amp; peta GPS
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}

      {/*
        Input kamera:
        - accept="image/*"  → hanya gambar
        - capture="environment" → langsung buka kamera belakang (wajib ada)
        - TIDAK ada tombol "Pilih dari galeri" — kamera saja
      */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // Reset value agar foto yang sama bisa diambil ulang
          e.target.value = "";
        }}
      />
    </div>
  );
}
