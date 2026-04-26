// src/app/admin/accounts/page.tsx
"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Plus, Pencil, Trash2, Loader2, X, Check,
  AlertCircle, Shield, Leaf, Eye, EyeOff, KeyRound, Users,
} from "lucide-react";
import type { AdminRoleType } from "@/lib/auth";

interface AdminAccount {
  id: string;
  username: string;
  role: AdminRoleType;
  createdAt: string;
}

const ROLE_OPTIONS: {
  value: AdminRoleType;
  label: string;
  color: string;
  bg: string;
  desc: string;
}[] = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    color: "text-green-400",
    bg: "bg-green-500/20 border-green-500/30",
    desc: "Akses penuh semua fitur",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    color: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-500/30",
    desc: "Lihat semua, tidak bisa edit",
  },
  {
    value: "SECURITY_ADMIN",
    label: "Security Admin",
    color: "text-indigo-400",
    bg: "bg-indigo-500/20 border-indigo-500/30",
    desc: "Kelola Security saja",
  },
  {
    value: "HSE_ADMIN",
    label: "EHS&FS Admin",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/30",
    desc: "Kelola EHS&FS saja",
  },
  {
    value: "SECURITY_VIEWER",
    label: "Security Viewer",
    color: "text-sky-400",
    bg: "bg-sky-500/20 border-sky-500/30",
    desc: "Lihat Security saja, tidak edit",
  },
  {
    value: "HSE_VIEWER",
    label: "EHS&FS Viewer",
    color: "text-teal-400",
    bg: "bg-teal-500/20 border-teal-500/30",
    desc: "Lihat EHS&FS saja, tidak edit",
  },
];

function RoleBadge({ role }: { role: AdminRoleType }) {
  const opt = ROLE_OPTIONS.find((r) => r.value === role);
  if (!opt) return null;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${opt.bg} ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}

function RoleIcon({ role }: { role: AdminRoleType }) {
  if (role === "SECURITY_ADMIN" || role === "SECURITY_VIEWER")
    return <Shield className="w-4 h-4" />;
  if (role === "HSE_ADMIN" || role === "HSE_VIEWER")
    return <Leaf className="w-4 h-4" />;
  if (role === "SUPER_ADMIN") return <KeyRound className="w-4 h-4" />;
  return <Eye className="w-4 h-4" />;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AdminRoleType>("VIEWER");
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () =>
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((d) => { setAccounts(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormUsername("");
    setFormPassword("");
    setFormRole("VIEWER");
    setShowPw(false);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (acc: AdminAccount) => {
    setEditingId(acc.id);
    setFormUsername(acc.username);
    setFormPassword("");
    setFormRole(acc.role);
    setShowPw(false);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formUsername.trim()) { setFormError("Username wajib diisi"); return; }
    if (!editingId && !formPassword) {
      setFormError("Password wajib diisi untuk akun baru");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body: Record<string, string> = { username: formUsername, role: formRole };
      if (formPassword) body.password = formPassword;

      const res = editingId
        ? await fetch(`/api/admin/accounts/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/accounts", {
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

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    load();
  };

  return (
    <AdminShell requiredRoles={["SUPER_ADMIN"]}>
      {/* Delete confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-900 p-5 space-y-4">
            <p className="text-white font-semibold">Hapus Akun Admin?</p>
            <p className="text-gray-400 text-sm">
              Akun{" "}
              <span className="text-white font-medium">
                {accounts.find((a) => a.id === deleteConfirmId)?.username}
              </span>{" "}
              akan dihapus permanen.
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
            <h1 className="text-white text-2xl font-bold">Manajemen Akun Admin</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Kelola akun admin dan hak akses · {accounts.length} akun
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Admin
          </button>
        </div>

        {/* Role legend */}
        <div className="card-dark p-4 rounded-2xl">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Penjelasan Role
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <div
                key={r.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${r.bg}`}
              >
                <span className={`text-xs font-bold ${r.color}`}>{r.label}</span>
                <span className="text-gray-500 text-xs">— {r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {editingId ? "Edit Akun Admin" : "Tambah Akun Admin Baru"}
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
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) =>
                    setFormUsername(
                      e.target.value.toLowerCase().replace(/\s/g, "_"),
                    )
                  }
                  className="form-input-dark"
                  placeholder="contoh: security_viewer2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Password{" "}
                  {editingId ? (
                    <span className="text-gray-500 font-normal">
                      (kosongkan jika tidak diubah)
                    </span>
                  ) : (
                    <span className="text-red-400">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="form-input-dark pr-10"
                    placeholder="Min. 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Role Akses
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFormRole(r.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      formRole === r.value
                        ? `border-current ${r.bg} ${r.color}`
                        : "border-white/10 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    <RoleIcon role={r.value} />
                    {r.label}
                  </button>
                ))}
              </div>
              {/* Description of selected role */}
              {formRole && (
                <p className="text-xs text-gray-500 mt-2 px-1">
                  {ROLE_OPTIONS.find((r) => r.value === formRole)?.desc}
                </p>
              )}
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
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? "Simpan Perubahan" : "Buat Akun"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : (
          <div className="card-dark rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <Users className="w-4 h-4 text-green-400" />
              <h2 className="text-white font-semibold text-sm">
                Daftar Akun Admin
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0">
                    {acc.username[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {acc.username}
                    </p>
                    <div className="mt-0.5">
                      <RoleBadge role={acc.role} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(acc)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(acc.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}