// src/app/admin/areas/page.tsx
"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Plus, Pencil, Trash2, MapPin, Loader2, X, Check,
  ChevronDown, ChevronUp, GripVertical, AlertCircle,
  ToggleLeft, ToggleRight,
} from "lucide-react";

interface ChecklistItemForm { tempId: string; label: string; description: string; }
interface Area {
  id: string; name: string; code: string; isActive: boolean;
  checklistItems: { id: string; order: number; label: string; description?: string | null }[];
}

const uid = () => Math.random().toString(36).slice(2);

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    setEditingId(null); setFormName(""); setFormCode("");
    setFormItems([]); setNewLabel(""); setFormError(""); setShowForm(true);
  };

  const openEdit = (a: Area) => {
    setEditingId(a.id); setFormName(a.name); setFormCode(a.code);
    setFormItems(
      a.checklistItems
        .sort((x, y) => x.order - y.order)
        .map((i) => ({ tempId: i.id, label: i.label, description: i.description ?? "" }))
    );
    setNewLabel(""); setFormError(""); setShowForm(true);
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    setFormItems((p) => [...p, { tempId: uid(), label: newLabel.trim(), description: "" }]);
    setNewLabel("");
  };

  const removeItem = (tid: string) => setFormItems((p) => p.filter((i) => i.tempId !== tid));
  const updateItem = (tid: string, label: string) =>
    setFormItems((p) => p.map((i) => i.tempId === tid ? { ...i, label } : i));

  const handleSave = async () => {
    if (!formName.trim()) { setFormError("Nama area wajib diisi"); return; }
    if (!formCode.trim()) { setFormError("Kode area wajib diisi"); return; }
    if (formItems.length === 0) { setFormError("Minimal 1 item checklist"); return; }
    setSaving(true); setFormError("");
    try {
      const body = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        checklistItems: formItems.map((i) => ({ label: i.label, description: i.description || undefined })),
      };
      const res = editingId
        ? await fetch(`/api/areas/${editingId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          })
        : await fetch("/api/areas", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error ?? "Gagal menyimpan");
        return;
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Area) => {
    await fetch(`/api/areas/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
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
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Manajemen Area Patrol</h1>
            <p className="text-gray-400 text-sm mt-0.5">Kelola area dan item checklist patrol Security</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Area
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">{editingId ? "Edit Area" : "Tambah Area Baru"}</h2>
              <button
                onClick={() => setShowForm(false)}
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
              <label className="block text-xs text-gray-400 mb-2">
                Item Checklist{" "}
                <span className="text-gray-500">({formItems.length} item)</span>
              </label>
              <div className="space-y-1.5 mb-3 max-h-64 overflow-y-auto pr-1">
                {formItems.map((item, idx) => (
                  <div
                    key={item.tempId}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500 w-5 flex-shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.tempId, e.target.value)}
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none min-w-0"
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
              </div>
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
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? "Simpan Perubahan" : "Buat Area"}
              </button>
            </div>
          </div>
        )}

        {/* Areas list */}
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

                {expandedId === area.id && (
                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Item Checklist
                    </p>
                    <div className="space-y-1">
                      {area.checklistItems
                        .sort((a, b) => a.order - b.order)
                        .map((item, idx) => (
                          <div key={item.id} className="flex items-start gap-2 text-xs py-0.5">
                            <span className="text-gray-600 w-5 flex-shrink-0 text-right">{idx + 1}.</span>
                            <span className="text-gray-300">{item.label}</span>
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
