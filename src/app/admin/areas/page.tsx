// src/app/admin/areas/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Plus, Pencil, Trash2, MapPin, Loader2, X, Check,
  ChevronDown, ChevronUp, GripVertical, AlertCircle,
  ToggleLeft, ToggleRight, ImagePlus, Image as ImageIcon, Eye,
} from "lucide-react";

interface ChecklistItemForm {
  tempId: string;
  label: string;
  description: string;
  referenceImageUrl: string;     // already-uploaded URL (persisted)
  referenceImageFile?: File;     // staged file waiting to upload
  referenceImagePreview?: string; // local object-URL for preview
  uploading?: boolean;
}

interface Area {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  checklistItems: {
    id: string;
    order: number;
    label: string;
    description?: string | null;
    referenceImageUrl?: string | null;
  }[];
}

const uid = () => Math.random().toString(36).slice(2);

// ── Lightbox ─────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </button>
        <img src={src} alt="Referensi" className="w-full max-h-[80vh] object-contain rounded-2xl" />
      </div>
    </div>
  );
}

// ── Reference image cell per checklist item ───────────────────────
function RefImageCell({
  item,
  onChange,
}: {
  item: ChecklistItemForm;
  onChange: (patch: Partial<ChecklistItemForm>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState(false);

  const previewSrc = item.referenceImagePreview || item.referenceImageUrl || null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    onChange({ referenceImageFile: file, referenceImagePreview: preview });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.referenceImagePreview) URL.revokeObjectURL(item.referenceImagePreview);
    onChange({
      referenceImageFile: undefined,
      referenceImagePreview: undefined,
      referenceImageUrl: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  if (previewSrc) {
    return (
      <>
        {lightbox && <Lightbox src={previewSrc} onClose={() => setLightbox(false)} />}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 group">
          <img src={previewSrc} alt="ref" className="w-full h-full object-cover" />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
              className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center"
              title="Lihat"
            >
              <Eye className="w-3 h-3 text-white" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="w-6 h-6 rounded bg-red-500/70 hover:bg-red-500 flex items-center justify-center"
              title="Hapus"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
          {item.uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className="w-14 h-14 rounded-lg border-2 border-dashed border-white/20 hover:border-green-500/50 hover:bg-green-500/5 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
      title="Tambah gambar referensi (opsional)"
    >
      <ImagePlus className="w-5 h-5 text-gray-500" />
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

// ── Main page ─────────────────────────────────────────────────────
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
  const [formItems, setFormItems] = useState<ChecklistItemForm[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [formError, setFormError] = useState("");

  const load = () =>
    fetch("/api/areas?active=false")
      .then((r) => r.json())
      .then((d) => { setAreas(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormName(""); setFormCode("");
    setFormItems([]); setNewLabel(""); setFormError("");
    setShowForm(true);
  };

  const openEdit = (a: Area) => {
    setEditingId(a.id);
    setFormName(a.name); setFormCode(a.code);
    setFormItems(
      a.checklistItems
        .sort((x, y) => x.order - y.order)
        .map((i) => ({
          tempId: i.id,
          label: i.label,
          description: i.description ?? "",
          referenceImageUrl: i.referenceImageUrl ?? "",
        }))
    );
    setNewLabel(""); setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    // revoke any staged previews
    formItems.forEach((i) => {
      if (i.referenceImagePreview) URL.revokeObjectURL(i.referenceImagePreview);
    });
    setShowForm(false);
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    setFormItems((p) => [
      ...p,
      { tempId: uid(), label: newLabel.trim(), description: "", referenceImageUrl: "" },
    ]);
    setNewLabel("");
  };

  const removeItem = (tid: string) => {
    const item = formItems.find((i) => i.tempId === tid);
    if (item?.referenceImagePreview) URL.revokeObjectURL(item.referenceImagePreview);
    setFormItems((p) => p.filter((i) => i.tempId !== tid));
  };

  const updateItem = (tid: string, patch: Partial<ChecklistItemForm>) =>
    setFormItems((p) => p.map((i) => i.tempId === tid ? { ...i, ...patch } : i));

  // Upload a single staged image and return its URL
  const uploadRefImage = async (file: File, idx: number): Promise<string> => {
    updateItem(formItems[idx].tempId, { uploading: true });
    const form = new FormData();
    form.append("file", file);
    form.append("subdir", "checklist-refs");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload gambar referensi gagal");
    const { url } = await res.json();
    return url as string;
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError("Nama area wajib diisi"); return; }
    if (!formCode.trim()) { setFormError("Kode area wajib diisi"); return; }
    if (formItems.length === 0) { setFormError("Minimal 1 item checklist"); return; }
    setSaving(true); setFormError("");

    try {
      // 1. Upload any staged images first
      const resolved = await Promise.all(
        formItems.map(async (item, idx) => {
          if (item.referenceImageFile) {
            try {
              const url = await uploadRefImage(item.referenceImageFile, idx);
              return { ...item, referenceImageUrl: url, referenceImageFile: undefined };
            } catch {
              throw new Error(`Gagal upload gambar untuk item: "${item.label}"`);
            }
          }
          return item;
        })
      );

      // 2. Save area + items
      const body = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        checklistItems: resolved.map((i) => ({
          label: i.label,
          description: i.description || undefined,
          referenceImageUrl: i.referenceImageUrl || undefined,
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

      // Revoke previews
      resolved.forEach((i) => {
        if (i.referenceImagePreview) URL.revokeObjectURL(i.referenceImagePreview);
      });

      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
      setFormItems((p) => p.map((i) => ({ ...i, uploading: false })));
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
    if (!confirm(`Hapus area "${a.name}"? Semua data terkait akan ikut terhapus.`)) return;
    await fetch(`/api/areas/${a.id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Manajemen Area Patrol</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola area, item checklist, dan gambar referensi patrol Security
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Area
          </button>
        </div>

        {/* ── Add / Edit form ── */}
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

            {/* Area name + code */}
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
                  placeholder="Contoh: KCP (Kernel Crushing Plant)"
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

            {/* Checklist items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-gray-400">
                  Item Checklist{" "}
                  <span className="text-gray-500">({formItems.length} item)</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <ImagePlus className="w-3 h-3" />
                  Klik ikon gambar untuk tambah referensi (opsional)
                </span>
              </div>

              <div className="space-y-2 mb-3 max-h-[420px] overflow-y-auto pr-1">
                {formItems.map((item, idx) => (
                  <div
                    key={item.tempId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500 w-5 flex-shrink-0 text-right">
                      {idx + 1}.
                    </span>

                    {/* Reference image cell */}
                    <RefImageCell
                      item={item}
                      onChange={(patch) => updateItem(item.tempId, patch)}
                    />

                    {/* Label input */}
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.tempId, { label: e.target.value })}
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none min-w-0"
                      placeholder="Label checklist..."
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {formItems.length === 0 && (
                  <p className="text-center text-gray-600 text-xs py-6">
                    Belum ada item — tambahkan di bawah
                  </p>
                )}
              </div>

              {/* New item input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
                  className="flex-1 form-input-dark"
                  placeholder="Tulis item checklist baru (Enter untuk tambah)..."
                />
                <button
                  type="button"
                  onClick={addItem}
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

        {/* ── Areas list ── */}
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
              <div key={area.id} className="card-dark rounded-2xl overflow-hidden">
                {/* Area header row */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{area.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400 font-mono">
                        {area.code}
                      </span>
                      {!area.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          Non-aktif
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {area.checklistItems.length} item checklist
                      {/* {area.checklistItems.some((i) => i.referenceImageUrl) && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-blue-400">
                          <ImageIcon className="w-3 h-3" />
                          {area.checklistItems.filter((i) => i.referenceImageUrl).length} gambar ref
                        </span>
                      )} */}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === area.id ? null : area.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedId === area.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleToggle(area)}
                      title={area.isActive ? "Non-aktifkan" : "Aktifkan"}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        area.isActive
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                      }`}
                    >
                      {area.isActive
                        ? <ToggleRight className="w-4 h-4" />
                        : <ToggleLeft className="w-4 h-4" />}
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

                {/* Expanded checklist */}
                {expandedId === area.id && (
                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Item Checklist
                    </p>
                    <div className="space-y-2">
                      {area.checklistItems
                        .sort((a, b) => a.order - b.order)
                        .map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 py-1.5"
                          >
                            <span className="text-gray-600 w-5 flex-shrink-0 text-right text-xs">
                              {idx + 1}.
                            </span>

                            {/* Reference image thumbnail */}
                            {item.referenceImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setLightboxSrc(item.referenceImageUrl!)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 hover:border-blue-400 transition-colors group relative"
                                title="Lihat gambar referensi"
                              >
                                <img
                                  src={item.referenceImageUrl}
                                  alt="ref"
                                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white drop-shadow" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0 flex items-center justify-center bg-white/3">
                                <ImageIcon className="w-4 h-4 text-gray-700" />
                              </div>
                            )}

                            <span className="text-gray-300 text-xs leading-snug">
                              {item.label}
                            </span>
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