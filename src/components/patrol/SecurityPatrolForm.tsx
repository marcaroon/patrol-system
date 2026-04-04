// src/components/patrol/SecurityPatrolForm.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PatrolAreaDTO, PhotoMeta } from "@/types";
import { getCurrentPosition } from "@/lib/photoUtils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import PhotoUpload from "./PhotoUpload";
import {
  User as UserIcon,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Send,
  Loader2,
  AlertCircle,
  Camera,
  Flag,
  Timer,
  X as XIcon,
  Plus,
  Trash2,
  ChevronUp,
  ImageIcon,
  Eye,
} from "lucide-react";

interface UserOpt {
  id: string;
  name: string;
}

// One finding row within a section
interface FindingRow {
  id: string; // temp client id
  status: "NO_FINDING" | "FINDING" | "";
  findingDesc: string;
  photo?: PhotoMeta;
}

interface SectionState {
  filled: boolean;
  findings: FindingRow[];
}

interface AreaVisitState {
  areaId: string;
  sections: Record<string, SectionState>;
}

const tempId = () => Math.random().toString(36).slice(2);

const emptyFinding = (): FindingRow => ({
  id: tempId(),
  status: "",
  findingDesc: "",
});

const emptySectionState = (): SectionState => ({
  filled: false,
  findings: [emptyFinding()],
});

// ── Lightbox for section reference images ─────────────────────────
function SectionRefLightbox({
  images,
  initial,
  onClose,
}: {
  images: string[];
  initial: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initial);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        >
          <XIcon className="w-4 h-4" />
        </button>
        <img
          src={images[idx]}
          alt={`Referensi ${idx + 1}`}
          className="w-full max-h-[75vh] object-contain rounded-2xl"
        />
        {images.length > 1 && (
          <div className="flex justify-center gap-3 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === idx ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
        <p className="text-center text-xs text-gray-400 mt-2">
          Gambar referensi kondisi normal – tap di luar untuk tutup
        </p>
      </div>
    </div>
  );
}

export default function SecurityPatrolForm() {
  const router = useRouter();
  const formOpenedAt = useRef<string>(new Date().toISOString());
  const [now] = useState(new Date());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [areas, setAreas] = useState<PatrolAreaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [areaVisits, setAreaVisits] = useState<AreaVisitState[]>([]);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());

  // Lightbox state for section ref images
  const [sectionLightbox, setSectionLightbox] = useState<{
    images: string[];
    initial: number;
  } | null>(null);

  const [selfiePhoto, setSelfiePhoto] = useState<PhotoMeta | undefined>(
    undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPersonelName =
    users.find((u) => u.id === selectedUserId)?.name ?? "";

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

  const getAreaById = (id: string) => areas.find((a) => a.id === id);

  const addArea = (areaId: string) => {
    if (!areaId || areaVisits.some((v) => v.areaId === areaId)) return;
    const area = getAreaById(areaId);
    if (!area) return;
    const sections: Record<string, SectionState> = {};
    area.sections.forEach((s) => {
      sections[s.id] = emptySectionState();
    });
    setAreaVisits((p) => [...p, { areaId, sections }]);
  };

  const removeArea = (areaId: string) =>
    setAreaVisits((p) => p.filter((v) => v.areaId !== areaId));

  const toggleSection = (
    areaId: string,
    sectionId: string,
    filled: boolean,
  ) => {
    setAreaVisits((prev) =>
      prev.map((v) => {
        if (v.areaId !== areaId) return v;
        return {
          ...v,
          sections: {
            ...v.sections,
            [sectionId]: filled
              ? { filled: true, findings: [emptyFinding()] }
              : emptySectionState(),
          },
        };
      }),
    );
  };

  const updateFinding = (
    areaId: string,
    sectionId: string,
    findingId: string,
    patch: Partial<FindingRow>,
  ) =>
    setAreaVisits((prev) =>
      prev.map((v) => {
        if (v.areaId !== areaId) return v;
        const sec = v.sections[sectionId];
        return {
          ...v,
          sections: {
            ...v.sections,
            [sectionId]: {
              ...sec,
              findings: sec.findings.map((f) =>
                f.id === findingId ? { ...f, ...patch } : f,
              ),
            },
          },
        };
      }),
    );

  const addFinding = (areaId: string, sectionId: string) =>
    setAreaVisits((prev) =>
      prev.map((v) => {
        if (v.areaId !== areaId) return v;
        const sec = v.sections[sectionId];
        return {
          ...v,
          sections: {
            ...v.sections,
            [sectionId]: {
              ...sec,
              findings: [...sec.findings, emptyFinding()],
            },
          },
        };
      }),
    );

  const removeFinding = (
    areaId: string,
    sectionId: string,
    findingId: string,
  ) =>
    setAreaVisits((prev) =>
      prev.map((v) => {
        if (v.areaId !== areaId) return v;
        const sec = v.sections[sectionId];
        const next = sec.findings.filter((f) => f.id !== findingId);
        return {
          ...v,
          sections: {
            ...v.sections,
            [sectionId]: {
              ...sec,
              findings: next.length > 0 ? next : [emptyFinding()],
            },
          },
        };
      }),
    );

  const toggleCollapse = (areaId: string) =>
    setCollapsedAreas((p) => {
      const n = new Set(p);
      n.has(areaId) ? n.delete(areaId) : n.add(areaId);
      return n;
    });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedUserId) errs.user = "Pilih nama security";
    if (areaVisits.length === 0) errs.areas = "Pilih minimal 1 area patrol";
    areaVisits.forEach((visit) => {
      const area = getAreaById(visit.areaId);
      const filledSections =
        area?.sections.filter((s) => visit.sections[s.id]?.filled) ?? [];
      if (filledSections.length === 0) {
        errs[`area_empty_${visit.areaId}`] =
          `${area?.name}: Isi minimal 1 bagian`;
      }
      filledSections.forEach((s) => {
        const sec = visit.sections[s.id];
        sec.findings.forEach((f, fi) => {
          const fKey = `${visit.areaId}_${s.id}_${fi}`;
          if (!f.status) errs[`status_${fKey}`] = "Pilih status";
          if (!f.photo?.url) errs[`photo_${fKey}`] = "Foto wajib";
          if (f.status === "FINDING" && !f.findingDesc.trim())
            errs[`finding_${fKey}`] = "Deskripsikan temuan";
        });
      });
    });
    if (!selfiePhoto?.url) errs.selfie = "Foto selfie penutup wajib diambil";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setTimeout(
        () =>
          document
            .querySelector("[data-err]")
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        50,
      );
      return;
    }
    setSubmitting(true);
    try {
      const apiAreaVisits = areaVisits.map((visit, idx) => {
        const area = getAreaById(visit.areaId)!;
        const sectionEntries = area.sections
          .filter((s) => visit.sections[s.id]?.filled)
          .map((s) => {
            const sec = visit.sections[s.id];
            return {
              areaSectionId: s.id,
              findings: sec.findings
                .filter((f) => f.photo?.url)
                .map((f, fi) => ({
                  status: f.status,
                  findingDescription:
                    f.status === "FINDING" ? f.findingDesc : undefined,
                  photoUrl: f.photo!.url,
                  photoTimestamp: f.photo!.timestamp,
                  photoLatitude: f.photo?.latitude,
                  photoLongitude: f.photo?.longitude,
                  order: fi,
                })),
            };
          });
        return { areaId: visit.areaId, order: idx + 1, sectionEntries };
      });

      const res = await fetch("/api/reports/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          patrolDate: format(now, "yyyy-MM-dd"),
          patrolTime: format(now, "HH:mm"),
          formOpenedAt: formOpenedAt.current,
          latitude: coords?.lat,
          longitude: coords?.lng,
          areaVisits: apiAreaVisits,
          selfiePhotoUrl: selfiePhoto?.url,
          selfiePhotoTimestamp: selfiePhoto?.timestamp,
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

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 text-sm">Memuat data...</p>
      </div>
    );

  const selectedAreaIds = new Set(areaVisits.map((v) => v.areaId));
  const availableAreas = areas.filter((a) => !selectedAreaIds.has(a.id));

  return (
    <div className="space-y-5 pb-10">
      {sectionLightbox && (
        <SectionRefLightbox
          images={sectionLightbox.images}
          initial={sectionLightbox.initial}
          onClose={() => setSectionLightbox(null)}
        />
      )}

      {/* ── Auto info ── */}
      <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100/40 border-blue-100">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Info Patroli (Otomatis)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Tanggal</p>
            <p className="font-semibold text-gray-800 text-sm">
              {format(now, "dd MMMM yyyy", { locale: localeId })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Jam Mulai</p>
            <p className="font-semibold text-gray-800 text-sm">
              {format(now, "HH:mm")} WIB
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> GPS
            </p>
            {coordsLoading ? (
              <p className="text-xs text-blue-500 animate-pulse">
                Mendapatkan lokasi...
              </p>
            ) : coords ? (
              <p className="font-semibold text-gray-800 text-sm">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-xs text-orange-500">
                ⚠ Lokasi tidak tersedia – aktifkan GPS
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Personel ── */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5" /> Personel Security
        </p>
        <div data-err={errors.user ? "1" : undefined}>
          <label className="form-label">
            Nama Security <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="form-input appearance-none pr-10"
            >
              <option value="">-- Pilih Nama Security --</option>
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
        </div>
      </div>

      {/* ── Area selector ── */}
      <div className="card p-4" data-err={errors.areas ? "1" : undefined}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Pilih Area Patrol
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Pilih satu atau lebih area yang dipatroli.
        </p>
        {availableAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {availableAreas.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addArea(a.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> {a.name}
              </button>
            ))}
          </div>
        )}
        {areaVisits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {areaVisits.map((v) => {
              const area = getAreaById(v.areaId);
              const filledCount =
                area?.sections.filter((s) => v.sections[s.id]?.filled).length ??
                0;
              return (
                <div
                  key={v.areaId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-200"
                >
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-700 text-sm font-medium">
                    {area?.name}
                  </span>
                  {filledCount > 0 && (
                    <span className="text-[11px] bg-blue-600 text-white rounded-full px-1.5">
                      {filledCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeArea(v.areaId)}
                    className="w-4 h-4 rounded-full bg-blue-300 hover:bg-red-400 flex items-center justify-center transition-colors ml-0.5"
                  >
                    <XIcon className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {errors.areas && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.areas}
          </p>
        )}
      </div>

      {/* ── Area visit cards ── */}
      {areaVisits.map((visit) => {
        const area = getAreaById(visit.areaId);
        if (!area) return null;
        const isCollapsed = collapsedAreas.has(visit.areaId);
        const filledSections = area.sections.filter(
          (s) => visit.sections[s.id]?.filled,
        );
        const hasAreaError = errors[`area_empty_${visit.areaId}`];
        const hasAreaRefImages = area.referenceImageUrl1 || area.referenceImageUrl2;

        return (
          <div
            key={visit.areaId}
            className={`card overflow-hidden border-l-4 ${
              hasAreaError
                ? "border-l-orange-400"
                : filledSections.length > 0
                  ? "border-l-blue-400"
                  : "border-l-gray-200"
            }`}
            data-err={hasAreaError ? "1" : undefined}
          >
            {/* Area header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() => toggleCollapse(visit.areaId)}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{area.name}</p>
                <p className="text-xs text-gray-500">
                  {filledSections.length === 0
                    ? "Belum ada bagian yang diisi"
                    : `${filledSections.length} dari ${area.sections.length} bagian diisi`}
                  <span className="ml-2 text-gray-400">
                    · Semua bagian opsional
                  </span>
                </p>
                {hasAreaError && (
                  <p className="text-xs text-orange-500 mt-0.5">
                    {errors[`area_empty_${visit.areaId}`]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeArea(visit.areaId);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {!isCollapsed && (
              <>
                {/* ── Area-level reference images ── */}
                {hasAreaRefImages && (
                  <div className="px-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      <p className="text-xs font-semibold text-blue-600">
                        Referensi Area{" "}
                        <span className="text-blue-400 font-normal">
                          (kondisi normal keseluruhan)
                        </span>
                      </p>
                    </div>
                    <div
                      className={`grid gap-3 ${
                        area.referenceImageUrl1 && area.referenceImageUrl2
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {[area.referenceImageUrl1, area.referenceImageUrl2]
                        .filter(Boolean)
                        .map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setSectionLightbox({
                                images: [area.referenceImageUrl1, area.referenceImageUrl2].filter(Boolean) as string[],
                                initial: i,
                              })
                            }
                            className="rounded-xl overflow-hidden border border-blue-200 bg-blue-50/30 group relative"
                          >
                            <img
                              src={url!}
                              alt={`Referensi area ${i + 1}`}
                              className="w-full object-cover group-hover:opacity-80 transition-opacity"
                              style={{ maxHeight: 180 }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-5 h-5 text-white drop-shadow-lg" />
                            </div>
                            <p className="text-center text-[10px] text-blue-500 py-1 font-medium bg-blue-50">
                              Referensi Area {i + 1}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* ── Sections ── */}
                <div className="divide-y divide-gray-50">
                  {area.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => {
                      const st =
                        visit.sections[section.id] ?? emptySectionState();
                      const isFilled = st.filled;
                      const hasSectionRefImages =
                        section.referenceImageUrl1 || section.referenceImageUrl2;
                      const sectionRefImageList = [
                        section.referenceImageUrl1,
                        section.referenceImageUrl2,
                      ].filter(Boolean) as string[];

                      return (
                        <div
                          key={section.id}
                          className={`p-4 transition-colors ${isFilled ? "bg-blue-50/30" : "bg-white"}`}
                        >
                          {/* Section toggle header */}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSection(
                                  visit.areaId,
                                  section.id,
                                  !isFilled,
                                )
                              }
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isFilled
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300 hover:border-blue-400"
                              }`}
                            >
                              {isFilled && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  isFilled ? "text-gray-800" : "text-gray-500"
                                }`}
                              >
                                {section.name}
                              </p>
                              {section.description && (
                                <p className="text-xs text-gray-400">
                                  {section.description}
                                </p>
                              )}
                            </div>

                            {/* Section ref image thumbnails + tap to expand */}
                            {/* {hasSectionRefImages && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSectionLightbox({
                                    images: sectionRefImageList,
                                    initial: 0,
                                  })
                                }
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex-shrink-0"
                              >
                                {sectionRefImageList.slice(0, 2).map((url, i) => (
                                  <img
                                    key={i}
                                    src={url}
                                    alt=""
                                    className="w-7 h-7 object-cover rounded border border-blue-200"
                                  />
                                ))}
                                <Eye className="w-3.5 h-3.5 text-blue-500 ml-0.5" />
                              </button>
                            )} */}

                            {!isFilled && !hasSectionRefImages && (
                              <span className="text-[11px] text-gray-400 italic flex-shrink-0">
                                Klik untuk isi
                              </span>
                            )}
                          </div>

                          {/* Section-level reference images strip (shown when section is filled) */}
                          {isFilled && hasSectionRefImages && (
                            <div className="mt-3 pl-8">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                {/* <ImageIcon className="w-3 h-3 text-blue-400" /> */}
                                {/* <p className="text-[11px] font-semibold text-blue-500">
                                  Referensi kondisi normal bagian ini
                                </p> */}
                              </div>
                              <div
                                className={`grid gap-2 ${
                                  sectionRefImageList.length > 1
                                    ? "grid-cols-2"
                                    : "grid-cols-1"
                                }`}
                              >
                                {sectionRefImageList.map((url, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() =>
                                      setSectionLightbox({
                                        images: sectionRefImageList,
                                        initial: i,
                                      })
                                    }
                                    className="rounded-xl overflow-hidden border border-blue-200 bg-blue-50/40 group relative"
                                  >
                                    <img
                                      src={url}
                                      alt={`Referensi ${i + 1}`}
                                      className="w-full h-56 object-cover group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Eye className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                    {/* <p className="text-center text-[10px] text-blue-500 py-1 font-medium bg-blue-50">
                                      Referensi {i + 1}
                                    </p> */}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section content: multiple findings */}
                          {isFilled && (
                            <div className="mt-3 pl-8 space-y-4">
                              {st.findings.map((finding, fi) => {
                                const fKey = `${visit.areaId}_${section.id}_${fi}`;
                                const hasErr =
                                  errors[`status_${fKey}`] ||
                                  errors[`photo_${fKey}`] ||
                                  errors[`finding_${fKey}`];
                                const isFirst = fi === 0;
                                const canDelete = st.findings.length > 1;

                                return (
                                  <div
                                    key={finding.id}
                                    className={`rounded-xl border p-3 space-y-3 ${
                                      hasErr
                                        ? "border-red-200 bg-red-50/30"
                                        : "border-gray-200 bg-white"
                                    }`}
                                    data-err={hasErr ? "1" : undefined}
                                  >
                                    {/* Finding header */}
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {isFirst
                                          ? "Hasil Inspeksi"
                                          : `Temuan Tambahan #${fi + 1}`}
                                      </p>
                                      {canDelete && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFinding(
                                              visit.areaId,
                                              section.id,
                                              finding.id,
                                            )
                                          }
                                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-medium transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" /> Hapus
                                        </button>
                                      )}
                                    </div>

                                    {/* Status */}
                                    <div>
                                      <label className="form-label text-xs">
                                        Status{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateFinding(
                                              visit.areaId,
                                              section.id,
                                              finding.id,
                                              { status: "NO_FINDING" },
                                            )
                                          }
                                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                                            finding.status === "NO_FINDING"
                                              ? "border-green-500 bg-green-50 text-green-700"
                                              : "border-gray-200 text-gray-500 hover:border-green-300"
                                          }`}
                                        >
                                          <CheckCircle className="w-4 h-4" />{" "}
                                          Tidak Ada Temuan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateFinding(
                                              visit.areaId,
                                              section.id,
                                              finding.id,
                                              { status: "FINDING" },
                                            )
                                          }
                                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                                            finding.status === "FINDING"
                                              ? "border-red-500 bg-red-50 text-red-700"
                                              : "border-gray-200 text-gray-500 hover:border-red-300"
                                          }`}
                                        >
                                          <AlertTriangle className="w-4 h-4" />{" "}
                                          Ada Temuan
                                        </button>
                                      </div>
                                      {errors[`status_${fKey}`] && (
                                        <p className="text-xs text-red-500 mt-1">
                                          {errors[`status_${fKey}`]}
                                        </p>
                                      )}
                                    </div>

                                    {/* Finding description (only if FINDING) */}
                                    {finding.status === "FINDING" && (
                                      <div>
                                        <label className="form-label text-xs">
                                          Deskripsi Temuan{" "}
                                          <span className="text-red-500">
                                            *
                                          </span>
                                        </label>
                                        <textarea
                                          value={finding.findingDesc}
                                          onChange={(e) =>
                                            updateFinding(
                                              visit.areaId,
                                              section.id,
                                              finding.id,
                                              { findingDesc: e.target.value },
                                            )
                                          }
                                          rows={2}
                                          className="form-input resize-none"
                                          placeholder="Jelaskan temuan..."
                                        />
                                        {errors[`finding_${fKey}`] && (
                                          <p className="text-xs text-red-500 mt-1">
                                            {errors[`finding_${fKey}`]}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Photo */}
                                    <PhotoUpload
                                      label="Foto Kondisi"
                                      subdir={`security/${area.code.toLowerCase()}`}
                                      value={finding.photo}
                                      onChange={(photo) =>
                                        updateFinding(
                                          visit.areaId,
                                          section.id,
                                          finding.id,
                                          { photo },
                                        )
                                      }
                                      required
                                      personelName={selectedPersonelName}
                                    />
                                    {errors[`photo_${fKey}`] && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {errors[`photo_${fKey}`]}
                                      </p>
                                    )}

                                    {/* Timestamp badge */}
                                    {finding.photo?.timestamp && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-mono font-semibold text-blue-600">
                                          <Clock className="w-2.5 h-2.5" />
                                          {format(
                                            new Date(finding.photo.timestamp),
                                            "HH:mm:ss",
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add another finding button */}
                              <button
                                type="button"
                                onClick={() =>
                                  addFinding(visit.areaId, section.id)
                                }
                                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Tambah Temuan /
                                Foto
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ── Selfie penutup ── */}
      {areaVisits.length > 0 && (
        <>
          <div className="h-px bg-gray-200" />
          <div
            data-err={errors.selfie ? "1" : undefined}
            className={`card p-4 border-l-4 ${
              selfiePhoto?.url
                ? "border-l-blue-500 bg-blue-50/30"
                : "border-l-gray-300"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selfiePhoto?.url ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                {selfiePhoto?.url ? (
                  <Flag className="w-5 h-5 text-blue-600" />
                ) : (
                  <Camera className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800">
                    Foto Selfie Penutup
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                    Wajib
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Ambil foto selfie sebagai tanda selesai patrol. Waktu foto ini
                  menjadi{" "}
                  <strong className="text-gray-700">timestamp akhir</strong>{" "}
                  laporan.
                </p>
              </div>
              {selfiePhoto?.timestamp && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 flex-shrink-0">
                  <Flag className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">
                    {format(new Date(selfiePhoto.timestamp), "HH:mm:ss")}
                  </span>
                </div>
              )}
            </div>
            <PhotoUpload
              label=""
              subdir="security/selfie"
              value={selfiePhoto}
              onChange={setSelfiePhoto}
              required
              personelName={selectedPersonelName}
            />
            {errors.selfie && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.selfie}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Error summary ── */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {Object.keys(errors).length} item belum lengkap
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Scroll ke atas untuk melengkapi semua yang ditandai
            </p>
          </div>
        </div>
      )}

      {/* ── Submit ── */}
      {areaVisits.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full btn-primary justify-center py-4 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" /> Kirim Laporan Patrol
            </>
          )}
        </button>
      )}
    </div>
  );
}
