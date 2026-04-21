// src/components/patrol/PhotoUpload.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, X, CheckCircle, Loader2, Monitor } from "lucide-react";
import { processPhoto } from "@/lib/photoUtils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { PhotoMeta } from "@/types";

interface Props {
  label?: string;
  subdir: string;
  value?: PhotoMeta;
  onChange: (photo: PhotoMeta) => void;
  required?: boolean;
  personelName?: string;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      // Detect mobile by: touch support + narrow screen OR user agent
      const hasTouchScreen =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - legacy API
        navigator.msMaxTouchPoints > 0;
      const isNarrow = window.innerWidth < 1024;
      const mobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      setIsMobile((hasTouchScreen && isNarrow) || mobileUA);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }
    // Relaxed limit since we now compress — accept up to 50MB raw
    if (file.size > 50 * 1024 * 1024) {
      setError("Ukuran foto maksimal 50MB");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Compress + apply watermark + GPS client-side
      const { blob, timestamp, latitude, longitude } = await processPhoto(
        file,
        personelName,
      );

      // 2. Convert blob to File
      const watermarkedFile = new File([blob], "photo.jpg", {
        type: "image/jpeg",
      });

      // 3. Upload directly to Cloudinary from client
      const url = await uploadToCloudinary(
        watermarkedFile,
        `patrol/${subdir}`,
      );

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

  // Desktop block UI — shown when not mobile
  if (!isMobile) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Monitor className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-700">
                Kamera Tidak Tersedia di Desktop
              </p>
              <p className="text-xs text-orange-500 mt-1 leading-relaxed">
                Fitur pengambilan foto hanya tersedia di perangkat mobile
                (smartphone / tablet). Akses sistem ini melalui perangkat mobile
                untuk mengisi laporan patrol.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {value?.url ? (
        <div className="relative rounded-xl overflow-hidden border border-green-200">
          <img
            src={value.url}
            alt="Foto patrol"
            className="w-full h-56 object-cover"
          />
          <button
            type="button"
            onClick={() => {
              reset();
              setTimeout(() => cameraRef.current?.click(), 100);
            }}
            className="absolute top-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold hover:bg-black/80 transition"
          >
            <Camera className="w-3.5 h-3.5" /> Ambil Ulang
          </button>
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
              <span>Foto + watermark timestamp, GPS &amp; peta</span>
            </div>
            {value.latitude && (
              <p className="text-white/50 text-xs mt-0.5">
                📍 {value.latitude.toFixed(5)}, {value.longitude?.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`photo-upload-zone ${loading ? "opacity-60 pointer-events-none" : ""}`}
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
                  Mengompresi &amp; mengupload foto...
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Kompres → watermark GPS → upload ke cloud
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
                  Otomatis dikompresi, diberi watermark nama, timestamp &amp; peta GPS
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

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}