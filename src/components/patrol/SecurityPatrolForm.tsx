// src/components/patrol/SecurityPatrolForm.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PatrolAreaDTO, PhotoMeta } from "@/types";
import { getCurrentPosition, formatTimestamp } from "@/lib/photoUtils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import PhotoUpload from "./PhotoUpload";
import {
  User as UserIcon, MapPin, Clock, CheckCircle, AlertTriangle,
  ChevronDown, Send, Loader2, AlertCircle,
} from "lucide-react";

interface UserOpt { id: string; name: string; }

interface ChecklistState {
  status: "NO_FINDING" | "FINDING" | "";
  photo?: PhotoMeta;
  findingDesc: string;
}

export default function SecurityPatrolForm() {
  const router = useRouter();
  const [now] = useState(new Date());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [areas, setAreas] = useState<PatrolAreaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedArea, setSelectedArea] = useState<PatrolAreaDTO | null>(null);
  const [checklist, setChecklist] = useState<Record<string, ChecklistState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/users?division=SECURITY&active=true").then((r) => r.json()),
      fetch("/api/areas?active=true").then((r) => r.json()),
    ]).then(([u, a]) => {
      setUsers(u);
      setAreas(a);
      setLoading(false);
    });
    getCurrentPosition().then((p) => {
      if (p) setCoords({ lat: p.latitude, lng: p.longitude });
      setCoordsLoading(false);
    });
  }, []);

  const handleAreaChange = (areaId: string) => {
    const area = areas.find((a) => a.id === areaId) ?? null;
    setSelectedArea(area);
    const init: Record<string, ChecklistState> = {};
    area?.checklistItems.forEach((item) => { init[item.id] = { status: "", findingDesc: "" }; });
    setChecklist(init);
    setErrors({});
  };

  const setStatus = (itemId: string, status: "NO_FINDING" | "FINDING") =>
    setChecklist((prev) => ({ ...prev, [itemId]: { ...prev[itemId], status } }));

  const setPhoto = (itemId: string, photo: PhotoMeta) =>
    setChecklist((prev) => ({ ...prev, [itemId]: { ...prev[itemId], photo } }));

  const setFinding = (itemId: string, desc: string) =>
    setChecklist((prev) => ({ ...prev, [itemId]: { ...prev[itemId], findingDesc: desc } }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedUserId) errs.user = "Pilih nama security";
    if (!selectedArea) errs.area = "Pilih area patrol";
    selectedArea?.checklistItems.forEach((item) => {
      const e = checklist[item.id];
      if (!e?.status) errs[`s_${item.id}`] = "Wajib pilih status";
      if (!e?.photo?.url) errs[`p_${item.id}`] = "Foto wajib diisi";
      if (e?.status === "FINDING" && !e.findingDesc.trim()) errs[`f_${item.id}`] = "Deskripsikan temuan";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      document.querySelector("[data-err]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const entries = selectedArea!.checklistItems.map((item) => {
        const e = checklist[item.id];
        return {
          checklistItemId: item.id,
          status: e.status,
          findingDescription: e.status === "FINDING" ? e.findingDesc : undefined,
          photoUrl: e.photo!.url,
          photoTimestamp: e.photo!.timestamp,
          photoLatitude: e.photo?.latitude,
          photoLongitude: e.photo?.longitude,
        };
      });

      const res = await fetch("/api/reports/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          areaId: selectedArea!.id,
          patrolDate: format(now, "yyyy-MM-dd"),
          patrolTime: format(now, "HH:mm"),
          latitude: coords?.lat,
          longitude: coords?.lng,
          checklist: entries,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? "Submit failed");
      router.push("/patrol/success?type=SECURITY");
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
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 text-sm">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Auto info */}
      <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100/40 border-blue-100">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Info Patroli (Otomatis)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Tanggal</p>
            <p className="font-semibold text-gray-800 text-sm">{format(now, "dd MMMM yyyy", { locale: localeId })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Jam Mulai</p>
            <p className="font-semibold text-gray-800 text-sm">{format(now, "HH:mm")} WIB</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS</p>
            {coordsLoading ? (
              <p className="text-xs text-blue-500 animate-pulse">Mendapatkan lokasi...</p>
            ) : coords ? (
              <p className="font-semibold text-gray-800 text-sm">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
            ) : (
              <p className="text-xs text-orange-500">⚠ Lokasi tidak tersedia – aktifkan GPS</p>
            )}
          </div>
        </div>
      </div>

      {/* User */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5" /> Personel Security
        </p>
        <div data-err={errors.user ? "1" : undefined}>
          <label className="form-label">Nama Security <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="form-input appearance-none pr-10">
              <option value="">-- Pilih Nama Security --</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.user && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.user}</p>}
          {!loading && users.length === 0 && <p className="text-xs text-orange-500 mt-1">Belum ada personel Security. Tambahkan di Admin.</p>}
        </div>
      </div>

      {/* Area */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Area Patrol
        </p>
        <div data-err={errors.area ? "1" : undefined}>
          <label className="form-label">Pilih Area <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={selectedArea?.id ?? ""} onChange={(e) => handleAreaChange(e.target.value)} className="form-input appearance-none pr-10">
              <option value="">-- Pilih Area Patrol --</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.area && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.area}</p>}
        </div>
      </div>

      {/* Checklist */}
      {selectedArea && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist – {selectedArea.name}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {selectedArea.checklistItems.sort((a, b) => a.order - b.order).map((item, idx) => {
            const e = checklist[item.id] ?? { status: "", findingDesc: "" };
            const hasErr = errors[`s_${item.id}`] || errors[`p_${item.id}`] || errors[`f_${item.id}`];
            return (
              <div key={item.id} data-err={hasErr ? "1" : undefined}
                className={`card p-4 border-l-4 transition-all ${e.status === "FINDING" ? "border-l-red-400" : e.status === "NO_FINDING" ? "border-l-green-400" : "border-l-gray-200"}`}>
                <div className="flex items-start gap-2 mb-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{item.label}</p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-3">
                  <label className="form-label text-xs">Status <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStatus(item.id, "NO_FINDING")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${e.status === "NO_FINDING" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-green-300"}`}>
                      <CheckCircle className="w-4 h-4" /> Tidak Ada Temuan
                    </button>
                    <button type="button" onClick={() => setStatus(item.id, "FINDING")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${e.status === "FINDING" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500 hover:border-red-300"}`}>
                      <AlertTriangle className="w-4 h-4" /> Ada Temuan
                    </button>
                  </div>
                  {errors[`s_${item.id}`] && <p className="text-xs text-red-500 mt-1">{errors[`s_${item.id}`]}</p>}
                </div>

                {/* Finding desc */}
                {e.status === "FINDING" && (
                  <div className="mb-3">
                    <label className="form-label text-xs">Deskripsi Temuan & Tindak Lanjut <span className="text-red-500">*</span></label>
                    <textarea value={e.findingDesc} onChange={(ev) => setFinding(item.id, ev.target.value)}
                      rows={3} className="form-input resize-none"
                      placeholder="Jelaskan temuan dan tindak lanjut yang dilakukan..." />
                    {errors[`f_${item.id}`] && <p className="text-xs text-red-500 mt-1">{errors[`f_${item.id}`]}</p>}
                  </div>
                )}

                {/* Photo */}
                <PhotoUpload
                  label="Foto Kondisi"
                  subdir={`security/${selectedArea.code.toLowerCase()}`}
                  value={e.photo}
                  onChange={(photo) => setPhoto(item.id, photo)}
                  required
                />
                {errors[`p_${item.id}`] && <p className="text-xs text-red-500 mt-1">{errors[`p_${item.id}`]}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Error summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{Object.keys(errors).length} item belum lengkap</p>
            <p className="text-xs text-red-500 mt-0.5">Scroll ke atas untuk melengkapi semua field yang ditandai</p>
          </div>
        </div>
      )}

      {/* Submit */}
      {selectedArea && (
        <button type="button" onClick={handleSubmit} disabled={submitting} className="w-full btn-primary justify-center py-4 text-base">
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...</> : <><Send className="w-5 h-5" /> Kirim Laporan Patrol</>}
        </button>
      )}
    </div>
  );
}
