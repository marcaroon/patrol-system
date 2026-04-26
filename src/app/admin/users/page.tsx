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
  Eye,
  EyeOff,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  division: "SECURITY" | "HSE";
  isActive: boolean;
  username?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDivision, setFormDivision] = useState<"SECURITY" | "HSE">("SECURITY");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    fetch("/api/users?active=false")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d);
        setLoading(false);
      });

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormDivision("SECURITY");
    setFormUsername("");
    setFormPassword("");
    setShowPw(false);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.id);
    setFormName(u.name);
    setFormDivision(u.division);
    setFormUsername(u.username ?? "");
    setFormPassword("");
    setShowPw(false);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Nama wajib diisi");
      return;
    }
    if (formUsername && !formPassword && !editingId) {
      setFormError("Password wajib diisi jika username diisi");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body: Record<string, unknown> = {
        name: formName,
        division: formDivision,
        username: formUsername || undefined,
      };
      if (formPassword) body.password = formPassword;

      const res = editingId
        ? await fetch(`/api/users/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
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

  const secUsers = users.filter((u) => u.division === "SECURITY");
  const hseUsers = users.filter((u) => u.division === "HSE");
  const canEdit = session?.role === "SUPER_ADMIN";

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
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm truncate ${u.isActive ? "text-white" : "text-gray-500 line-through"}`}
                >
                  {u.name}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span>{u.isActive ? "● Aktif" : "○ Non-aktif"}</span>
                  {u.username && (
                    <span className="text-gray-600">· @{u.username}</span>
                  )}
                  {!u.username && (
                    <span className="text-gray-700 italic">· tanpa login</span>
                  )}
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(u)}
                    title={u.isActive ? "Non-aktifkan" : "Aktifkan"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      u.isActive
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                    }`}
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
                    onClick={() => setDeleteConfirmId(u.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <AdminShell>
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
            <h1 className="text-white text-2xl font-bold">Manajemen Personel</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola daftar Security & EHS&FS Officer · {users.length} total
            </p>
          </div>
          {canEdit && (
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
          <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4 space-y-4">
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

            {/* Name */}
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
                autoFocus
              />
            </div>

            {/* Division */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Divisi <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                {(["SECURITY", "HSE"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormDivision(d)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      formDivision === d
                        ? d === "SECURITY"
                          ? "border-blue-500 bg-blue-500/20 text-blue-400"
                          : "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-white/10 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    {d === "SECURITY" ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <Leaf className="w-4 h-4" />
                    )}
                    {d === "HSE" ? "EHS&FS" : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Username Login{" "}
                <span className="text-gray-500 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) =>
                  setFormUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))
                }
                className="form-input-dark"
                placeholder="contoh: ahmad_security"
              />
              <p className="text-xs text-gray-600 mt-1">
                Kosongkan jika personel belum perlu login mandiri
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Password{" "}
                {formUsername && !editingId && (
                  <span className="text-red-400">*</span>
                )}
                {(!formUsername || editingId) && (
                  <span className="text-gray-500 font-normal">
                    {editingId ? "(kosong = tidak diubah)" : "(opsional)"}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="form-input-dark pr-10"
                  placeholder="Min. 6 karakter"
                  disabled={!formUsername}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  disabled={!formUsername}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-30"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
                {editingId ? "Simpan Perubahan" : "Tambah Personel"}
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
              color="text-emerald-400"
              Icon={Leaf}
            />
          </div>
        )}
      </div>
    </AdminShell>
  );
}