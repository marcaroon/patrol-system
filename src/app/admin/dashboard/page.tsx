// src/app/admin/dashboard/page.tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
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
  AreaChart,
  Area,
} from "recharts";
import {
  FileText,
  Shield,
  Leaf,
  AlertTriangle,
  Loader2,
  Trash2,
  X,
  TriangleAlert,
  KeyRound,
  CheckCircle2,
  Timer,
  Clock,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Zap,
  Target,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
type Period = "daily" | "weekly" | "monthly";

interface PatrolTimeStat {
  avg: number;
  total: number;
  min: number;
  max: number;
  count: number;
  durationDist: { label: string; count: number }[];
  trend: { date: string; avgMinutes: number; count: number }[];
}

interface StatsData {
  totalReports: number;
  securityReports: number;
  hseReports: number;
  totalFindings: number;
  reportsToday: number;
  last7Days: { date: string; Security: number; HSE: number }[];
  byArea: { name: string; value: number }[];
  period: Period;
  periodData: { date: string; Security: number; HSE: number }[];
  patrolTimeStats: PatrolTimeStat;
  findingsByArea: { name: string; findings: number; inspections: number }[];
  findingsTrend: { date: string; findings: number; clear: number }[];
  findingRate: number;
  totalFindingsInPeriod: number;
  hazardDist: { type: string; count: number }[];
  peakHours: { hour: string; count: number }[];
}

// ── Constants ─────────────────────────────────────────────────────
const PERIOD_LABELS: Record<Period, string> = {
  daily: "7 Hari",
  weekly: "7 Minggu",
  monthly: "12 Bulan",
};

const COLORS = {
  security: "#3b82f6",
  hse: "#22c55e",
  finding: "#f97316",
  clear: "#6366f1",
  time: "#a78bfa",
  pink: "#f472b6",
};

const HAZARD_LABELS: Record<string, string> = {
  TERJATUH: "Terjatuh",
  TERGELINCIR: "Tergelincir",
  TERKENA_BENDA_TAJAM: "Benda Tajam",
  TERBAKAR: "Kebakaran",
  TERSENGAT_LISTRIK: "Listrik",
  TERTIMPA_BENDA: "Tertimpa",
  TERHIRUP_GAS: "Gas Berbahaya",
  KONTAK_BAHAN_KIMIA: "Bahan Kimia",
  KEBISINGAN: "Kebisingan",
  KELELAHAN: "Kelelahan",
  LAINNYA: "Lainnya",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  },
};

// ── Helpers ───────────────────────────────────────────────────────
function fmtMin(min: number): string {
  if (min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

function computeTrend(arr: number[]): "up" | "down" | "flat" {
  if (arr.length < 2) return "flat";
  const half = Math.floor(arr.length / 2);
  const first = arr.slice(0, half).reduce((a, b) => a + b, 0);
  const last = arr.slice(half).reduce((a, b) => a + b, 0);
  if (last > first * 1.1) return "up";
  if (last < first * 0.9) return "down";
  return "flat";
}

// ── Sub-components ────────────────────────────────────────────────
function EmptyChart({ h = 180 }: { h?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height: h }}>
      <p className="text-gray-600 text-sm">Belum ada data</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-gray-300" />
      </div>
      <div>
        <h2 className="text-white font-semibold text-sm leading-tight">{title}</h2>
        {sub && <p className="text-gray-500 text-xs">{sub}</p>}
      </div>
    </div>
  );
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === p ? "bg-green-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, bg, border, sub, trend,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; border: string; sub?: string; trend?: "up" | "down" | "flat";
}) {
  const TIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const tc = trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-500";
  return (
    <div className={`rounded-2xl border p-4 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 ${tc} text-xs font-medium`}>
          <TIcon className="w-3 h-3" />
          <span>{trend === "up" ? "Meningkat" : trend === "down" ? "Menurun" : "Stabil"}</span>
        </div>
      )}
    </div>
  );
}

// ── Purge Modal ───────────────────────────────────────────────────
const CONFIRM_PHRASE = "HAPUS SEMUA LAPORAN";
type PurgeStep = "warn" | "type" | "done";

function PurgeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<PurgeStep>("warn");
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "type") setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const handlePurge = async () => {
    if (typed.trim().toUpperCase() !== CONFIRM_PHRASE) { setError("Frasa konfirmasi tidak cocok"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/reports/purge", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmToken: "HAPUS_SEMUA_LAPORAN" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal menghapus"); return; }
      setStep("done");
    } catch { setError("Gagal terhubung ke server"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl overflow-hidden">
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
        {step === "warn" && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 space-y-2">
              <p className="text-red-300 font-semibold text-sm">⚠ Tindakan ini tidak dapat dibatalkan!</p>
              <ul className="text-red-400/80 text-xs space-y-1 list-disc pl-4">
                <li>Seluruh laporan Security akan dihapus permanen</li>
                <li>Seluruh laporan HSE akan dihapus permanen</li>
                <li>Semua foto, temuan, dan data terkait akan hilang</li>
                <li>Data personel, area patrol, dan akun admin <strong className="text-white">tidak</strong> akan terpengaruh</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">Batal</button>
              <button onClick={() => setStep("type")} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <KeyRound className="w-4 h-4" /> Lanjut Konfirmasi
              </button>
            </div>
          </div>
        )}
        {step === "type" && (
          <div className="p-5 space-y-4">
            <p className="text-gray-300 text-sm">Ketik frasa berikut untuk konfirmasi:</p>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center">
              <p className="font-mono font-bold text-red-300 tracking-wider text-sm select-all">{CONFIRM_PHRASE}</p>
            </div>
            <input ref={inputRef} type="text" value={typed}
              onChange={(e) => { setTyped(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handlePurge()}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ketik frasa di atas..." spellCheck={false} autoComplete="off" />
            {error && <p className="text-red-400 text-xs flex items-center gap-1.5"><TriangleAlert className="w-3.5 h-3.5" />{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setStep("warn"); setTyped(""); setError(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">Kembali</button>
              <button onClick={handlePurge} disabled={loading || typed.trim().toUpperCase() !== CONFIRM_PHRASE}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? "Menghapus..." : "Hapus Semua"}
              </button>
            </div>
          </div>
        )}
        {step === "done" && (
          <div className="p-5 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-bold">Laporan Berhasil Dihapus</p>
              <p className="text-gray-400 text-sm mt-1">Semua data laporan Security & HSE telah dihapus.</p>
            </div>
            <button onClick={() => { onSuccess(); onClose(); }} className="w-full px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
              Tutup & Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");
  const [showPurge, setShowPurge] = useState(false);
  const [session, setSession] = useState<{ role: string } | null>(null);

  const fetchStats = useCallback((p: Period) => {
    setLoading(true);
    fetch(`/api/reports/stats?period=${p}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.error) throw new Error(d.error); setStats(d); })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(period); }, [period, fetchStats]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSession({ role: d.role }))
      .catch(() => {});
  }, []);

  // Derived
  const secTrend = stats ? computeTrend(stats.periodData.map((d) => d.Security)) : "flat";
  const findTrend = stats ? computeTrend(stats.findingsTrend.map((d) => d.findings)) : "flat";
  const timeTrend = stats ? computeTrend(stats.patrolTimeStats.trend.map((d) => d.avgMinutes)) : "flat";
  const pieData = stats
    ? [
        { name: "Security", value: stats.securityReports, color: COLORS.security },
        { name: "HSE", value: stats.hseReports, color: COLORS.hse },
      ]
    : [];

  return (
    <AdminShell>
      {showPurge && (
        <PurgeModal onClose={() => setShowPurge(false)} onSuccess={() => fetchStats(period)} />
      )}

      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Analitik laporan patrol Security & HSE</p>
          </div>
          {session?.role === "SUPER_ADMIN" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5">
              <TriangleAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 text-xs font-medium">Danger Zone</span>
              <button onClick={() => setShowPurge(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors ml-1">
                <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Laporan
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto" />
              <p className="text-gray-500 text-sm">Memuat analitik...</p>
            </div>
          </div>
        ) : !stats ? (
          <div className="text-center py-20 text-gray-500">Gagal memuat data dashboard</div>
        ) : (
          <>
            {/* ══ 1. RINGKASAN UTAMA ══════════════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Laporan" value={stats.totalReports} icon={FileText} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" sub={`${stats.reportsToday} hari ini`} trend={secTrend} />
              <StatCard label="Laporan Security" value={stats.securityReports} icon={Shield} color="text-indigo-400" bg="bg-indigo-500/10" border="border-indigo-500/20" />
              <StatCard label="Laporan HSE" value={stats.hseReports} icon={Leaf} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
              <StatCard label="Total Temuan" value={stats.totalFindings} icon={AlertTriangle} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" trend={findTrend} />
            </div>

            {/* ══ 2. PERIOD SELECTOR + PATROL TIME SUMMARY ════════════ */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <SectionTitle icon={Timer} title="Analitik Periode" sub="Pilih rentang waktu untuk semua grafik di bawah" />
                <PeriodSelector value={period} onChange={setPeriod} />
              </div>

              {/* Patrol time summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-purple-400" />
                    <p className="text-gray-400 text-xs">Rata-rata Durasi</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-300">{fmtMin(stats.patrolTimeStats.avg)}</p>
                  <p className="text-gray-500 text-xs mt-1">per laporan Security</p>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <p className="text-gray-400 text-xs">Total Waktu Patrol</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-300">{fmtMin(stats.patrolTimeStats.total)}</p>
                  <p className="text-gray-500 text-xs mt-1">kumulatif periode ini</p>
                </div>
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <p className="text-gray-400 text-xs">Tercepat</p>
                  </div>
                  <p className="text-2xl font-bold text-green-300">{fmtMin(stats.patrolTimeStats.min)}</p>
                  <p className="text-gray-500 text-xs mt-1">durasi minimum</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <p className="text-gray-400 text-xs">Terlama</p>
                  </div>
                  <p className="text-2xl font-bold text-red-300">{fmtMin(stats.patrolTimeStats.max)}</p>
                  <p className="text-gray-500 text-xs mt-1">durasi maksimum</p>
                </div>
              </div>
            </div>

            {/* ══ 3. INSIGHT CARDS ════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/5 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Finding Rate</p>
                  <p className="text-2xl font-bold text-orange-300">{stats.findingRate}%</p>
                  <p className="text-gray-500 text-xs mt-0.5">{stats.totalFindingsInPeriod} temuan / {PERIOD_LABELS[period]}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Laporan Terukur</p>
                  <p className="text-2xl font-bold text-cyan-300">{stats.patrolTimeStats.count}</p>
                  <p className="text-gray-500 text-xs mt-0.5">dengan data waktu lengkap</p>
                </div>
              </div>
              <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-purple-500/5 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Tren Waktu Patrol</p>
                  <p className="text-2xl font-bold text-pink-300">
                    {timeTrend === "up" ? "↑ Naik" : timeTrend === "down" ? "↓ Turun" : "→ Stabil"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">rata-rata durasi</p>
                </div>
              </div>
            </div>

            {/* ══ 4. LAPORAN PER PERIODE + PIE ════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card-dark p-4">
                <SectionTitle icon={BarChart2} title={`Laporan per Periode – ${PERIOD_LABELS[period]}`} />
                {stats.periodData.some((d) => d.Security + d.HSE > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.periodData} barSize={period === "monthly" ? 12 : 9} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                      <Bar dataKey="Security" fill={COLORS.security} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="HSE" fill={COLORS.hse} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
              <div className="card-dark p-4">
                <SectionTitle icon={FileText} title="Distribusi Tipe" />
                {stats.totalReports > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>

            {/* ══ 5. TREN WAKTU PATROL + DISTRIBUSI DURASI ════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card-dark p-4">
                <SectionTitle icon={Timer} title="Tren Rata-rata Durasi Patrol" sub={`Menit per periode – ${PERIOD_LABELS[period]}`} />
                {stats.patrolTimeStats.trend.some((d) => d.avgMinutes > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.patrolTimeStats.trend}>
                      <defs>
                        <linearGradient id="gTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.time} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.time} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} unit="m" />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v} menit`, "Rata-rata"]} />
                      <Area type="monotone" dataKey="avgMinutes" name="Rata-rata (menit)" stroke={COLORS.time} fill="url(#gTime)" strokeWidth={2} dot={{ fill: COLORS.time, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
              <div className="card-dark p-4">
                <SectionTitle icon={Clock} title="Distribusi Durasi" sub="Persebaran waktu patrol" />
                {stats.patrolTimeStats.durationDist.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.patrolTimeStats.durationDist} layout="vertical" barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={54} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Laporan" fill={COLORS.time} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>

            {/* ══ 6. TREN TEMUAN ══════════════════════════════════════ */}
            <div className="card-dark p-4">
              <SectionTitle icon={AlertTriangle} title="Tren Temuan vs. Kondisi Normal" sub={`Jumlah inspeksi per periode – ${PERIOD_LABELS[period]}`} />
              {stats.findingsTrend.some((d) => d.findings + d.clear > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.findingsTrend}>
                    <defs>
                      <linearGradient id="gFind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.finding} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.finding} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gClear" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.clear} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.clear} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                    <Area type="monotone" dataKey="findings" name="Ada Temuan" stroke={COLORS.finding} fill="url(#gFind)" strokeWidth={2} dot={{ fill: COLORS.finding, r: 2 }} />
                    <Area type="monotone" dataKey="clear" name="Tidak Ada Temuan" stroke={COLORS.clear} fill="url(#gClear)" strokeWidth={2} dot={{ fill: COLORS.clear, r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </div>

            {/* ══ 7. TEMUAN PER AREA + DISTRIBUSI BAHAYA HSE ══════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card-dark p-4">
                <SectionTitle icon={MapPin} title="Temuan & Inspeksi per Area" sub={`Periode ${PERIOD_LABELS[period]}`} />
                {stats.findingsByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(160, stats.findingsByArea.length * 48)}>
                    <BarChart data={stats.findingsByArea} layout="vertical" barSize={12} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                      <Bar dataKey="findings" name="Temuan" fill={COLORS.finding} radius={[0, 3, 3, 0]} />
                      <Bar dataKey="inspections" name="Total Inspeksi" fill={COLORS.clear} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
              <div className="card-dark p-4">
                <SectionTitle icon={AlertTriangle} title="Top Potensi Bahaya HSE" sub={`Periode ${PERIOD_LABELS[period]}`} />
                {stats.hazardDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(160, stats.hazardDist.length * 38)}>
                    <BarChart
                      data={stats.hazardDist.map((d) => ({ ...d, label: HAZARD_LABELS[d.type] ?? d.type }))}
                      layout="vertical" barSize={14}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Frekuensi" fill="#fb923c" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>

            {/* ══ 8. JAM PUNCAK PATROL ════════════════════════════════ */}
            <div className="card-dark p-4">
              <SectionTitle icon={Clock} title="Distribusi Jam Patrol Security" sub={`Kapan laporan paling sering masuk – ${PERIOD_LABELS[period]}`} />
              {stats.peakHours.some((h) => h.count > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.peakHours} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, "Laporan"]} />
                      <Bar dataKey="count" name="Laporan" radius={[3, 3, 0, 0]}>
                        {stats.peakHours.map((entry, index) => {
                          const maxCount = Math.max(...stats.peakHours.map((h) => h.count), 1);
                          const t = entry.count / maxCount;
                          // cool-to-warm gradient: blue → indigo → orange
                          const r = Math.round(59 + t * 196);
                          const g = Math.round(130 - t * 84);
                          const b = Math.round(246 - t * 180);
                          return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-600 text-center mt-1">Warna merah = jam sibuk, biru = sepi</p>
                </>
              ) : <EmptyChart />}
            </div>

            {/* ══ 9. ALL-TIME AREA VISITS ══════════════════════════════ */}
            {stats.byArea.length > 0 && (
              <div className="card-dark p-4">
                <SectionTitle icon={TrendingUp} title="Total Kunjungan per Area (Semua Waktu)" />
                <ResponsiveContainer width="100%" height={Math.max(160, stats.byArea.length * 44)}>
                  <BarChart data={stats.byArea} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={200} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="value" name="Kunjungan" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}