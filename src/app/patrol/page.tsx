// src/app/patrol/page.tsx
"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Leaf,
  ArrowLeft,
  Loader2,
  LogOut,
  EyeOff,
  Eye,
  AlertCircle,
  KeyRound,
  X,
  Check,
} from "lucide-react";
import SecurityPatrolForm from "@/components/patrol/SecurityPatrolForm";
import HSEPatrolForm from "@/components/patrol/HSEPatrolForm";

// ── Change Password Modal ─────────────────────────────────────────
function ChangePasswordModal({
  userId,
  division,
  onClose,
}: {
  userId: string;
  division: "SECURITY" | "HSE";
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isSecurity = division === "SECURITY";
  const accentBg = isSecurity ? "bg-blue-600" : "bg-green-600";
  const accentRing = isSecurity ? "focus:ring-blue-500" : "focus:ring-green-500";
  const accentText = isSecurity ? "text-blue-400" : "text-green-400";
  const accentBorder = isSecurity ? "border-blue-500/20" : "border-green-500/20";
  const accentBgLight = isSecurity ? "bg-blue-500/10" : "bg-green-500/10";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Semua field wajib diisi");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Password baru tidak boleh sama dengan password lama");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengganti password");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#0f2040 100%)" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-white/10 ${accentBgLight} ${accentBorder} border-b`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${accentBg} flex items-center justify-center`}>
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-bold text-sm">Ganti Password</p>
          </div>
          {!success && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {success ? (
          /* Success state */
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-bold">Password Berhasil Diganti</p>
              <p className="text-gray-400 text-sm mt-1">
                Gunakan password baru Anda untuk login berikutnya.
              </p>
            </div>
            <button
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${accentBg} hover:opacity-90`}
            >
              Tutup
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Password Lama <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm pr-10 focus:outline-none focus:ring-1 ${accentRing} transition-all`}
                  placeholder="Password saat ini"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Password Baru <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm pr-10 focus:outline-none focus:ring-1 ${accentRing} transition-all`}
                  placeholder="Min. 6 karakter"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Konfirmasi Password Baru <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm pr-10 focus:outline-none focus:ring-1 ${accentRing} transition-all`}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Realtime match indicator */}
              {confirmPassword && (
                <p className={`text-xs mt-1 ${newPassword === confirmPassword ? "text-green-400" : "text-red-400"}`}>
                  {newPassword === confirmPassword ? "✓ Password cocok" : "✗ Password tidak cocok"}
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${accentBg} hover:opacity-90`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>

            <p className={`text-xs text-center ${accentText} opacity-60`}>
              Password baru akan aktif pada login berikutnya
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────
function PatrolLoginScreen({
  division,
  onSuccess,
}: {
  division: "SECURITY" | "HSE";
  onSuccess: (user: { id: string; name: string; division: string }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSecurity = division === "SECURITY";
  const accentClass = isSecurity
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-green-600 hover:bg-green-700";
  const accentText = isSecurity ? "text-blue-400" : "text-green-400";
  const accentBg = isSecurity ? "bg-blue-600" : "bg-green-600";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/patrol-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal");
        return;
      }
      if (data.user.division !== division) {
        setError(
          `Akun ini terdaftar untuk divisi ${
            data.user.division === "HSE" ? "EHS&FS" : data.user.division
          }, bukan ${isSecurity ? "Security" : "EHS&FS"}`,
        );
        return;
      }
      onSuccess(data.user);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#0f2040 100%)" }}
    >
      <header className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
        <Link
          href="/"
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <img
          src="/mahkota.png"
          alt="Mahkota Group"
          className="w-9 h-9 rounded-xl object-contain"
        />
        <div>
          <p className="text-white font-bold text-sm">
            Login {isSecurity ? "Security" : "EHS&FS"}
          </p>
          <p className={`text-xs ${accentText}`}>Mahkota Group</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl ${accentBg}`}
            >
              {isSecurity ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <Leaf className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-white text-2xl font-bold">Login</h2>
            <p className="text-gray-400 text-sm mt-1">
              Patrol {isSecurity ? "Security" : "EHS&FS"}
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input-dark"
                placeholder="Masukkan username"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-dark pr-11"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
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

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-500/20">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 text-white ${accentClass}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-4">
            Hubungi admin jika belum memiliki akun login
          </p>
        </div>
      </main>
    </div>
  );
}

function PatrolContent() {
  const searchParams = useSearchParams();
  const division = searchParams.get("division") as "SECURITY" | "HSE" | null;
  const [loggedUser, setLoggedUser] = useState<{
    id: string;
    name: string;
    division: string;
  } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (!division || (division !== "SECURITY" && division !== "HSE")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Divisi tidak valid</p>
          <Link href="/" className="btn-primary">
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const isSecurity = division === "SECURITY";

  if (!loggedUser) {
    return (
      <PatrolLoginScreen
        division={division}
        onSuccess={(user) => setLoggedUser(user)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showChangePassword && (
        <ChangePasswordModal
          userId={loggedUser.id}
          division={division}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      <header
        className={`sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-sm ${
          isSecurity
            ? "bg-gradient-to-r from-blue-800 to-blue-700"
            : "bg-gradient-to-r from-green-800 to-green-700"
        }`}
      >
        <Link
          href="/"
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isSecurity ? "bg-blue-500" : "bg-green-500"
          }`}
        >
          {isSecurity ? (
            <Shield className="w-5 h-5 text-white" />
          ) : (
            <Leaf className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-white font-bold text-sm leading-none">
            Laporan Patrol {isSecurity ? "Security" : "EHS&FS"}
          </h1>
          <p className="text-white/60 text-xs mt-0.5">{loggedUser.name}</p>
        </div>

        {/* Change Password button */}
        <button
          onClick={() => setShowChangePassword(true)}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Ganti Password"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* Logout button */}
        <button
          onClick={() => setLoggedUser(null)}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Logout / Ganti Pengguna"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {isSecurity ? (
          <SecurityPatrolForm prefillUserId={loggedUser.id} />
        ) : (
          <HSEPatrolForm prefillUserId={loggedUser.id} />
        )}
      </main>
    </div>
  );
}

export default function PatrolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      }
    >
      <PatrolContent />
    </Suspense>
  );
}