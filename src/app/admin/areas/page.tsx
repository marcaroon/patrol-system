// src/app/admin/areas/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
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
} from "lucide-react";

interface SectionForm {
  tempId: string;
  name: string;
  description: string;
  referenceImageUrl: string;
  referenceImageFile?: File;
  referenceImagePreview?: string;
  uploading?: boolean;
}

interface Area {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  sections: {
    id: string;
    order: number;
    name: string;
    description?: string | null;
    referenceImageUrl?: string | null;
  }[];
}

const uid = () => Math.random().toString(36).slice(2);

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

function RefImageCell({
  item,
  onChange,
}: {
  item: SectionForm;
  onChange: (p: Partial<SectionForm>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState(false);
  const src = item.referenceImagePreview || item.referenceImageUrl || null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    onChange({
      referenceImageFile: file,
      referenceImagePreview: URL.createObjectURL(file),
    });
  };
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.referenceImagePreview)
      URL.revokeObjectURL(item.referenceImagePreview);
    onChange({
      referenceImageFile: undefined,
      referenceImagePreview: undefined,
      referenceImageUrl: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  if (src)
    return (
      <>
        {lightbox && <Lightbox src={src} onClose={() => setLightbox(false)} />}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 group">
          <img src={src} alt="ref" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(true);
              }}
              className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center"
            >
              <Eye className="w-3 h-3 text-white" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="w-5 h-5 rounded bg-red-500/70 hover:bg-red-500 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
          {item.uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
          )}
        </div>
      </>
    );

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className="w-12 h-12 rounded-lg border-2 border-dashed border-white/20 hover:border-green-500/50 hover:bg-green-500/5 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
      title="Tambah gambar referensi (opsional)"
    >
      <ImagePlus className="w-4 h-4 text-gray-500" />
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

export default function AreasPage() {
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
  const [newSectionName, setNewSectionName] = useState("");
  const [formError, setFormError] = useState("");

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

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormSections([
      {
        tempId: uid(),
        name: "Bagian Depan",
        description: "",
        referenceImageUrl: "",
      },
      {
        tempId: uid(),
        name: "Sisi Kanan",
        description: "",
        referenceImageUrl: "",
      },
      {
        tempId: uid(),
        name: "Sisi Kiri",
        description: "",
        referenceImageUrl: "",
      },
      {
        tempId: uid(),
        name: "Bagian Belakang",
        description: "",
        referenceImageUrl: "",
      },
      {
        tempId: uid(),
        name: "Bagian Proses",
        description: "",
        referenceImageUrl: "",
      },
    ]);
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
          referenceImageUrl: s.referenceImageUrl ?? "",
        })),
    );
    setNewSectionName("");
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    formSections.forEach((s) => {
      if (s.referenceImagePreview) URL.revokeObjectURL(s.referenceImagePreview);
    });
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
        referenceImageUrl: "",
      },
    ]);
    setNewSectionName("");
  };

  const removeSection = (tid: string) => {
    const s = formSections.find((i) => i.tempId === tid);
    if (s?.referenceImagePreview) URL.revokeObjectURL(s.referenceImagePreview);
    setFormSections((p) => p.filter((i) => i.tempId !== tid));
  };

  const updateSection = (tid: string, patch: Partial<SectionForm>) =>
    setFormSections((p) =>
      p.map((s) => (s.tempId === tid ? { ...s, ...patch } : s)),
    );

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
      setFormError("Minimal 1 bagian/seksi");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const resolved = await Promise.all(
        formSections.map(async (s, idx) => {
          if (s.referenceImageFile) {
            updateSection(s.tempId, { uploading: true });
            const form = new FormData();
            form.append("file", s.referenceImageFile);
            form.append("subdir", "area-refs");
            const r = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            if (!r.ok) throw new Error(`Gagal upload gambar: "${s.name}"`);
            const { url } = await r.json();
            return {
              ...s,
              referenceImageUrl: url as string,
              referenceImageFile: undefined,
            };
          }
          return s;
        }),
      );

      const body = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        sections: resolved.map((s) => ({
          tempId: s.tempId,
          name: s.name,
          description: s.description || undefined,
          referenceImageUrl: s.referenceImageUrl || undefined,
        })),
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
      resolved.forEach((s) => {
        if (s.referenceImagePreview)
          URL.revokeObjectURL(s.referenceImagePreview);
      });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
      setFormSections((p) => p.map((s) => ({ ...s, uploading: false })));
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

  return (
    <AdminShell>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">
              Manajemen Area Patrol
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola area, bagian/seksi, dan gambar referensi
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Area
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4 space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">
                  Bagian / Seksi{" "}
                  <span className="text-gray-500">
                    ({formSections.length} bagian)
                  </span>
                </label>
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <ImagePlus className="w-3 h-3" /> Klik ikon gambar untuk
                  referensi (opsional)
                </span>
              </div>

              <div className="space-y-2 mb-3 max-h-80 overflow-y-auto pr-1">
                {formSections.map((s, idx) => (
                  <div
                    key={s.tempId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500 w-5 flex-shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <RefImageCell
                      item={s}
                      onChange={(p) => updateSection(s.tempId, p)}
                    />
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) =>
                        updateSection(s.tempId, { name: e.target.value })
                      }
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none min-w-0"
                      placeholder="Nama bagian..."
                    />
                    <button
                      type="button"
                      onClick={() => removeSection(s.tempId)}
                      className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
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
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap"
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
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
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
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
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-400" />
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
                    <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      {area.sections.length} bagian/seksi
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
                    <button
                      onClick={() => handleToggle(area)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${area.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"}`}
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
                  </div>
                </div>

                {expandedId === area.id && (
                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Bagian / Seksi
                    </p>
                    <div className="space-y-2">
                      {area.sections
                        .sort((a, b) => a.order - b.order)
                        .map((s, idx) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-3 py-1"
                          >
                            <span className="text-gray-600 w-5 flex-shrink-0 text-right text-xs">
                              {idx + 1}.
                            </span>
                            {s.referenceImageUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxSrc(s.referenceImageUrl!)
                                }
                                className="w-9 h-9 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 hover:border-blue-400 transition-colors group relative"
                                title="Lihat referensi"
                              >
                                <img
                                  src={s.referenceImageUrl}
                                  alt="ref"
                                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Eye className="w-3 h-3 text-white drop-shadow" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-9 h-9 rounded-lg border border-white/10 flex-shrink-0 flex items-center justify-center bg-white/3">
                                <Layers className="w-3.5 h-3.5 text-gray-700" />
                              </div>
                            )}
                            <div>
                              <p className="text-gray-300 text-xs font-medium">
                                {s.name}
                              </p>
                              {s.description && (
                                <p className="text-gray-600 text-[11px]">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
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
