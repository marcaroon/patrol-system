// src/components/patrol/HSEPatrolForm.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { HSEAreaVisitInput, PhotoMeta, HazardType } from "@/types";
import { HAZARD_OPTIONS } from "@/types";
import { getCurrentPosition } from "@/lib/photoUtils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import PhotoUpload from "./PhotoUpload";
import SignaturePad from "./SignaturePad";
import {
  User as UserIcon,
  MapPin,
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  Activity,
} from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface UserOpt {
  id: string;
  name: string;
}

const emptyVisit = (): Partial<HSEAreaVisitInput> => ({
  areaName: "",
  workActivities: "",
  hazards: [],
  hazardDescription: "",
  socializationDescription: "",
});

export default function HSEPatrolForm() {
  const router = useRouter();
  const [now] = useState(new Date());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [areaVisits, setAreaVisits] = useState<Partial<HSEAreaVisitInput>[]>([
    emptyVisit(),
  ]);
  const [hseSignatureDataUrl, setHseSignatureDataUrl] = useState("");
  const [witnessSignatureDataUrl, setWitnessSignatureDataUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nama personel yang dipilih (untuk watermark)
  const selectedPersonelName =
    users.find((u) => u.id === selectedUserId)?.name ?? "";

  useEffect(() => {
    fetch("/api/users?division=HSE&active=true")
      .then((r) => r.json())
      .then((u) => {
        setUsers(u);
        setLoading(false);
      });
    getCurrentPosition().then((p) => {
      if (p) setCoords({ lat: p.latitude, lng: p.longitude });
      setCoordsLoading(false);
    });
  }, []);

  const updateVisit = (
    idx: number,
    field: keyof HSEAreaVisitInput,
    value: unknown,
  ) =>
    setAreaVisits((prev) => {
      const u = [...prev];
      u[idx] = { ...u[idx], [field]: value };
      return u;
    });

  const toggleHazard = (idx: number, h: HazardType) => {
    const cur = areaVisits[idx].hazards ?? [];
    updateVisit(
      idx,
      "hazards",
      cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h],
    );
  };

  const uploadSignature = async (
    dataUrl: string,
    subdir: string,
  ): Promise<string> => {
    if (!dataUrl) return "";
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "signature.png", { type: "image/png" });
    return await uploadToCloudinary(file, `patrol/${subdir}`);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedUserId) errs.user = "Pilih nama HSE officer";
    areaVisits.forEach((v, i) => {
      if (!v.areaName?.trim()) errs[`area_${i}`] = "Nama area wajib diisi";
      if (!v.workActivities?.trim()) errs[`work_${i}`] = "Kegiatan wajib diisi";
      if (!v.hazards?.length)
        errs[`hazard_${i}`] = "Pilih minimal 1 potensi bahaya";
      if (!v.hazardDescription?.trim())
        errs[`hdesc_${i}`] = "Deskripsi bahaya wajib diisi";
      if (!v.socializationDescription?.trim())
        errs[`sdesc_${i}`] = "Deskripsi sosialisasi wajib diisi";
      if (!v.evidencePhoto?.url)
        errs[`photo_${i}`] = "Foto evidence wajib diisi";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      document
        .querySelector("[data-err]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const [hseSignatureUrl, witnessSignatureUrl] = await Promise.all([
        hseSignatureDataUrl
          ? uploadSignature(hseSignatureDataUrl, "signatures/hse")
          : Promise.resolve(""),
        witnessSignatureDataUrl
          ? uploadSignature(witnessSignatureDataUrl, "signatures/witness")
          : Promise.resolve(""),
      ]);

      const res = await fetch("/api/reports/hse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          visitDate: format(now, "yyyy-MM-dd"),
          visitTime: format(now, "HH:mm"),
          latitude: coords?.lat,
          longitude: coords?.lng,
          hseSignatureUrl: hseSignatureUrl || undefined,
          witnessSignatureUrl: witnessSignatureUrl || undefined,
          areaVisits: areaVisits.map((v) => ({
            areaName: v.areaName,
            workActivities: v.workActivities,
            hazards: v.hazards,
            hazardDescription: v.hazardDescription,
            socializationDescription: v.socializationDescription,
            evidencePhotoUrl: v.evidencePhoto!.url,
            evidencePhotoTimestamp: v.evidencePhoto!.timestamp,
            evidencePhotoLatitude: v.evidencePhoto?.latitude,
            evidencePhotoLongitude: v.evidencePhoto?.longitude,
          })),
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? "Submit failed");
      router.push("/patrol/success?type=HSE");
    } catch (e) {
      alert("Gagal mengirim laporan. Periksa koneksi dan coba lagi.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        <p className="text-gray-500 text-sm">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Auto info */}
      <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Info Kunjungan (Otomatis)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Tanggal</p>
            <p className="font-semibold text-gray-800 text-sm">
              {format(now, "dd MMMM yyyy", { locale: localeId })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Jam</p>
            <p className="font-semibold text-gray-800 text-sm">
              {format(now, "HH:mm")} WIB
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> GPS
            </p>
            {coordsLoading ? (
              <p className="text-xs text-green-500 animate-pulse">
                Mendapatkan lokasi...
              </p>
            ) : coords ? (
              <p className="font-semibold text-gray-800 text-sm">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-xs text-orange-500">⚠ Lokasi tidak tersedia</p>
            )}
          </div>
        </div>
      </div>

      {/* User */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5" /> Personel HSE
        </p>
        <div data-err={errors.user ? "1" : undefined}>
          <label className="form-label">
            Nama HSE Officer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="form-input appearance-none pr-10"
            >
              <option value="">-- Pilih Nama HSE Officer --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.user && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.user}
            </p>
          )}
          {users.length === 0 && (
            <p className="text-xs text-orange-500 mt-1">
              Belum ada HSE Officer. Tambahkan di Admin.
            </p>
          )}
        </div>
      </div>

      {/* Area Visits */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Kunjungan Area
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {areaVisits.map((visit, idx) => (
          <div key={idx} className="card p-4 border-l-4 border-l-green-400">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Area Kunjungan #{idx + 1}
                </h3>
              </div>
              {areaVisits.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setAreaVisits((p) => p.filter((_, i) => i !== idx))
                  }
                  className="btn-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Area Name */}
              <div data-err={errors[`area_${idx}`] ? "1" : undefined}>
                <label className="form-label text-xs">
                  <Building2 className="inline w-3.5 h-3.5 mr-1" />
                  Nama Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={visit.areaName ?? ""}
                  onChange={(e) => updateVisit(idx, "areaName", e.target.value)}
                  className="form-input"
                  placeholder="Contoh: Area Produksi, Gudang, Boiler Room..."
                />
                {errors[`area_${idx}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`area_${idx}`]}
                  </p>
                )}
              </div>

              {/* Work Activities */}
              <div data-err={errors[`work_${idx}`] ? "1" : undefined}>
                <label className="form-label text-xs">
                  <Activity className="inline w-3.5 h-3.5 mr-1" />
                  Kegiatan / Pekerjaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={visit.workActivities ?? ""}
                  onChange={(e) =>
                    updateVisit(idx, "workActivities", e.target.value)
                  }
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Contoh: Pemeliharaan mesin, Loading CPO, Pengelasan..."
                />
                {errors[`work_${idx}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`work_${idx}`]}
                  </p>
                )}
              </div>

              {/* Hazards */}
              <div data-err={errors[`hazard_${idx}`] ? "1" : undefined}>
                <label className="form-label text-xs">
                  Potensi Bahaya <span className="text-red-500">*</span>{" "}
                  <span className="text-gray-400 font-normal">
                    (pilih semua yang relevan)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {HAZARD_OPTIONS.map((opt) => {
                    const sel = visit.hazards?.includes(opt.value) ?? false;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleHazard(idx, opt.value)}
                        className={`text-left text-xs px-3 py-2 rounded-lg border-2 font-medium transition-all ${sel ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}
                      >
                        {sel ? "✓ " : ""}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {errors[`hazard_${idx}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`hazard_${idx}`]}
                  </p>
                )}
              </div>

              {/* Hazard Desc */}
              <div data-err={errors[`hdesc_${idx}`] ? "1" : undefined}>
                <label className="form-label text-xs">
                  Deskripsi Potensi Bahaya{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={visit.hazardDescription ?? ""}
                  onChange={(e) =>
                    updateVisit(idx, "hazardDescription", e.target.value)
                  }
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Jelaskan detail potensi bahaya yang ada..."
                />
                {errors[`hdesc_${idx}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`hdesc_${idx}`]}
                  </p>
                )}
              </div>

              {/* Socialization Desc */}
              <div data-err={errors[`sdesc_${idx}`] ? "1" : undefined}>
                <label className="form-label text-xs">
                  Deskripsi Sosialisasi yang Dilakukan{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={visit.socializationDescription ?? ""}
                  onChange={(e) =>
                    updateVisit(idx, "socializationDescription", e.target.value)
                  }
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Jelaskan materi sosialisasi K3 yang disampaikan..."
                />
                {errors[`sdesc_${idx}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`sdesc_${idx}`]}
                  </p>
                )}
              </div>

              {/* Evidence Photo — kamera saja, dengan nama personel */}
              <div data-err={errors[`photo_${idx}`] ? "1" : undefined}>
                <PhotoUpload
                  label="Foto Evidence (selfie berdua / dokumentasi)"
                  subdir={`hse/visit_${idx}`}
                  value={visit.evidencePhoto}
                  onChange={(photo) => updateVisit(idx, "evidencePhoto", photo)}
                  required
                  personelName={selectedPersonelName}
                />
                {errors[`photo_${idx}`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[`photo_${idx}`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAreaVisits((p) => [...p, emptyVisit()])}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-green-300 rounded-xl text-green-600 text-sm font-semibold hover:bg-green-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Area Kunjungan
        </button>
      </div>

      {/* Signatures */}
      <div className="card p-4 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Tanda Tangan
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SignaturePad
            label="TTD HSE Officer"
            onSave={setHseSignatureDataUrl}
            savedUrl={hseSignatureDataUrl || undefined}
          />
          <SignaturePad
            label="TTD Perwakilan Area"
            onSave={setWitnessSignatureDataUrl}
            savedUrl={witnessSignatureDataUrl || undefined}
          />
        </div>
        <p className="text-xs text-gray-400">
          * Tanda tangan opsional namun dianjurkan sebagai bukti sosialisasi
        </p>
      </div>

      {/* Error summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {Object.keys(errors).length} item belum lengkap
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Scroll ke atas untuk melengkapi semua field yang ditandai
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full btn-primary justify-center py-4 text-base bg-green-600 hover:bg-green-700"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Mengirim...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" /> Kirim Laporan HSE
          </>
        )}
      </button>
    </div>
  );
}
