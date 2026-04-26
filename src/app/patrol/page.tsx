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
} from "lucide-react";
import SecurityPatrolForm from "@/components/patrol/SecurityPatrolForm";
import HSEPatrolForm from "@/components/patrol/HSEPatrolForm";

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
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
        <button
          onClick={() => setLoggedUser(null)}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
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