// src/app/admin/dashboard/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { DashboardStats } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  Shield,
  Leaf,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Loader2,
  Trash2,
  X,
  TriangleAlert,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

// ── Purge confirmation modal ──────────────────────────────────────
const CONFIRM_PHRASE = "HAPUS SEMUA LAPORAN";

type PurgeStep = "idle" | "warn" | "type" | "done";

function PurgeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<PurgeStep>("warn");
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when reaching step "type"
  useEffect(() => {
    if (step === "type") setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const handlePurge = async () => {
    if (typed.trim().toUpperCase() !== CONFIRM_PHRASE) {
      setError("Frasa konfirmasi tidak cocok");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports/purge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmToken: "HAPUS_SEMUA_LAPORAN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menghapus");
        return;
      }
      setStep("done");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TriangleAlert className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-red-300 font-bold text-sm">Hapus Semua Laporan</p>
          </div>
          {step !== "done" && (
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Step 1: Warning ── */}
        {step === "warn" && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 space-y-2">
              <p className="text-red-300 font-semibold text-sm">⚠ Tindakan ini tidak dapat dibatalkan!</p>
              <ul className="text-red-400/80 text-xs space-y-1 list-disc pl-4">
                <li>Seluruh laporan Security akan dihapus permanen</li>
                <li>Seluruh laporan HSE akan dihapus permanen</li>
                <li>Semua foto, temuan, dan data tanda tangan terkait akan hilang</li>
                <li>Data personel, area patrol, dan akun admin <strong className="text-white">tidak</strong> akan terpengaruh</li>
              </ul>
            </div>
            <p className="text-gray-400 text-xs text-center">
              Fitur ini ditujukan untuk kebutuhan development / reset data awal.<br />
              Pastikan Anda sudah backup data jika diperlukan.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                Batal
              </button>
              <button
                onClick={() => setStep("type")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Lanjut Konfirmasi
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Type confirmation phrase ── */}
        {step === "type" && (
          <div className="p-5 space-y-4">
            <p className="text-gray-300 text-sm">
              Ketik frasa berikut untuk mengkonfirmasi penghapusan:
            </p>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center">
              <p className="font-mono font-bold text-red-300 tracking-wider text-sm select-all">
                {CONFIRM_PHRASE}
              </p>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => { setTyped(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePurge()}
              placeholder="Ketik frasa di atas..."
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              spellCheck={false}
              autoComplete="off"
            />
            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setStep("warn"); setTyped(""); setError(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                Kembali
              </button>
              <button
                onClick={handlePurge}
                disabled={loading || typed.trim().toUpperCase() !== CONFIRM_PHRASE}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? "Menghapus..." : "Hapus Semua Laporan"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="p-5 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-base">Laporan Berhasil Dihapus</p>
              <p className="text-gray-400 text-sm mt-1">
                Semua data laporan Security &amp; HSE telah dihapus dari database.
              </p>
            </div>
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="w-full px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              Tutup &amp; Refresh Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard page ───────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurge, setShowPurge] = useState(false);
  const [session, setSession] = useState<{ role: string } | null>(null);

  const fetchStats = () => {
    setLoading(true);
    fetch("/api/reports/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch stats");
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStats(d);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    fetch("/api/auth/session")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSession({ role: d.role }))
      .catch(() => {});
  }, []);

  const cards = stats
    ? [
        {
          label: "Total Laporan",
          value: stats.totalReports,
          icon: FileText,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        },
        {
          label: "Laporan Hari Ini",
          value: stats.reportsToday,
          icon: Calendar,
          color: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/20",
        },
        {
          label: "Total Security",
          value: stats.securityReports,
          icon: Shield,
          color: "text-indigo-400",
          bg: "bg-indigo-500/10",
          border: "border-indigo-500/20",
        },
        {
          label: "Total HSE",
          value: stats.hseReports,
          icon: Leaf,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        },
        {
          label: "Total Temuan",
          value: stats.totalFindings,
          icon: AlertTriangle,
          color: "text-orange-400",
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
        },
        {
          label: "Area Patroli",
          value: stats.byArea?.length ?? 0,
          icon: TrendingUp,
          color: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
        },
      ]
    : [];

  const pieData = stats
    ? [
        { name: "Security", value: stats.securityReports, color: "#3b82f6" },
        { name: "HSE", value: stats.hseReports, color: "#22c55e" },
      ]
    : [];

  return (
    <AdminShell>
      {showPurge && (
        <PurgeModal
          onClose={() => setShowPurge(false)}
          onSuccess={fetchStats}
        />
      )}

      <div className="space-y-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Ringkasan laporan patrol Security &amp; HSE
            </p>
          </div>

          {/* Danger zone – only for SUPER_ADMIN */}
          {session?.role === "SUPER_ADMIN" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5">
              <TriangleAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-xs font-medium">Danger Zone</span>
              <button
                onClick={() => setShowPurge(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua Laporan
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : (
          stats && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {cards.map((c) => (
                  <div
                    key={c.label}
                    className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">{c.label}</p>
                        <p className={`text-3xl font-bold ${c.color}`}>
                          {c.value}
                        </p>
                      </div>
                      <div
                        className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}
                      >
                        <c.icon className={`w-4 h-4 ${c.color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar chart */}
                <div className="lg:col-span-2 card-dark p-4">
                  <h2 className="text-white font-semibold text-sm mb-4">
                    Laporan 7 Hari Terakhir
                  </h2>
                  {stats.last7Days && stats.last7Days.length > 0 ? (
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={stats.last7Days} barSize={10} barGap={4}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
                        />
                        <Bar
                          dataKey="Security"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="HSE"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center">
                      <p className="text-gray-500 text-sm">
                        Belum ada data laporan
                      </p>
                    </div>
                  )}
                </div>

                {/* Pie chart */}
                <div className="card-dark p-4">
                  <h2 className="text-white font-semibold text-sm mb-4">
                    Distribusi Laporan
                  </h2>
                  {stats.totalReports > 0 ? (
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Belum ada laporan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Area bar */}
              {stats.byArea && stats.byArea.length > 0 && (
                <div className="card-dark p-4">
                  <h2 className="text-white font-semibold text-sm mb-4">
                    Laporan per Area Patrol
                  </h2>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(160, stats.byArea.length * 44)}
                  >
                    <BarChart
                      data={stats.byArea}
                      layout="vertical"
                      barSize={16}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={200}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        name="Laporan"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )
        )}
      </div>
    </AdminShell>
  );
}