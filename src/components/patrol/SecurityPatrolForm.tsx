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
  ChevronDown,
  ImageIcon,
  Eye,
  Search,
} from "lucide-react";
import ReactDOM from "react-dom";

interface UserOpt {
  id: string;
  name: string;
}

interface FindingRow {
  id: string;
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

interface SecurityPatrolFormProps {
  prefillUserId?: string;
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

function AreaSearchDropdown({
  areas,
  selectedId,
  onSelect,
  hasError,
}: {
  areas: PatrolAreaDTO[];
  selectedId: string;
  onSelect: (id: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selected = areas.find((a) => a.id === selectedId);
  const filtered = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()),
  );

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = Math.min(320, filtered.length * 56 + 60);

    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: viewportHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  const handleOpen = () => {
    updateDropdownPosition();
    setOpen((p) => !p);
    setSearch("");
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => updateDropdownPosition();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, filtered.length]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
          hasError
            ? "border-red-300 bg-red-50"
            : open
              ? "border-blue-400 bg-blue-50/30"
              : selected
                ? "border-blue-200 bg-blue-50/20"
                : "border-gray-200 bg-white hover:border-blue-300"
        }`}
      >
        <MapPin
          className={`w-4 h-4 flex-shrink-0 ${selected ? "text-blue-600" : "text-gray-400"}`}
        />
        <span
          className={`flex-1 text-sm font-medium ${selected ? "text-gray-800" : "text-gray-400"}`}
        >
          {selected ? selected.name : "-- Pilih Area Patrol --"}
        </span>
        {selected && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-600 flex-shrink-0">
            {selected.code}
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {open &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau kode area..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  style={{ WebkitUserSelect: "text", userSelect: "text" }}
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Tidak ada area ditemukan
                </p>
              ) : (
                filtered.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(area.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      area.id === selectedId
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 flex-shrink-0 ${area.id === selectedId ? "text-blue-600" : "text-gray-400"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${area.id === selectedId ? "text-blue-700" : "text-gray-800"}`}
                      >
                        {area.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {area.sections.length} bagian
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                      {area.code}
                    </span>
                    {area.id === selectedId && (
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

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

export default function SecurityPatrolForm({
  prefillUserId,
}: SecurityPatrolFormProps) {
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
  const [selectedUserId] = useState(prefillUserId ?? "");

  // Single area visit (instead of array)
  const [areaVisit, setAreaVisit] = useState<AreaVisitState | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");

  // Lightbox state
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

  // When area is selected, build initial section state
  const handleSelectArea = (areaId: string) => {
    if (!areaId) {
      setSelectedAreaId("");
      setAreaVisit(null);
      return;
    }
    const area = getAreaById(areaId);
    if (!area) return;

    // If same area, keep existing state
    if (areaId === selectedAreaId && areaVisit) {
      return;
    }

    const sections: Record<string, SectionState> = {};
    area.sections.forEach((s) => {
      sections[s.id] = emptySectionState();
    });
    setSelectedAreaId(areaId);
    setAreaVisit({ areaId, sections });
    // Clear errors related to area
    setErrors((prev) => {
      const next = { ...prev };
      delete next.area;
      return next;
    });
  };

  const toggleSection = (sectionId: string, filled: boolean) => {
    setAreaVisit((prev) => {
      if (!prev) return prev;
      const existing = prev.sections[sectionId];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: filled
            ? {
                filled: true,
                findings:
                  existing?.findings?.length > 0
                    ? existing.findings
                    : [emptyFinding()],
              }
            : { ...existing, filled: false },
        },
      };
    });
  };

  const updateFinding = (
    sectionId: string,
    findingId: string,
    patch: Partial<FindingRow>,
  ) =>
    setAreaVisit((prev) => {
      if (!prev) return prev;
      const sec = prev.sections[sectionId];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...sec,
            findings: sec.findings.map((f) =>
              f.id === findingId ? { ...f, ...patch } : f,
            ),
          },
        },
      };
    });

  const addFinding = (sectionId: string) =>
    setAreaVisit((prev) => {
      if (!prev) return prev;
      const sec = prev.sections[sectionId];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...sec,
            findings: [...sec.findings, emptyFinding()],
          },
        },
      };
    });

  const removeFinding = (sectionId: string, findingId: string) =>
    setAreaVisit((prev) => {
      if (!prev) return prev;
      const sec = prev.sections[sectionId];
      const next = sec.findings.filter((f) => f.id !== findingId);
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...sec,
            findings: next.length > 0 ? next : [emptyFinding()],
          },
        },
      };
    });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedAreaId || !areaVisit) {
      errs.area = "Pilih area patrol terlebih dahulu";
    } else {
      const area = getAreaById(areaVisit.areaId);
      const filledSections =
        area?.sections.filter((s) => areaVisit.sections[s.id]?.filled) ?? [];
      if (filledSections.length === 0) {
        errs.area_empty = "Isi minimal 1 bagian pada area yang dipilih";
      }
      filledSections.forEach((s) => {
        const sec = areaVisit.sections[s.id];
        sec.findings.forEach((f, fi) => {
          const fKey = `${s.id}_${fi}`;
          if (!f.status) errs[`status_${fKey}`] = "Pilih status";
          if (!f.photo?.url) errs[`photo_${fKey}`] = "Foto wajib";
          if (f.status === "FINDING" && !f.findingDesc.trim())
            errs[`finding_${fKey}`] = "Deskripsikan catatan";
        });
      });
    }
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
      const area = getAreaById(areaVisit!.areaId)!;
      const sectionEntries = area.sections
        .filter((s) => areaVisit!.sections[s.id]?.filled)
        .map((s) => {
          const sec = areaVisit!.sections[s.id];
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

      const apiAreaVisits = [
        { areaId: areaVisit!.areaId, order: 1, sectionEntries },
      ];

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

  const currentArea = areaVisit ? getAreaById(areaVisit.areaId) : null;

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
          <Clock className="w-3.5 h-3.5" /> Info Patroli
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
        {prefillUserId && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
              {users.find((u) => u.id === prefillUserId)?.name?.[0] ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {users.find((u) => u.id === prefillUserId)?.name ??
                  "Loading..."}
              </p>
              <p className="text-xs text-blue-500">Security Officer</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Area Selector (Single, Searchable Dropdown) ── */}
      <div className="card p-4" data-err={errors.area ? "1" : undefined}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Pilih Area Patrol
        </p>
        <AreaSearchDropdown
          areas={areas}
          selectedId={selectedAreaId}
          onSelect={handleSelectArea}
          hasError={!!errors.area}
        />
        {errors.area && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.area}
          </p>
        )}
        {errors.area_empty && (
          <p
            className="text-xs text-orange-500 mt-2 flex items-center gap-1"
            data-err="1"
          >
            <AlertCircle className="w-3 h-3" />
            {errors.area_empty}
          </p>
        )}
      </div>

      {/* ── Area Detail Card ── */}
      {areaVisit && currentArea && (
        <div className="card overflow-hidden border-l-4 border-l-blue-400">
          {/* Area header */}
          <div className="flex items-center gap-3 p-4 bg-blue-50/40 border-b border-blue-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">
                {currentArea.name}
              </p>
              <p className="text-xs text-gray-500">
                {(() => {
                  const filledCount = currentArea.sections.filter(
                    (s) => areaVisit.sections[s.id]?.filled,
                  ).length;
                  return filledCount === 0
                    ? "Belum ada bagian yang diisi"
                    : `${filledCount} dari ${currentArea.sections.length} bagian diisi`;
                })()}
                <span className="ml-2 text-gray-400">
                  · Semua bagian opsional
                </span>
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded-lg bg-blue-100 text-blue-600 font-semibold flex-shrink-0">
              {currentArea.code}
            </span>
          </div>

          {/* Area-level reference images */}
          {(currentArea.referenceImageUrl1 ||
            currentArea.referenceImageUrl2) && (
            <div className="px-4 py-3 border-b border-gray-100">
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
                  currentArea.referenceImageUrl1 &&
                  currentArea.referenceImageUrl2
                    ? "grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {[
                  currentArea.referenceImageUrl1,
                  currentArea.referenceImageUrl2,
                ]
                  .filter(Boolean)
                  .map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setSectionLightbox({
                          images: [
                            currentArea.referenceImageUrl1,
                            currentArea.referenceImageUrl2,
                          ].filter(Boolean) as string[],
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
            {currentArea.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                const st =
                  areaVisit.sections[section.id] ?? emptySectionState();
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
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id, !isFilled)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
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
                          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2">
                            <p className="text-xs text-amber-700 leading-relaxed">
                              {section.description}
                            </p>
                          </div>
                        )}
                      </div>
                      {!isFilled &&
                        !hasSectionRefImages &&
                        !section.description && (
                          <span className="text-[11px] text-gray-400 italic flex-shrink-0 mt-0.5">
                            Klik untuk isi
                          </span>
                        )}
                    </div>

                    {/* Section reference images (when filled) */}
                    {isFilled && hasSectionRefImages && (
                      <div className="mt-3 pl-8">
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
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section content: multiple findings */}
                    {isFilled && (
                      <div className="mt-3 pl-8 space-y-4">
                        {st.findings.map((finding, fi) => {
                          const fKey = `${section.id}_${fi}`;
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
                                    : `Catatan Tambahan #${fi + 1}`}
                                </p>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFinding(section.id, finding.id)
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
                                  Status <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateFinding(section.id, finding.id, {
                                        status: "NO_FINDING",
                                      })
                                    }
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                                      finding.status === "NO_FINDING"
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-gray-200 text-gray-500 hover:border-green-300"
                                    }`}
                                  >
                                    <CheckCircle className="w-4 h-4" /> Tidak
                                    Ada Catatan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateFinding(section.id, finding.id, {
                                        status: "FINDING",
                                      })
                                    }
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                                      finding.status === "FINDING"
                                        ? "border-red-500 bg-red-50 text-red-700"
                                        : "border-gray-200 text-gray-500 hover:border-red-300"
                                    }`}
                                  >
                                    <AlertTriangle className="w-4 h-4" /> Ada
                                    Catatan / Temuan
                                  </button>
                                </div>
                                {errors[`status_${fKey}`] && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {errors[`status_${fKey}`]}
                                  </p>
                                )}
                              </div>

                              {/* Finding description */}
                              {finding.status === "FINDING" && (
                                <div>
                                  <label className="form-label text-xs">
                                    Deskripsi Catatan / Temuan{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    value={finding.findingDesc}
                                    onChange={(e) =>
                                      updateFinding(section.id, finding.id, {
                                        findingDesc: e.target.value,
                                      })
                                    }
                                    rows={2}
                                    className="form-input resize-none"
                                    placeholder="Jelaskan catatan / temuan..."
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
                                subdir={`security/${currentArea.code.toLowerCase()}`}
                                value={finding.photo}
                                onChange={(photo) =>
                                  updateFinding(section.id, finding.id, {
                                    photo,
                                  })
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
                          onClick={() => addFinding(section.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Catatan /
                          Temuan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {areaVisit && (
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
                  Ambil foto selfie sebagai tanda selesai patrol.
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

      {areaVisit && (
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
