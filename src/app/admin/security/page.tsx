// src/app/admin/security/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  FileText,
  Shield,
  AlertTriangle,
  Loader2,
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

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Hari Ini",
  weekly: "1 Minggu",
  monthly: "1 Bulan",
  yearly: "1 Tahun",
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

function EmptyChart({ h = 180 }: { h?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height: h }}>
      <p className="text-gray-600 text-sm">Belum ada data</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border, sub, trend }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; border: string; sub?: string;
  trend?: "up" | "down" | "flat";
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

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${value === p ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`}>
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

export default function SecurityDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("weekly");

  const fetchStats = useCallback((p: Period) => {
    setLoading(true);
    fetch(`/api/reports/stats?period=${p}&type=SECURITY`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(period); }, [period, fetchStats]);

  const s = stats as {
    securityReports: number; totalFindings: number; reportsToday: number;
    periodData: { date: string; Security: number }[];
    patrolTimeStats: { avg: number; total: number; min: number; max: number; count: number; durationDist: { label: string; count: number }[]; trend: { date: string; avgMinutes: number; count: number }[] };
    findingsByArea: { name: string; findings: number; inspections: number }[];
    findingsTrend: { date: string; findings: number; clear: number }[];
    findingRate: number; totalFindingsInPeriod: number;
    peakHours: { hour: string; count: number }[];
    byArea: { name: string; value: number }[];
  } | null;

  const secTrend = s ? computeTrend(s.periodData.map((d) => d.Security)) : "flat";

  return (
    <AdminShell requiredRoles={["SUPER_ADMIN", "VIEWER", "SECURITY_ADMIN", "SECURITY_VIEWER"]}>
      <div className="space-y-6 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <h1 className="text-white text-2xl font-bold">Dashboard Security</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">Analitik laporan patrol Security</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : !s ? (
          <div className="text-center py-20 text-gray-500">Gagal memuat data</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard label="Total Laporan Security" value={s.securityReports}
                icon={Shield} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20"
                sub={`${s.reportsToday} hari ini`} trend={secTrend} />
              <StatCard label="Total Temuan" value={s.totalFindings}
                icon={AlertTriangle} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
              <StatCard label="Finding Rate" value={`${s.findingRate}%`}
                icon={Target} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20"
                sub={`${s.totalFindingsInPeriod} temuan periode ini`} />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" /> Laporan per Periode
              </p>
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Rata-rata Durasi", value: fmtMin(s.patrolTimeStats.avg), icon: Timer, color: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                { label: "Total Waktu", value: fmtMin(s.patrolTimeStats.total), icon: Activity, color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                { label: "Tercepat", value: fmtMin(s.patrolTimeStats.min), icon: Zap, color: "text-green-300", bg: "bg-green-500/10", border: "border-green-500/20" },
                { label: "Terlama", value: fmtMin(s.patrolTimeStats.max), icon: Clock, color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
              ].map((c, i) => (
                <div key={i} className={`rounded-2xl border ${c.bg} ${c.border} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                    <p className="text-gray-400 text-xs">{c.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            <div className="card-dark p-4">
              <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" /> Laporan Security – {PERIOD_LABELS[period]}
              </p>
              {s.periodData.some((d) => d.Security > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={s.periodData} barSize={9}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="Security" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </div>

            <div className="card-dark p-4">
              <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" /> Tren Temuan
              </p>
              {s.findingsTrend.some((d) => d.findings + d.clear > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={s.findingsTrend}>
                    <defs>
                      <linearGradient id="gFindSec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="findings" name="Ada Temuan" stroke="#f97316" fill="url(#gFindSec)" strokeWidth={2} />
                    <Area type="monotone" dataKey="clear" name="Tidak Ada Temuan" stroke="#6366f1" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card-dark p-4">
                <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" /> Temuan per Area
                </p>
                {s.findingsByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(160, s.findingsByArea.length * 48)}>
                    <BarChart data={s.findingsByArea} layout="vertical" barSize={12} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="findings" name="Temuan" fill="#f97316" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="inspections" name="Inspeksi" fill="#6366f1" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>

              <div className="card-dark p-4">
                <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Jam Puncak Patrol
                </p>
                {s.peakHours.some((h) => h.count > 0) ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={s.peakHours} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Laporan" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>

            {s.byArea.length > 0 && (
              <div className="card-dark p-4">
                <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" /> Total Kunjungan per Area (Semua Waktu)
                </p>
                <ResponsiveContainer width="100%" height={Math.max(160, s.byArea.length * 44)}>
                  <BarChart data={s.byArea} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={180} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="value" name="Kunjungan" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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