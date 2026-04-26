// src/app/admin/security/areas/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ImagePlus,
  Eye,
  Layers,
  ImageIcon,
  FileText,
} from "lucide-react";

interface SectionForm {
  tempId: string;
  name: string;
  description: string;
  refImg1: RefImageSlot;
  refImg2: RefImageSlot;
}

interface RefImageSlot {
  file?: File;
  preview?: string;
  url: string;
  uploading?: boolean;
}

interface Area {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  referenceImageUrl1?: string | null;
  referenceImageUrl2?: string | null;
  sections: {
    id: string;
    order: number;
    name: string;
    description?: string | null;
    referenceImageUrl1?: string | null;
    referenceImageUrl2?: string | null;
  }[];
}

const uid = () => Math.random().toString(36).slice(2);
const emptySlot = (): RefImageSlot => ({ url: "" });

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </button>
        <img
          src={src}
          alt="Referensi"
          className="w-full max-h-[80vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}

function RefImageUpload({
  label,
  slot,
  onChange,
  accentColor = "blue",
}: {
  label: string;
  slot: RefImageSlot;
  onChange: (patch: Partial<RefImageSlot>) => void;
  accentColor?: "blue" | "green";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState(false);
  const src = slot.preview || slot.url || null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (slot.preview) URL.revokeObjectURL(slot.preview);
    onChange({ file, preview: URL.createObjectURL(file), url: "" });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (slot.preview) URL.revokeObjectURL(slot.preview);
    onChange({ file: undefined, preview: undefined, url: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const hoverBorder =
    accentColor === "blue"
      ? "hover:border-blue-500/50 hover:bg-blue-500/5"
      : "hover:border-green-500/50 hover:bg-green-500/5";

  if (src) {
    return (
      <>
        {lightbox && <Lightbox src={src} onClose={() => setLightbox(false)} />}
        <div className="relative rounded-xl overflow-hidden border border-white/20 group">
          <img src={src} alt={label} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(true);
              }}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center"
            >
              <Eye className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="w-8 h-8 rounded-lg bg-red-500/70 hover:bg-red-500 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          {slot.uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
          <p className="text-center text-[10px] text-gray-400 py-1 bg-black/40 absolute bottom-0 w-full">
            {label}
          </p>
        </div>
      </>
    );
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className={`w-full h-28 rounded-xl border-2 border-dashed border-white/20 ${hoverBorder} flex flex-col items-center justify-center cursor-pointer transition-colors gap-1.5`}
    >
      <ImagePlus className="w-4 h-4 text-gray-500" />
      <p className="text-[11px] text-gray-500 text-center px-2">
        {label} (opsional)
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
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

function SectionRefImages({
  section,
  onChange,
}: {
  section: SectionForm;
  onChange: (patch: Partial<SectionForm>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasImages = !!(
    section.refImg1.url ||
    section.refImg1.preview ||
    section.refImg2.url ||
    section.refImg2.preview
  );

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
          hasImages ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        <ImageIcon className="w-3 h-3" />
        {hasImages ? "Gambar referensi tersimpan" : "Tambah gambar referensi"}
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <RefImageUpload
            label="Ref. Bagian 1"
            slot={section.refImg1}
            accentColor="blue"
            onChange={(p) =>
              onChange({ refImg1: { ...section.refImg1, ...p } })
            }
          />
          <RefImageUpload
            label="Ref. Bagian 2"
            slot={section.refImg2}
            accentColor="blue"
            onChange={(p) =>
              onChange({ refImg2: { ...section.refImg2, ...p } })
            }
          />
        </div>
      )}
    </div>
  );
}

export default function SecurityAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSections, setFormSections] = useState<SectionForm[]>([]);
  const [areaRefImg1, setAreaRefImg1] = useState<RefImageSlot>(emptySlot());
  const [areaRefImg2, setAreaRefImg2] = useState<RefImageSlot>(emptySlot());
  const [newSectionName, setNewSectionName] = useState("");
  const [formError, setFormError] = useState("");
  const [session, setSession] = useState<{ role: string } | null>(null);

  const load = () =>
    fetch("/api/areas?active=false")
      .then((r) => r.json())
      .then((d) => {
        setAreas(d);
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSession({ role: d.role }))
      .catch(() => {});
  }, []);

  const canEdit =
    session?.role === "SUPER_ADMIN" || session?.role === "SECURITY_ADMIN";

  const cleanupSlot = (slot: RefImageSlot) => {
    if (slot.preview) URL.revokeObjectURL(slot.preview);
  };

  const cleanupSections = (sections: SectionForm[]) => {
    sections.forEach((s) => {
      cleanupSlot(s.refImg1);
      cleanupSlot(s.refImg2);
    });
  };

  const makeDefaultSections = (): SectionForm[] => [];

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormSections(makeDefaultSections());
    setAreaRefImg1(emptySlot());
    setAreaRefImg2(emptySlot());
    setNewSectionName("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (a: Area) => {
    setEditingId(a.id);
    setFormName(a.name);
    setFormCode(a.code);
    setFormSections(
      a.sections
        .sort((x, y) => x.order - y.order)
        .map((s) => ({
          tempId: s.id,
          name: s.name,
          description: s.description ?? "",
          refImg1: { url: s.referenceImageUrl1 ?? "" },
          refImg2: { url: s.referenceImageUrl2 ?? "" },
        })),
    );
    setAreaRefImg1({ url: a.referenceImageUrl1 ?? "" });
    setAreaRefImg2({ url: a.referenceImageUrl2 ?? "" });
    setNewSectionName("");
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    cleanupSlot(areaRefImg1);
    cleanupSlot(areaRefImg2);
    cleanupSections(formSections);
    setShowForm(false);
  };

  const addSection = () => {
    if (!newSectionName.trim()) return;
    setFormSections((p) => [
      ...p,
      {
        tempId: uid(),
        name: newSectionName.trim(),
        description: "",
        refImg1: emptySlot(),
        refImg2: emptySlot(),
      },
    ]);
    setNewSectionName("");
  };

  const removeSection = (tid: string) => {
    const s = formSections.find((x) => x.tempId === tid);
    if (s) {
      cleanupSlot(s.refImg1);
      cleanupSlot(s.refImg2);
    }
    setFormSections((p) => p.filter((i) => i.tempId !== tid));
  };

  const updateSection = (tid: string, patch: Partial<SectionForm>) =>
    setFormSections((p) =>
      p.map((s) => (s.tempId === tid ? { ...s, ...patch } : s)),
    );

  const uploadRefSlot = async (slot: RefImageSlot): Promise<string> => {
    if (!slot.file) return slot.url;
    return await uploadToCloudinary(slot.file, "patrol/area-refs");
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Nama area wajib diisi");
      return;
    }
    if (!formCode.trim()) {
      setFormError("Kode area wajib diisi");
      return;
    }
    if (formSections.length === 0) {
      setFormError("Minimal 1 bagian");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const [aUrl1, aUrl2] = await Promise.all([
        uploadRefSlot(areaRefImg1),
        uploadRefSlot(areaRefImg2),
      ]);

      const sectionsWithUrls = await Promise.all(
        formSections.map(async (s) => {
          const [sUrl1, sUrl2] = await Promise.all([
            uploadRefSlot(s.refImg1),
            uploadRefSlot(s.refImg2),
          ]);
          return {
            tempId: s.tempId,
            name: s.name,
            description: s.description.trim() || undefined,
            referenceImageUrl1: sUrl1 || null,
            referenceImageUrl2: sUrl2 || null,
          };
        }),
      );

      const body = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        referenceImageUrl1: aUrl1 || null,
        referenceImageUrl2: aUrl2 || null,
        sections: sectionsWithUrls,
      };

      const res = editingId
        ? await fetch(`/api/areas/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/areas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error ?? "Gagal menyimpan");
        return;
      }
      cleanupSlot(areaRefImg1);
      cleanupSlot(areaRefImg2);
      cleanupSections(formSections);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Area) => {
    await fetch(`/api/areas/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    load();
  };

  const handleDelete = async (a: Area) => {
    if (!confirm(`Hapus area "${a.name}"?`)) return;
    await fetch(`/api/areas/${a.id}`, { method: "DELETE" });
    load();
  };

  const countSectionImages = (s: Area["sections"][0]) =>
    [s.referenceImageUrl1, s.referenceImageUrl2].filter(Boolean).length;

  return (
    <AdminShell
      requiredRoles={[
        "SUPER_ADMIN",
        "VIEWER",
        "SECURITY_ADMIN",
        "SECURITY_VIEWER",
      ]}
    >
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">
              Area Patrol Security
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola area, bagian, dan gambar referensi
            </p>
          </div>
          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Area
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {editingId ? "Edit Area" : "Tambah Area Baru"}
              </h2>
              <button
                onClick={closeForm}
                className="w-8 h-8 rounded-lg bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Nama Area <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input-dark"
                  placeholder="KCP (Kernel Crushing Plant)"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Kode Area <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="form-input-dark uppercase"
                  placeholder="KCP"
                />
              </div>
            </div>

            {/* Area-level reference images */}
            <div>
              <label className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Gambar Referensi Area (tampilan umum, maks. 2)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <RefImageUpload
                  label="Ref. Area 1"
                  slot={areaRefImg1}
                  accentColor="blue"
                  onChange={(p) =>
                    setAreaRefImg1((prev) => ({ ...prev, ...p }))
                  }
                />
                <RefImageUpload
                  label="Ref. Area 2"
                  slot={areaRefImg2}
                  accentColor="blue"
                  onChange={(p) =>
                    setAreaRefImg2((prev) => ({ ...prev, ...p }))
                  }
                />
              </div>
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">
                  Bagian{" "}
                  <span className="text-gray-500">
                    ({formSections.length} bagian)
                  </span>
                </label>
                <p className="text-[11px] text-gray-600 italic">
                  Tiap bagian bisa punya deskripsi & gambar referensi tersendiri
                </p>
              </div>

              <div className="space-y-2 mb-3 max-h-[600px] overflow-y-auto pr-1">
                {formSections.map((s, idx) => (
                  <div
                    key={s.tempId}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"
                  >
                    {/* Section name row */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-5 flex-shrink-0 text-right">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) =>
                          updateSection(s.tempId, { name: e.target.value })
                        }
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none min-w-0 placeholder-gray-600"
                        placeholder="Nama bagian..."
                      />
                      {/* Section image indicator */}
                      {(s.refImg1.url ||
                        s.refImg1.preview ||
                        s.refImg2.url ||
                        s.refImg2.preview) && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                          <ImageIcon className="w-2.5 h-2.5" />
                          {
                            [
                              s.refImg1.url || s.refImg1.preview,
                              s.refImg2.url || s.refImg2.preview,
                            ].filter(Boolean).length
                          }
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSection(s.tempId)}
                        className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Description textarea */}
                    <div className="mt-2 pl-9">
                      <textarea
                        value={s.description}
                        onChange={(e) =>
                          updateSection(s.tempId, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none transition-all"
                        placeholder="Parameter yang perlu di verifikasi pada setiap bagian (opsional)."
                      />
                      {s.description.trim() && (
                        <p className="flex items-center gap-1 text-[10px] text-blue-400 mt-1">
                          Deskripsi akan ditampilkan kepada petugas patrol
                        </p>
                      )}
                    </div>

                    {/* Per-section ref images (collapsible) */}
                    <div className="pl-9">
                      <SectionRefImages
                        section={s}
                        onChange={(patch) => updateSection(s.tempId, patch)}
                      />
                    </div>
                  </div>
                ))}
                {formSections.length === 0 && (
                  <p className="text-center text-gray-600 text-xs py-6">
                    Belum ada bagian — tambahkan di bawah
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSection())
                  }
                  className="flex-1 form-input-dark"
                  placeholder="Nama bagian baru (Enter untuk tambah)..."
                />
                <button
                  type="button"
                  onClick={addSection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
            </div>

            {formError && (
              <p className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" /> {formError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={closeForm}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? "Simpan Perubahan" : "Buat Area"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : areas.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada area patrol</p>
          </div>
        ) : (
          <div className="space-y-3">
            {areas.map((area) => (
              <div
                key={area.id}
                className="card-dark rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">
                        {area.name}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400 font-mono">
                        {area.code}
                      </span>
                      {!area.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          Non-aktif
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {area.sections.length} bagian
                      </span>
                      {area.sections.some((s) => s.description) && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <FileText className="w-3 h-3" />
                          {
                            area.sections.filter((s) => s.description).length
                          }{" "}
                          ada deskripsi
                        </span>
                      )}
                      {(area.referenceImageUrl1 || area.referenceImageUrl2) && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <ImageIcon className="w-3 h-3" />
                          {
                            [
                              area.referenceImageUrl1,
                              area.referenceImageUrl2,
                            ].filter(Boolean).length
                          }{" "}
                          ref. area
                        </span>
                      )}
                      {area.sections.some(
                        (s) => s.referenceImageUrl1 || s.referenceImageUrl2,
                      ) && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <ImageIcon className="w-3 h-3" />
                          {area.sections.reduce(
                            (acc, s) => acc + countSectionImages(s),
                            0,
                          )}{" "}
                          ref. bagian
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === area.id ? null : area.id)
                      }
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedId === area.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleToggle(area)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            area.isActive
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                          }`}
                        >
                          {area.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(area)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(area)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expandedId === area.id && (
                  <div className="border-t border-white/10 px-4 py-3 space-y-4">
                    {/* Area reference images */}
                    {(area.referenceImageUrl1 || area.referenceImageUrl2) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3" /> Gambar Referensi
                          Area
                        </p>
                        <div
                          className={`grid gap-3 ${
                            area.referenceImageUrl1 && area.referenceImageUrl2
                              ? "grid-cols-2"
                              : "grid-cols-1 max-w-xs"
                          }`}
                        >
                          {area.referenceImageUrl1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxSrc(area.referenceImageUrl1!)
                              }
                              className="rounded-xl overflow-hidden border border-white/20 hover:border-blue-400 transition-colors group relative"
                            >
                              <img
                                src={area.referenceImageUrl1}
                                alt="Ref 1"
                                className="w-full h-24 object-cover group-hover:opacity-80 transition-opacity"
                              />
                              <p className="text-center text-[10px] text-gray-400 py-1 bg-black/40">
                                Referensi Area 1
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Eye className="w-5 h-5 text-white drop-shadow" />
                              </div>
                            </button>
                          )}
                          {area.referenceImageUrl2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxSrc(area.referenceImageUrl2!)
                              }
                              className="rounded-xl overflow-hidden border border-white/20 hover:border-blue-400 transition-colors group relative"
                            >
                              <img
                                src={area.referenceImageUrl2}
                                alt="Ref 2"
                                className="w-full h-24 object-cover group-hover:opacity-80 transition-opacity"
                              />
                              <p className="text-center text-[10px] text-gray-400 py-1 bg-black/40">
                                Referensi Area 2
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Eye className="w-5 h-5 text-white drop-shadow" />
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sections list */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Bagian
                      </p>
                      <div className="space-y-2">
                        {area.sections
                          .sort((a, b) => a.order - b.order)
                          .map((s, idx) => {
                            const hasSectionImages =
                              s.referenceImageUrl1 || s.referenceImageUrl2;
                            return (
                              <div
                                key={s.id}
                                className="rounded-xl border border-white/10 bg-white/3 p-2.5"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-gray-600 w-5 flex-shrink-0 text-right text-xs mt-0.5">
                                    {idx + 1}.
                                  </span>
                                  <div className="w-6 h-6 rounded-lg border border-white/10 flex-shrink-0 flex items-center justify-center bg-white/3 mt-0.5">
                                    <Layers className="w-3 h-3 text-gray-700" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gray-300 text-xs font-medium">
                                      {s.name}
                                    </p>
                                    {s.description && (
                                      <p className="text-gray-500 text-[11px] mt-1 leading-relaxed border-l-2 border-purple-500/30 pl-2">
                                        {s.description}
                                      </p>
                                    )}
                                  </div>
                                  {hasSectionImages && (
                                    <span className="flex items-center gap-1 text-[10px] text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                                      <ImageIcon className="w-2.5 h-2.5" />
                                      {countSectionImages(s)} ref
                                    </span>
                                  )}
                                </div>
                                {hasSectionImages && (
                                  <div
                                    className={`mt-2 grid gap-2 ${s.referenceImageUrl1 && s.referenceImageUrl2 ? "grid-cols-2" : "grid-cols-1"}`}
                                  >
                                    {s.referenceImageUrl1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLightboxSrc(s.referenceImageUrl1!)
                                        }
                                        className="rounded-lg overflow-hidden border border-white/10 hover:border-blue-400 transition-colors group relative"
                                      >
                                        <img
                                          src={s.referenceImageUrl1}
                                          alt=""
                                          className="w-full h-20 object-cover group-hover:opacity-80 transition-opacity"
                                        />
                                        <p className="text-center text-[10px] text-gray-500 py-0.5 bg-black/40">
                                          Ref. Bagian 1
                                        </p>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <Eye className="w-4 h-4 text-white drop-shadow" />
                                        </div>
                                      </button>
                                    )}
                                    {s.referenceImageUrl2 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLightboxSrc(s.referenceImageUrl2!)
                                        }
                                        className="rounded-lg overflow-hidden border border-white/10 hover:border-blue-400 transition-colors group relative"
                                      >
                                        <img
                                          src={s.referenceImageUrl2}
                                          alt=""
                                          className="w-full h-20 object-cover group-hover:opacity-80 transition-opacity"
                                        />
                                        <p className="text-center text-[10px] text-gray-500 py-0.5 bg-black/40">
                                          Ref. Bagian 2
                                        </p>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <Eye className="w-4 h-4 text-white drop-shadow" />
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
