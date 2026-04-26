// src/app/admin/hse/page.tsx
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Leaf,
  AlertTriangle,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  MapPin,
  Target,
  Activity,
  Clock,
} from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "yearly";
const PERIOD_LABELS: Record<Period, string> = {
  daily: "Hari Ini",
  weekly: "1 Minggu",
  monthly: "1 Bulan",
  yearly: "1 Tahun",
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

const HAZARD_COLORS = [
  "#f97316", "#ef4444", "#f59e0b", "#84cc16",
  "#22c55e", "#06b6d4", "#6366f1", "#a855f7",
];

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

function StatCard({
  label, value, icon: Icon, color, bg, border, sub, trend,
}: {
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
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === p
              ? "bg-emerald-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

export default function HSEDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("weekly");

  const fetchStats = useCallback((p: Period) => {
    setLoading(true);
    fetch(`/api/reports/stats?period=${p}&type=HSE`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(period); }, [period, fetchStats]);

  const s = stats as {
    hseReports: number;
    reportsToday: number;
    periodData: { date: string; HSE: number }[];
    hazardDist: { type: string; count: number }[];
    byArea: { name: string; value: number }[];
    findingRate?: number;
    totalFindingsInPeriod?: number;
    findingsTrend?: { date: string; findings: number; clear: number }[];
    peakHours?: { hour: string; count: number }[];
  } | null;

  const hseTrend = s ? computeTrend(s.periodData.map((d) => d.HSE)) : "flat";

  const pieData = s?.hazardDist.slice(0, 6).map((d, i) => ({
    name: HAZARD_LABELS[d.type] ?? d.type,
    value: d.count,
    color: HAZARD_COLORS[i % HAZARD_COLORS.length],
  })) ?? [];

  return (
    <AdminShell requiredRoles={["SUPER_ADMIN", "VIEWER", "HSE_ADMIN", "HSE_VIEWER"]}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-white text-2xl font-bold">Dashboard EHS&FS</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">Analitik laporan kunjungan EHS&FS</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : !s ? (
          <div className="text-center py-20 text-gray-500">Gagal memuat data</div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Total Laporan EHS&FS"
                value={s.hseReports}
                icon={Leaf}
                color="text-emerald-400"
                bg="bg-emerald-500/10"
                border="border-emerald-500/20"
                sub={`${s.reportsToday} hari ini`}
                trend={hseTrend}
              />
              <StatCard
                label="Jenis Bahaya Teridentifikasi"
                value={s.hazardDist.length}
                icon={AlertTriangle}
                color="text-orange-400"
                bg="bg-orange-500/10"
                border="border-orange-500/20"
                sub="tipe bahaya berbeda"
              />
              <StatCard
                label="Total Kunjungan Area"
                value={s.byArea.reduce((a, b) => a + b.value, 0)}
                icon={MapPin}
                color="text-cyan-400"
                bg="bg-cyan-500/10"
                border="border-cyan-500/20"
                sub="semua waktu"
              />
              <StatCard
                label="Total Identifikasi Bahaya"
                value={s.hazardDist.reduce((a, b) => a + b.count, 0)}
                icon={Target}
                color="text-red-400"
                bg="bg-red-500/10"
                border="border-red-500/20"
                sub={`periode ini`}
              />
            </div>

            {/* Period selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <SectionTitle
                icon={BarChart2}
                title="Analitik Periode"
                sub="Pilih rentang waktu untuk grafik di bawah"
              />
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            {/* ── Laporan per periode ── */}
            <div className="card-dark p-4">
              <SectionTitle
                icon={BarChart2}
                title={`Laporan EHS&FS – ${PERIOD_LABELS[period]}`}
              />
              {s.periodData.some((d) => d.HSE > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={s.periodData} barSize={9}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="HSE" name="EHS&FS" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </div>

            {/* ── Hazard distribution + Pie chart ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {s.hazardDist.length > 0 ? (
                <div className="card-dark p-4">
                  <SectionTitle
                    icon={AlertTriangle}
                    title={`Top Potensi Bahaya – ${PERIOD_LABELS[period]}`}
                  />
                  <ResponsiveContainer width="100%" height={Math.max(160, s.hazardDist.length * 38)}>
                    <BarChart
                      data={s.hazardDist.map((d) => ({
                        ...d,
                        label: HAZARD_LABELS[d.type] ?? d.type,
                      }))}
                      layout="vertical"
                      barSize={14}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Frekuensi" fill="#fb923c" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="card-dark p-4">
                  <SectionTitle icon={AlertTriangle} title="Top Potensi Bahaya" />
                  <EmptyChart />
                </div>
              )}

              {/* Pie chart for hazard distribution */}
              <div className="card-dark p-4">
                <SectionTitle
                  icon={Activity}
                  title="Distribusi Potensi Bahaya"
                  sub={`Periode ${PERIOD_LABELS[period]}`}
                />
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </div>

            {/* ── Kunjungan per area (all time) ── */}
            {s.byArea.length > 0 && (
              <div className="card-dark p-4">
                <SectionTitle
                  icon={TrendingUp}
                  title="Kunjungan per Area (Semua Waktu)"
                  sub="Total kunjungan yang telah dilakukan per area"
                />
                <ResponsiveContainer width="100%" height={Math.max(160, s.byArea.length * 44)}>
                  <BarChart data={s.byArea} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={180} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="value" name="Kunjungan" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Tren kunjungan per periode (area chart) ── */}
            {s.findingsTrend && s.findingsTrend.some((d) => d.findings + d.clear > 0) && (
              <div className="card-dark p-4">
                <SectionTitle
                  icon={Activity}
                  title={`Tren Kunjungan EHS&FS – ${PERIOD_LABELS[period]}`}
                  sub="Tren laporan kunjungan dari waktu ke waktu"
                />
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={s.findingsTrend}>
                    <defs>
                      <linearGradient id="gHSETrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="clear"
                      name="Kunjungan"
                      stroke="#22c55e"
                      fill="url(#gHSETrend)"
                      strokeWidth={2}
                      dot={{ fill: "#22c55e", r: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Jam puncak kunjungan ── */}
            {s.peakHours && s.peakHours.some((h) => h.count > 0) && (
              <div className="card-dark p-4">
                <SectionTitle
                  icon={Clock}
                  title={`Distribusi Jam Kunjungan EHS&FS – ${PERIOD_LABELS[period]}`}
                  sub="Kapan laporan EHS&FS paling sering masuk"
                />
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={s.peakHours} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, "Laporan"]} />
                    <Bar dataKey="count" name="Laporan" radius={[3, 3, 0, 0]}>
                      {s.peakHours.map((entry, index) => {
                        const maxCount = Math.max(...s.peakHours!.map((h) => h.count), 1);
                        const t = entry.count / maxCount;
                        const r = Math.round(34 + t * 188);
                        const g = Math.round(197 - t * 107);
                        const b = Math.round(94 + t * 30);
                        return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Warna hijau terang = jam sibuk, hijau gelap = sepi
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}