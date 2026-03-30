// src/app/admin/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Username dan password wajib diisi"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login gagal"); return; }
      router.push("/admin/dashboard");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#0f2040 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl"
            style={{ background: "linear-gradient(135deg,#22c55e,#166534)" }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Sistem Patrol PT Intan Sejati Andalan</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="form-input-dark" placeholder="Masukkan username" autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className="form-input-dark pr-11" placeholder="Masukkan password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-500/20">
              <Shield className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Masuk...</> : "Masuk ke Admin Panel"}
          </button>
        </form>

        <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="text-yellow-400 text-xs font-medium">Default: admin / Admin@ISA2024</p>
          <p className="text-yellow-400/60 text-xs mt-0.5">Segera ganti password setelah login pertama</p>
        </div>
      </div>
    </div>
  );
}
