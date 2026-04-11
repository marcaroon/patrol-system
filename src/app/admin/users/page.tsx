// src/app/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Leaf,
  Loader2,
  X,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  division: "SECURITY" | "HSE";
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDivision, setFormDivision] = useState<"SECURITY" | "HSE">(
    "SECURITY",
  );
  const [formError, setFormError] = useState("");
  const [session, setSession] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSession({ role: d.role }))
      .catch(() => {});
  }, []);

  const load = () =>
    fetch("/api/users?active=false")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d);
        setLoading(false);
      });
  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormDivision("SECURITY");
    setFormError("");
    setShowForm(true);
  };
  const openEdit = (u: User) => {
    setEditingId(u.id);
    setFormName(u.name);
    setFormDivision(u.division);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Nama wajib diisi");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = editingId
        ? await fetch(`/api/users/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formName, division: formDivision }),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formName, division: formDivision }),
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

  const handleToggle = async (u: User) => {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    load();
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Hapus ${u.name}?`)) return;
    await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    load();
  };

  const secUsers = users.filter((u) => u.division === "SECURITY");
  const hseUsers = users.filter((u) => u.division === "HSE");

  const Group = ({
    title,
    list,
    color,
    Icon,
  }: {
    title: string;
    list: User[];
    color: string;
    Icon: React.FC<{ className?: string }>;
  }) => (
    <div className="card-dark rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Icon className={`w-4 h-4 ${color}`} />
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        <span className="text-xs text-gray-500 ml-1">({list.length})</span>
      </div>
      <div className="divide-y divide-white/5">
        {list.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Belum ada personel
          </p>
        ) : (
          list.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold uppercase">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${u.isActive ? "text-white" : "text-gray-500 line-through"}`}
                >
                  {u.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {u.isActive ? "Aktif" : "Non-aktif"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggle(u)}
                  title={u.isActive ? "Non-aktifkan" : "Aktifkan"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${u.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"}`}
                >
                  {u.isActive ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(u)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">
              Manajemen Personel
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola daftar Security & EHS&FS Officer
            </p>
          </div>
          {session?.role === "SUPER_ADMIN" && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Personel
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {editingId ? "Edit Personel" : "Tambah Personel Baru"}
              </h2>
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
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value.toUpperCase())}
                  className="form-input-dark uppercase"
                  placeholder="NAMA LENGKAP"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Divisi <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  {(["SECURITY", "HSE"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormDivision(d)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${formDivision === d ? (d === "SECURITY" ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-green-500 bg-green-500/20 text-green-400") : "border-white/10 text-gray-500 hover:border-white/20"}`}
                    >
                      {d === "SECURITY" ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <Leaf className="w-4 h-4" />
                      )}{" "}
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {formError && (
              <p className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {formError}
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
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Group
              title="Personel Security"
              list={secUsers}
              color="text-blue-400"
              Icon={Shield}
            />
            <Group
              title="Personel EHS&FS"
              list={hseUsers}
              color="text-green-400"
              Icon={Leaf}
            />
          </div>
        )}
      </div>
    </AdminShell>
  );
}
