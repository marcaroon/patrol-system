// src/app/admin/security/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Loader2,
  X,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  division: "SECURITY" | "HSE";
  isActive: boolean;
}

export default function SecurityUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [session, setSession] = useState<{ role: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSession({ role: d.role }))
      .catch(() => {});
  }, []);

  const load = () =>
    fetch("/api/users?division=SECURITY&active=false")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d);
        setLoading(false);
      });

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.id);
    setFormName(u.name);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError("Nama wajib diisi"); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = editingId
        ? await fetch(`/api/users/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formName, division: "SECURITY" }),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formName, division: "SECURITY" }),
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

  const handleDelete = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    load();
  };

  const canEdit = session?.role === "SUPER_ADMIN" || session?.role === "SECURITY_ADMIN";

  const activeUsers = users.filter((u) => u.isActive);
  const inactiveUsers = users.filter((u) => !u.isActive);

  return (
    <AdminShell requiredRoles={["SUPER_ADMIN", "VIEWER", "SECURITY_ADMIN"]}>
      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-900 p-5 space-y-4">
            <p className="text-white font-semibold">Hapus Personel?</p>
            <p className="text-gray-400 text-sm">
              Personel{" "}
              <span className="text-white font-medium">
                {users.find((u) => u.id === deleteConfirmId)?.name}
              </span>{" "}
              akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Personel Security</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola daftar Security Officer · {users.length} total ({activeUsers.length} aktif)
            </p>
          </div>
          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Personel
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {editingId ? "Edit Personel Security" : "Tambah Personel Security"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="form-input-dark uppercase"
                placeholder="NAMA LENGKAP"
                autoFocus
              />
            </div>

            {/* Division indicator (fixed to SECURITY for this page) */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Divisi: Security</span>
              <span className="ml-auto text-xs text-gray-500">Ditetapkan otomatis</span>
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? "Simpan Perubahan" : "Tambah Personel"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada personel Security</p>
            {canEdit && (
              <button
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold mx-auto transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Personel Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active users */}
            <div className="card-dark rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <Shield className="w-4 h-4 text-blue-400" />
                <h2 className="text-white font-semibold text-sm">Personel Aktif</h2>
                <span className="text-xs text-gray-500 ml-1">({activeUsers.length})</span>
              </div>
              <div className="divide-y divide-white/5">
                {activeUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Tidak ada personel aktif</p>
                ) : (
                  activeUsers.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      canEdit={canEdit}
                      onEdit={openEdit}
                      onToggle={handleToggle}
                      onDelete={(u) => setDeleteConfirmId(u.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Inactive users */}
            {inactiveUsers.length > 0 && (
              <div className="card-dark rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <h2 className="text-gray-400 font-semibold text-sm">Personel Non-aktif</h2>
                  <span className="text-xs text-gray-600 ml-1">({inactiveUsers.length})</span>
                </div>
                <div className="divide-y divide-white/5">
                  {inactiveUsers.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      canEdit={canEdit}
                      onEdit={openEdit}
                      onToggle={handleToggle}
                      onDelete={(u) => setDeleteConfirmId(u.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function UserRow({
  user,
  canEdit,
  onEdit,
  onToggle,
  onDelete,
}: {
  user: { id: string; name: string; isActive: boolean };
  canEdit: boolean;
  onEdit: (u: any) => void;
  onToggle: (u: any) => void;
  onDelete: (u: any) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
      <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-300 text-xs font-bold uppercase flex-shrink-0">
        {user.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${user.isActive ? "text-white" : "text-gray-500 line-through"}`}>
          {user.name}
        </p>
        <p className={`text-xs ${user.isActive ? "text-blue-400" : "text-gray-600"}`}>
          {user.isActive ? "● Aktif" : "○ Non-aktif"}
        </p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onToggle(user)}
            title={user.isActive ? "Non-aktifkan" : "Aktifkan"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              user.isActive
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
            }`}
          >
            {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(user)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}